import type { AuditInputV1, ToolId, ToolUsageInput } from "@/lib/audit/types";
import { getToolDisplayName } from "@/lib/audit/pricing";
import { ALL_RULES, type Recommendation, type RecommendationType } from "@/lib/audit/rules";

export type AuditSummary = {
  currency: AuditInputV1["currency"];
  teamSize: number;
  primaryUseCase: AuditInputV1["primaryUseCase"];
  toolCount: number;
  totalMonthlySpend: number;
  totalAnnualSpend: number;
  costPerTeamMember: number; // totalMonthlySpend / teamSize
};

export type AuditReport = {
  summary: AuditSummary;
  recommendations: Recommendation[];
  perToolRecommendations: Record<string, Recommendation[]>;
  monthlySavings: number;
  annualSavings: number;
};

function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

function buildContext(input: AuditInputV1) {
  const toolSpendById = new Map<ToolId, number>();
  const toolById = new Map<ToolId, ToolUsageInput[]>();

  for (const row of input.tools) {
    const spend = money(row.monthlySpend);
    toolSpendById.set(row.toolId, money((toolSpendById.get(row.toolId) ?? 0) + spend));
    toolById.set(row.toolId, [...(toolById.get(row.toolId) ?? []), row]);
  }

  const totalMonthlySpend = money(
    input.tools.reduce((sum, r) => sum + (Number.isFinite(r.monthlySpend) ? r.monthlySpend : 0), 0)
  );

  return {
    input,
    totalMonthlySpend,
    toolSpendById,
    toolById,
  };
}

function dedupeRecommendations(recs: Recommendation[]): Recommendation[] {
  // Deterministic de-dupe:
  // - same toolId + same recommendedAction -> keep the one with higher savings (if any).
  const map = new Map<string, Recommendation>();
  for (const r of recs) {
    const key = `${r.toolId}::${r.type}::${r.recommendedAction}`;
    const prev = map.get(key);
    if (!prev || r.estimatedSavings > prev.estimatedSavings) map.set(key, r);
  }
  return [...map.values()];
}

const PRECEDENCE: Record<RecommendationType, number> = {
  REMOVE_TOOL: 1,
  REPLACE_TOOL: 2,
  DOWNGRADE_PLAN: 3,
  OPTIMIZE_USAGE: 4,
  CREDIT_DISCOUNT: 5,
  NO_CHANGE: 99,
};

function selectPerToolWithPrecedence(recs: Recommendation[]): Recommendation[] {
  // Prevent stacking savings on the same tool:
  // pick the highest-priority recommendation per toolId unless explicitly combinable.
  //
  // Explicitly combinable:
  // - CREDIT_DISCOUNT is portfolio-level ("other") and can co-exist with any tool actions.
  const byTool = new Map<ToolId, Recommendation[]>();
  for (const r of recs) {
    byTool.set(r.toolId, [...(byTool.get(r.toolId) ?? []), r]);
  }

  const selected: Recommendation[] = [];

  for (const [toolId, items] of byTool.entries()) {
    if (toolId === "other") {
      // Keep all portfolio-level items (currently only credit discount).
      selected.push(...items);
      continue;
    }

    const sorted = items.slice().sort((a, b) => {
      const p = PRECEDENCE[a.type] - PRECEDENCE[b.type];
      if (p !== 0) return p;
      const s = b.estimatedSavings - a.estimatedSavings;
      if (s !== 0) return s;
      return a.recommendedAction.localeCompare(b.recommendedAction);
    });

    // Keep only the highest-priority item for this tool.
    selected.push(sorted[0]);
  }

  return selected;
}

function groupByTool(recs: Recommendation[]): Record<string, Recommendation[]> {
  const grouped: Record<string, Recommendation[]> = {};
  for (const r of recs) {
    const k = r.tool;
    grouped[k] = grouped[k] ? [...grouped[k], r] : [r];
  }
  return grouped;
}

function addOptimizedMessages(input: AuditInputV1, recs: Recommendation[]): Recommendation[] {
  // Honest output: if a tool has no recommendations, explicitly say it looks optimized.
  const byToolId = new Map<ToolId, Recommendation[]>();
  for (const r of recs) {
    byToolId.set(r.toolId, [...(byToolId.get(r.toolId) ?? []), r]);
  }

  const out = recs.slice();
  for (const row of input.tools) {
    if ((byToolId.get(row.toolId)?.length ?? 0) > 0) continue;
    const toolName = getToolDisplayName(row.toolId, row.toolNameOverride);
    out.push({
      tool: toolName,
      toolId: row.toolId,
      type: "NO_CHANGE",
      confidence: "high",
      impact: "Confirms current setup is cost-effective.",
      currentSpend: money(row.monthlySpend),
      recommendedAction: "No change recommended.",
      estimatedSavings: 0,
      reason: "Based on the current inputs, this spend looks reasonable for your team size and plan.",
      severity: "low",
    });
  }

  return out;
}

export function generateAuditReport(input: AuditInputV1): AuditReport {
  const ctx = buildContext(input);

  // Apply deterministic rules (pure functions).
  const raw = ALL_RULES.flatMap((rule) => rule.apply(ctx));
  const deduped = dedupeRecommendations(raw);
  const selected = selectPerToolWithPrecedence(deduped);

  // Only count positive savings towards totals.
  const monthlySavings = money(
    selected.reduce((sum, r) => sum + (r.estimatedSavings > 0 ? r.estimatedSavings : 0), 0)
  );

  const enriched = addOptimizedMessages(input, selected);

  // Sort: highest severity then highest savings, deterministic stable tie-breaker by tool name.
  const severityRank: Record<Recommendation["severity"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  const recommendations = enriched.slice().sort((a, b) => {
    const s = severityRank[b.severity] - severityRank[a.severity];
    if (s !== 0) return s;
    const d = b.estimatedSavings - a.estimatedSavings;
    if (d !== 0) return d;
    return a.tool.localeCompare(b.tool);
  });

  const summary: AuditSummary = {
    currency: input.currency,
    teamSize: input.teamSize,
    primaryUseCase: input.primaryUseCase,
    toolCount: input.tools.length,
    totalMonthlySpend: ctx.totalMonthlySpend,
    totalAnnualSpend: money(ctx.totalMonthlySpend * 12),
    costPerTeamMember: money(ctx.totalMonthlySpend / Math.max(1, input.teamSize)),
  };

  return {
    summary,
    recommendations,
    perToolRecommendations: groupByTool(recommendations),
    monthlySavings,
    annualSavings: money(monthlySavings * 12),
  };
}

/**
 * Realistic audit scenarios (for manual testing / future unit tests)
 *
 * Scenario 1: Solo dev overpaying on enterprise tools
 * {
 *   version: 1, currency: "USD", teamSize: 1, primaryUseCase: "coding",
 *   tools: [
 *     { toolId: "cursor", planType: "enterprise", monthlySpend: 60, seats: 1 },
 *     { toolId: "github_copilot", planType: "enterprise", monthlySpend: 39, seats: 1 },
 *   ]
 * }
 * Expect: overkill downgrades + cost/seat sanity checks.
 *
 * Scenario 2: Small team with redundant assistants
 * {
 *   version: 1, currency: "USD", teamSize: 4, primaryUseCase: "mixed",
 *   tools: [
 *     { toolId: "chatgpt", planType: "team", monthlySpend: 120, seats: 4 },
 *     { toolId: "claude", planType: "pro", monthlySpend: 80, seats: 4 },
 *   ]
 * }
 * Expect: redundancy consolidation (drop the more expensive overlapping assistant).
 *
 * Scenario 3: Seats exceed team size (unused seats)
 * {
 *   version: 1, currency: "USD", teamSize: 6, primaryUseCase: "coding",
 *   tools: [
 *     { toolId: "github_copilot", planType: "business", monthlySpend: 190, seats: 10 },
 *   ]
 * }
 * Expect: reduce seats 10 -> 6 with numeric savings.
 *
 * Scenario 4: High API spend with optimization opportunity
 * {
 *   version: 1, currency: "USD", teamSize: 12, primaryUseCase: "data",
 *   tools: [
 *     { toolId: "openai_api", planType: "api_payg", monthlySpend: 1800, seats: 1 },
 *     { toolId: "claude", planType: "team", monthlySpend: 360, seats: 12 },
 *   ]
 * }
 * Expect: high API spend recommendation + (if total > 500) credit opportunity.
 *
 * Scenario 5: Already optimized simple stack
 * {
 *   version: 1, currency: "USD", teamSize: 3, primaryUseCase: "coding",
 *   tools: [
 *     { toolId: "cursor", planType: "pro", monthlySpend: 60, seats: 3 },
 *   ]
 * }
 * Expect: "No change recommended." with 0 savings.
 */

