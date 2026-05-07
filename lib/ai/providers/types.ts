import type { GenerateSummaryPayload } from "@/lib/validation/summary";

export type AuditSummaryProviderResult = {
  text: string;
};

export type AuditSummaryProvider = {
  generate: (payload: GenerateSummaryPayload, systemPrompt: string, userPrompt: string) => Promise<AuditSummaryProviderResult>;
};

