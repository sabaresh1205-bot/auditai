import type { AuditInputV1, ToolUsageInput } from "@/lib/audit/types";
import type { PlanType, ToolId } from "@/lib/audit/types";
import { getKnownPlanPriceUsd, getToolDisplayName, PRICING_USD } from "@/lib/audit/pricing";

export type Severity = "low" | "medium" | "high";

export type RecommendationType =
  | "REMOVE_TOOL"
  | "REPLACE_TOOL"
  | "DOWNGRADE_PLAN"
  | "OPTIMIZE_USAGE"
  | "CREDIT_DISCOUNT"
  | "NO_CHANGE";

export type Confidence = "high" | "medium";

export type Recommendation = {
  tool: string;
  toolId: ToolId;
  type: RecommendationType;
  confidence: Confidence;
  impact: string; // <= 12 words, deterministic template
  currentSpend: number; // per month
  recommendedAction: string;
  estimatedSavings: number; // per month
  reason: string; // one clear sentence
  severity: Severity;
};

export type RuleContext = {
  input: AuditInputV1;
  totalMonthlySpend: number;
  toolSpendById: Map<ToolId, number>;
  toolById: Map<ToolId, ToolUsageInput[]>;
};

export type Rule = {
  id: string;
  description: string;
  apply: (ctx: RuleContext) => Recommendation[];
};

function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

function clampSavings(currentSpend: number, targetSpend: number): number {
  // Savings should never exceed current spend, and never be negative.
  return money(Math.max(0, Math.min(currentSpend, currentSpend - targetSpend)));
}

function severityFromSavings(savings: number): Severity {
  if (savings >= 200) return "high";
  if (savings >= 50) return "medium";
  return "low";
}

function impactTemplate(type: RecommendationType, toolName: string): string {
  // Deterministic, template-driven impacts (keep under ~12 words).
  switch (type) {
    case "REMOVE_TOOL":
      return `Eliminates ${toolName} subscription spend.`;
    case "REPLACE_TOOL":
      return `Consolidates to one assistant to reduce spend.`;
    case "DOWNGRADE_PLAN":
      return `Avoids overpaying for higher tier features.`;
    case "OPTIMIZE_USAGE":
      return `Reduces ongoing spend without removing ${toolName}.`;
    case "CREDIT_DISCOUNT":
      return "Reduces overall spend via credits and discounts.";
    case "NO_CHANGE":
    default:
      return "Confirms current setup is cost-effective.";
  }
}

function isSeatBased(toolId: ToolId): boolean {
  return toolId !== "openai_api" && toolId !== "anthropic_api";
}

function hasTool(ctx: RuleContext, toolId: ToolId): boolean {
  return (ctx.toolById.get(toolId)?.length ?? 0) > 0;
}

function toolSpend(ctx: RuleContext, toolId: ToolId): number {
  return ctx.toolSpendById.get(toolId) ?? 0;
}

function seatTotal(ctx: RuleContext, toolId: ToolId): number {
  const rows = ctx.toolById.get(toolId) ?? [];
  return rows.reduce((sum, r) => sum + (Number.isFinite(r.seats) ? r.seats : 0), 0);
}

function pickDowngradePlan(toolId: ToolId, currentPlan: PlanType): PlanType | null {
  // Deterministic downgrade ladders per tool.
  // Reasoning: Most startups do not need enterprise controls; business/team usually only needed once org size grows.
  const ladder: PlanType[] =
    toolId === "github_copilot"
      ? ["enterprise", "business", "pro"]
      : toolId === "cursor"
        ? ["enterprise", "business", "pro"]
        : toolId === "chatgpt" || toolId === "claude"
          ? ["enterprise", "team", "pro"]
          : toolId === "gemini"
            ? ["enterprise", "business", "pro"]
            : ["enterprise", "business", "team", "pro", "starter", "free"];

  const i = ladder.indexOf(currentPlan);
  if (i <= 0) return null;
  return ladder[i + 1] ?? null;
}

function targetSpendIfPlan(toolId: ToolId, planType: PlanType, seats: number): number | null {
  const price = getKnownPlanPriceUsd(toolId, planType);
  if (price == null) return null;
  if (!isSeatBased(toolId)) return null;
  return money(price * Math.max(1, seats));
}

/**
 * Rule (a): Overkill plan detection
 *
 * Reasoning:
 * - Enterprise/Business/Team tiers are primarily justified by admin/security features and org scale.
 * - For very small teams, those features are commonly unused, making the plan overkill.
 * - We suggest the next lower tier and compute savings using the pricing catalog.
 */
export const overkillPlanRule: Rule = {
  id: "overkill_plan",
  description: "Detect overkill plans for small teams and suggest downgrades.",
  apply: (ctx) => {
    const recs: Recommendation[] = [];

    for (const row of ctx.input.tools) {
      if (!isSeatBased(row.toolId)) continue;
      if (row.toolId === "other") continue;

      const pricing = (PRICING_USD as Partial<Record<ToolId, any>>)[row.toolId];
      const plan = pricing?.plans?.[row.planType];
      if (!plan) continue;

      const teamSize = ctx.input.teamSize;
      const intended = plan.intendedTeamSize as { min: number; max: number } | undefined;
      if (!intended) continue;

      // Trigger only when team is clearly below the intended minimum (avoids noisy recommendations).
      if (teamSize >= intended.min) continue;

      const downgrade = pickDowngradePlan(row.toolId, row.planType);
      if (!downgrade) continue;

      const target = targetSpendIfPlan(row.toolId, downgrade, row.seats);
      if (target == null) continue;

      const savings = clampSavings(row.monthlySpend, target);
      if (savings <= 0) continue;

      const toolName = getToolDisplayName(row.toolId, row.toolNameOverride);
      recs.push({
        tool: toolName,
        toolId: row.toolId,
        type: "DOWNGRADE_PLAN",
        confidence: "high",
        impact: impactTemplate("DOWNGRADE_PLAN", toolName),
        currentSpend: money(row.monthlySpend),
        recommendedAction: `Downgrade from ${row.planType.toUpperCase()} to ${downgrade.toUpperCase()}.`,
        estimatedSavings: savings,
        reason: `Your team size (${teamSize}) is below the typical range for ${row.planType.toUpperCase()}, so you’re likely paying for admin features you don’t need.`,
        severity: severityFromSavings(savings),
      });
    }

    return recs;
  },
};

/**
 * Rule (b): Cost-per-seat analysis
 *
 * Reasoning:
 * - Seat-based products should roughly scale with active seats.
 * - Two common inefficiencies:
 *   1) Seats > team size (unused seats).
 *   2) Effective cost per seat is far above the catalog price for the selected plan (mis-entry or unmanaged upgrades).
 */
export const costPerSeatRule: Rule = {
  id: "cost_per_seat",
  description: "Detect unused seats and unusually high cost per seat.",
  apply: (ctx) => {
    const recs: Recommendation[] = [];

    for (const row of ctx.input.tools) {
      if (!isSeatBased(row.toolId)) continue;
      if (row.toolId === "other") continue;

      const price = getKnownPlanPriceUsd(row.toolId, row.planType);
      const seats = Math.max(1, row.seats);
      const teamSize = Math.max(1, ctx.input.teamSize);
      const toolName = getToolDisplayName(row.toolId, row.toolNameOverride);

      // 1) Unused seats (most concrete, low-risk savings)
      if (seats > teamSize && price != null && price > 0) {
        const removable = seats - teamSize;
        const target = money(price * teamSize);
        const savings = clampSavings(row.monthlySpend, target);

        if (savings > 0) {
          recs.push({
            tool: toolName,
            toolId: row.toolId,
            type: "OPTIMIZE_USAGE",
            confidence: "high",
            impact: impactTemplate("OPTIMIZE_USAGE", toolName),
            currentSpend: money(row.monthlySpend),
            recommendedAction: `Reduce seats from ${seats} to ${teamSize}.`,
            estimatedSavings: savings,
            reason: `You’re paying for ${removable} seat(s) more than your team size (${teamSize}), which is commonly unused spend.`,
            severity: severityFromSavings(savings),
          });
          continue;
        }
      }

      // 2) Cost per seat far above known price
      if (price != null && price > 0) {
        const effective = row.monthlySpend / seats;
        const high = effective > price * 1.35;
        if (high) {
          // Conservative recommendation: verify billing/seat assignment; savings assumes bringing spend down to catalog price.
          const target = money(price * seats);
          const savings = clampSavings(row.monthlySpend, target);

          if (savings > 0) {
            recs.push({
              tool: toolName,
              toolId: row.toolId,
              type: "OPTIMIZE_USAGE",
              confidence: "medium",
              impact: impactTemplate("OPTIMIZE_USAGE", toolName),
              currentSpend: money(row.monthlySpend),
              recommendedAction:
                "Verify billing tier and seat assignment; align per-seat pricing to the plan’s list price.",
              estimatedSavings: savings,
              reason: `Your effective cost/seat (${money(effective)}) is much higher than the typical ${money(price)}/seat for ${row.planType.toUpperCase()}.`,
              severity: severityFromSavings(savings),
            });
          }
        }
      }
    }

    return recs;
  },
};

/**
 * Rule (c): Redundant tools detection
 *
 * Reasoning:
 * - Many teams subscribe to multiple general-purpose LLM assistants (ChatGPT/Claude/Gemini) with overlapping value.
 * - For a single primary use case, consolidation usually maintains capability while reducing cost.
 * - Savings = dropping the most expensive overlapping LLM subscription (deterministic).
 */
export const redundantToolsRule: Rule = {
  id: "redundant_tools",
  description: "Detect redundant overlapping tools and recommend consolidation.",
  apply: (ctx) => {
    const recs: Recommendation[] = [];

    const llmTools: ToolId[] = ["chatgpt", "claude", "gemini"];
    const present = llmTools
      .filter((t) => hasTool(ctx, t))
      .map((t) => ({ toolId: t, spend: toolSpend(ctx, t) }))
      .filter((x) => x.spend > 0);

    if (present.length >= 2) {
      // Deterministically choose the most expensive to drop.
      const sorted = present.slice().sort((a, b) => b.spend - a.spend);
      const drop = sorted[0];
      const keep = sorted[1];

      const dropName = getToolDisplayName(drop.toolId);
      const keepName = getToolDisplayName(keep.toolId);
      const savings = money(drop.spend);

      recs.push({
        tool: dropName,
        toolId: drop.toolId,
        type: "REMOVE_TOOL",
        confidence: "high",
        impact: impactTemplate("REMOVE_TOOL", dropName),
        currentSpend: money(drop.spend),
        recommendedAction: `Consolidate LLM assistants: keep ${keepName} and cancel ${dropName}.`,
        estimatedSavings: savings,
        reason: `You’re paying for multiple general-purpose assistants (${present.length}), which usually overlap heavily for ${ctx.input.primaryUseCase}.`,
        severity: severityFromSavings(savings),
      });
    }

    // Redundancy: Cursor + Copilot for primary coding
    if (ctx.input.primaryUseCase === "coding" && hasTool(ctx, "cursor") && hasTool(ctx, "github_copilot")) {
      const copilotSpend = toolSpend(ctx, "github_copilot");
      if (copilotSpend > 0) {
        const toolName = getToolDisplayName("github_copilot");
        recs.push({
          tool: toolName,
          toolId: "github_copilot",
          currentSpend: money(copilotSpend),
          recommendedAction: "If Cursor is your primary IDE assistant, remove Copilot seats and consolidate to one coding assistant.",
          estimatedSavings: money(copilotSpend),
          reason: "Cursor and Copilot provide overlapping in-editor coding assistance, so paying for both is often redundant.",
          severity: severityFromSavings(copilotSpend),
          type: "REMOVE_TOOL",
          confidence: "high",
          impact: impactTemplate("REMOVE_TOOL", toolName),
        });
      }
    }

    return recs;
  },
};

/**
 * Rule (d): Alternative recommendation
 *
 * Reasoning:
 * - If a team is primarily coding and paying for a general LLM assistant in addition to a coding assistant,
 *   they often can shift “quick coding Q&A” into the coding assistant and keep only one general LLM subscription.
 * - This rule is only emitted when it produces a concrete, numeric reduction (dropping one subscription).
 */
export const alternativeRecommendationRule: Rule = {
  id: "alternative_recommendation",
  description: "Suggest switching to a cheaper/overlapping alternative with clear savings.",
  apply: (ctx) => {
    const recs: Recommendation[] = [];

    // If paying for both ChatGPT and Claude, recommend keeping the cheaper and dropping the other.
    const pair: Array<[ToolId, ToolId]> = [
      ["chatgpt", "claude"],
      ["chatgpt", "gemini"],
      ["claude", "gemini"],
    ];

    for (const [a, b] of pair) {
      if (!hasTool(ctx, a) || !hasTool(ctx, b)) continue;
      const spendA = toolSpend(ctx, a);
      const spendB = toolSpend(ctx, b);
      if (spendA <= 0 || spendB <= 0) continue;

      const drop = spendA >= spendB ? a : b;
      const keep = drop === a ? b : a;
      const dropSpend = toolSpend(ctx, drop);
      const dropName = getToolDisplayName(drop);

      recs.push({
        tool: dropName,
        toolId: drop,
        type: "REPLACE_TOOL",
        confidence: "medium",
        impact: impactTemplate("REPLACE_TOOL", dropName),
        currentSpend: money(dropSpend),
        recommendedAction: `Switch to a single assistant: keep ${getToolDisplayName(keep)} and cancel ${getToolDisplayName(drop)}.`,
        estimatedSavings: money(dropSpend),
        reason: "These assistants overlap strongly in day-to-day usage, so one subscription is usually sufficient.",
        severity: severityFromSavings(dropSpend),
      });
    }

    return recs;
  },
};

/**
 * Rule (e): High API spend detection
 *
 * Reasoning:
 * - High variable API spend is often driven by avoidable token usage:
 *   verbose prompts, lack of caching, and using top-tier models for all traffic.
 * - We use deterministic tiers and conservative savings percentages.
 */
export const highApiSpendRule: Rule = {
  id: "high_api_spend",
  description: "Detect unusually high API spend and recommend deterministic optimizations.",
  apply: (ctx) => {
    const recs: Recommendation[] = [];
    const apiTools: ToolId[] = ["openai_api", "anthropic_api"];

    for (const apiTool of apiTools) {
      if (!hasTool(ctx, apiTool)) continue;
      const spend = toolSpend(ctx, apiTool);
      if (spend <= 0) continue;

      // Deterministic savings rates by spend band.
      // Higher spend tends to have more “low hanging fruit” in caching/routing.
      const savingsRate =
        spend >= 2000 ? 0.18 :
        spend >= 1000 ? 0.15 :
        spend >= 500 ? 0.12 :
        spend >= 200 ? 0.10 :
        spend >= 100 ? 0.08 : 0;

      if (savingsRate <= 0) continue;

      const savings = money(spend * savingsRate);
      const toolName = getToolDisplayName(apiTool);

      recs.push({
        tool: toolName,
        toolId: apiTool,
        type: "OPTIMIZE_USAGE",
        confidence: "medium",
        impact: impactTemplate("OPTIMIZE_USAGE", toolName),
        currentSpend: money(spend),
        recommendedAction:
          "Reduce API token spend via caching, prompt shortening, and routing low-stakes traffic to cheaper models.",
        estimatedSavings: savings,
        reason: "High usage-based spend usually contains reclaimable costs from caching repeated requests and avoiding premium models for every call.",
        severity: severityFromSavings(savings),
      });
    }

    return recs;
  },
};

/**
 * Rule (f): Credit-based savings opportunity when total spend > $500
 *
 * Reasoning:
 * - At higher overall spend, vendors and cloud marketplaces often offer credits/committed-use discounts.
 * - We model this as a conservative, deterministic percentage of the eligible spend.
 */
export const creditOpportunityRule: Rule = {
  id: "credit_opportunity_500plus",
  description: "Suggest credit/discount strategies when total spend exceeds $500/month.",
  apply: (ctx) => {
    if (ctx.totalMonthlySpend <= 500) return [];

    const eligibleApiSpend = toolSpend(ctx, "openai_api") + toolSpend(ctx, "anthropic_api");
    const eligibleSeatSpend = ["cursor", "github_copilot", "chatgpt", "claude", "gemini"].reduce(
      (sum, id) => sum + toolSpend(ctx, id as ToolId),
      0
    );

    // Deterministic assumption: credits/discounts more likely/meaningful on API spend; apply a smaller rate to seat-based SaaS.
    const apiRate = eligibleApiSpend > 0 ? 0.08 : 0;
    const seatRate = eligibleSeatSpend > 0 ? 0.03 : 0;

    const savings = money(eligibleApiSpend * apiRate + eligibleSeatSpend * seatRate);
    if (savings <= 0) return [];

    const severity = severityFromSavings(savings);

    return [
      {
        tool: "Portfolio",
        toolId: "other",
        type: "CREDIT_DISCOUNT",
        confidence: "medium",
        impact: impactTemplate("CREDIT_DISCOUNT", "Portfolio"),
        currentSpend: money(ctx.totalMonthlySpend),
        recommendedAction:
          "Pursue credits/discounts: committed-use pricing for APIs and annual/bulk discounts for seat-based subscriptions.",
        estimatedSavings: savings,
        reason: "At $500+/month, you have leverage for vendor credits or committed-use discounts that typically reduce effective cost.",
        severity,
      },
    ];
  },
};

export const ALL_RULES: Rule[] = [
  overkillPlanRule,
  costPerSeatRule,
  redundantToolsRule,
  alternativeRecommendationRule,
  highApiSpendRule,
  creditOpportunityRule,
];

