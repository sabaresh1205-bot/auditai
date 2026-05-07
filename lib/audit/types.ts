export type ToolId =
  | "cursor"
  | "github_copilot"
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "openai_api"
  | "anthropic_api"
  | "google_ai_studio_api"
  | "other";

export type PlanType =
  | "free"
  | "starter"
  | "pro"
  | "team"
  | "business"
  | "enterprise"
  | "api_payg";

export type PrimaryUseCase =
  | "coding"
  | "writing"
  | "research"
  | "data"
  | "mixed";

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AUD" | "CAD" | "SGD";

export type ToolUsageInput = {
  toolId: ToolId;
  toolNameOverride?: string; // required when toolId === "other"
  planType: PlanType;
  monthlySpend: number; // currency units per month (e.g. USD)
  seats: number;
};

export type AuditInputV1 = {
  version: 1;
  currency: CurrencyCode;
  teamSize: number;
  primaryUseCase: PrimaryUseCase;
  tools: ToolUsageInput[];
};

export const DEFAULT_AUDIT_INPUT: AuditInputV1 = {
  version: 1,
  currency: "USD",
  teamSize: 1,
  primaryUseCase: "coding",
  tools: [
    {
      toolId: "cursor",
      planType: "pro",
      monthlySpend: 20,
      seats: 1,
    },
  ],
};

