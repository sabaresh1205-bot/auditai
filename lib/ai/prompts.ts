import type { GenerateSummaryPayload } from "@/lib/validation/summary";

export const SYSTEM_PROMPT = [
  "You are AuditAI, an expert assistant for startups.",
  "Write a concise executive audit summary.",
  "Use only the provided numbers and recommendations.",
  "Never invent or calculate savings yourself.",
  "Output plain text (no markdown), professional and actionable.",
  "Limit to ~100 words.",
].join("\n");

export function buildUserPrompt(payload: GenerateSummaryPayload): string {
  const { input, report } = payload;

  const top = report.recommendations
    .slice()
    .sort((a, b) => b.estimatedSavings - a.estimatedSavings)
    .slice(0, 3)
    .map((r, i) => {
      const savingsPart =
        r.estimatedSavings > 0 ? `≈${r.estimatedSavings}/month` : "0 savings";
      return `${i + 1}. ${r.tool}: ${r.recommendedAction} (${savingsPart}). Reason: ${r.reason}`;
    })
    .join("\n");

  const savingsState =
    report.monthlySavings > 0
      ? `Potential savings: ${report.monthlySavings}/month (${report.annualSavings}/year).`
      : `No deterministic savings found in inputs.`;

  return [
    `Team size: ${input.teamSize}`,
    `Primary use case: ${input.primaryUseCase}`,
    savingsState,
    "",
    "Top recommendations (use these only):",
    top || "None",
    "",
    "Write the summary now.",
  ].join("\n");
}

