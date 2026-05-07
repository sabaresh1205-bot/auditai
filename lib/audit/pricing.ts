import type { PlanType, ToolId } from "@/lib/audit/types";

export type ToolCategory = "ide" | "assistant" | "llm" | "api";

export type IntendedTeamSizeRange = {
  min: number;
  max: number;
};

export type PlanPricing = {
  planType: PlanType;
  monthlyPrice: number; // per seat for seat-based products; account-level for API payg is 0
  category: ToolCategory;
  intendedTeamSize: IntendedTeamSizeRange;
  notes: string;
};

export type ToolPricing = {
  toolId: ToolId;
  toolName: string;
  currency: "USD";
  plans: Partial<Record<PlanType, PlanPricing>>;
};

/**
 * Pricing configuration (USD).
 *
 * Notes:
 * - We use this catalog to suggest a *target spend* when downgrading or rightsizing.
 * - The user's `monthlySpend` is treated as the current spend source of truth.
 * - For API pay-as-you-go, there is no fixed monthly price, so `monthlyPrice` is 0.
 *
 * Update cadence:
 * - SaaS pricing changes frequently. Keep this file centralized so updates are easy and auditable.
 */
export const PRICING_USD: Record<
  Exclude<ToolId, "perplexity" | "google_ai_studio_api" | "other">,
  ToolPricing
> = {
  cursor: {
    toolId: "cursor",
    toolName: "Cursor",
    currency: "USD",
    plans: {
      pro: {
        planType: "pro",
        monthlyPrice: 20,
        category: "ide",
        intendedTeamSize: { min: 1, max: 20 },
        notes: "Pro is typically sufficient for individuals and small teams.",
      },
      business: {
        planType: "business",
        monthlyPrice: 40,
        category: "ide",
        intendedTeamSize: { min: 10, max: 500 },
        notes:
          "Business is usually for org features/controls; often overkill for very small teams.",
      },
      enterprise: {
        planType: "enterprise",
        monthlyPrice: 60,
        category: "ide",
        intendedTeamSize: { min: 50, max: 100000 },
        notes:
          "Enterprise is for large org controls and procurement needs; validate necessity.",
      },
    },
  },

  github_copilot: {
    toolId: "github_copilot",
    toolName: "GitHub Copilot",
    currency: "USD",
    plans: {
      pro: {
        planType: "pro",
        monthlyPrice: 10,
        category: "assistant",
        intendedTeamSize: { min: 1, max: 10 },
        notes:
          "Individual plan; best for solo/very small teams without enterprise policies.",
      },
      business: {
        planType: "business",
        monthlyPrice: 19,
        category: "assistant",
        intendedTeamSize: { min: 2, max: 5000 },
        notes:
          "Business adds org controls; often unnecessary for tiny teams unless required.",
      },
      enterprise: {
        planType: "enterprise",
        monthlyPrice: 39,
        category: "assistant",
        intendedTeamSize: { min: 50, max: 100000 },
        notes: "Enterprise controls; validate if actually needed.",
      },
    },
  },

  chatgpt: {
    toolId: "chatgpt",
    toolName: "ChatGPT",
    currency: "USD",
    plans: {
      pro: {
        planType: "pro",
        monthlyPrice: 20,
        category: "llm",
        intendedTeamSize: { min: 1, max: 10 },
        notes:
          "Common for individual power users; small teams may still do fine per-seat.",
      },
      team: {
        planType: "team",
        monthlyPrice: 30,
        category: "llm",
        intendedTeamSize: { min: 5, max: 200 },
        notes: "Team adds collaboration/admin; check if those features are used.",
      },
      enterprise: {
        planType: "enterprise",
        monthlyPrice: 60,
        category: "llm",
        intendedTeamSize: { min: 50, max: 100000 },
        notes: "Enterprise controls/compliance; validate necessity.",
      },
    },
  },

  claude: {
    toolId: "claude",
    toolName: "Claude",
    currency: "USD",
    plans: {
      pro: {
        planType: "pro",
        monthlyPrice: 20,
        category: "llm",
        intendedTeamSize: { min: 1, max: 10 },
        notes: "Pro is typically enough for individual knowledge workers.",
      },
      team: {
        planType: "team",
        monthlyPrice: 30,
        category: "llm",
        intendedTeamSize: { min: 5, max: 200 },
        notes: "Team adds admin/collaboration; only worth it if needed.",
      },
      enterprise: {
        planType: "enterprise",
        monthlyPrice: 60,
        category: "llm",
        intendedTeamSize: { min: 50, max: 100000 },
        notes: "Enterprise controls; validate necessity for startups.",
      },
    },
  },

  gemini: {
    toolId: "gemini",
    toolName: "Gemini",
    currency: "USD",
    plans: {
      pro: {
        planType: "pro",
        monthlyPrice: 20,
        category: "llm",
        intendedTeamSize: { min: 1, max: 10 },
        notes: "Pro is usually sufficient for small teams.",
      },
      business: {
        planType: "business",
        monthlyPrice: 30,
        category: "llm",
        intendedTeamSize: { min: 2, max: 2000 },
        notes:
          "Business often aligns to workspace/org needs; ensure you need admin controls.",
      },
      enterprise: {
        planType: "enterprise",
        monthlyPrice: 60,
        category: "llm",
        intendedTeamSize: { min: 50, max: 100000 },
        notes: "Enterprise controls; validate necessity.",
      },
    },
  },

  openai_api: {
    toolId: "openai_api",
    toolName: "OpenAI API",
    currency: "USD",
    plans: {
      api_payg: {
        planType: "api_payg",
        monthlyPrice: 0,
        category: "api",
        intendedTeamSize: { min: 1, max: 100000 },
        notes:
          "Usage-based billing; optimizations come from caching, prompt/response size, and model routing.",
      },
    },
  },

  anthropic_api: {
    toolId: "anthropic_api",
    toolName: "Anthropic API",
    currency: "USD",
    plans: {
      api_payg: {
        planType: "api_payg",
        monthlyPrice: 0,
        category: "api",
        intendedTeamSize: { min: 1, max: 100000 },
        notes:
          "Usage-based billing; optimizations come from caching, prompt/response size, and model routing.",
      },
    },
  },
};

export function getToolDisplayName(toolId: ToolId, toolNameOverride?: string): string {
  if (toolId === "other") return toolNameOverride?.trim() || "Other tool";
  const known = (PRICING_USD as Partial<Record<ToolId, ToolPricing>>)[toolId];
  return known?.toolName ?? toolId;
}

export function getKnownPlanPriceUsd(
  toolId: ToolId,
  planType: PlanType
): number | null {
  const known = (PRICING_USD as Partial<Record<ToolId, ToolPricing>>)[toolId];
  const plan = known?.plans?.[planType];
  if (!plan) return null;
  return plan.monthlyPrice;
}

