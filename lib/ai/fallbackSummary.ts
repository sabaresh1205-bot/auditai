import type { GenerateSummaryPayload } from "@/lib/validation/summary";

function pickTopRecommendations(payload: GenerateSummaryPayload, limit: number) {
  return payload.report.recommendations
    .slice()
    .sort((a, b) => b.estimatedSavings - a.estimatedSavings)
    .slice(0, limit);
}

function impactLead(payload: GenerateSummaryPayload) {
  const recs = pickTopRecommendations(payload, 2);
  const first = recs[0];
  if (!first) return `Keep validating spend as usage changes.`;
  if (first.estimatedSavings > 0) return `Focus first on the highest-impact action.`;
  return `Your provided tiers and seat counts look aligned.`;
}

function sanitizeSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function fallbackSummary(payload: GenerateSummaryPayload): string {
  const { input, report } = payload;
  const top = pickTopRecommendations(payload, 3).filter((r) => r.estimatedSavings >= 0);

  const topText = top
    .filter((r) => r.type !== "NO_CHANGE")
    .slice(0, 2)
    .map((r) => {
      const savingsPart = r.estimatedSavings > 0 ? `≈${r.estimatedSavings}/month` : "0 savings";
      return `${r.tool}: ${r.recommendedAction} (${savingsPart}).`;
    })
    .join(" ");

  if (report.monthlySavings > 0 && topText) {
    const s = sanitizeSpaces(
      `Based on your inputs for a ${input.teamSize}-person ${input.primaryUseCase} team, you could save ${report.monthlySavings}/month (${report.annualSavings}/year). Biggest opportunity is ${top[0].tool}: ${top[0].recommendedAction} (≈${top[0].estimatedSavings}/month). ${topText ? `Next: ${top[1]?.tool}: ${top[1]?.recommendedAction} (≈${top[1]?.estimatedSavings}/month).` : ""} ${impactLead(payload)}`
    );
    return s;
  }

  // If no positive savings, stay honest with deterministically derived wording.
  const honestTools = payload.report.recommendations
    .filter((r) => r.type === "NO_CHANGE")
    .slice(0, 3)
    .map((r) => r.tool);

  const s = sanitizeSpaces(
    `For your ${input.teamSize}-person ${input.primaryUseCase} team, no deterministic savings were found in the provided tiers and seat counts. Keep these subscriptions and monitor usage; ${honestTools.length ? `this looks aligned for ${honestTools.join(", ")}.` : "your stack appears cost-effective for now."} ${impactLead(payload)}`
  );
  return s.length ? s : "Your stack looks cost-effective based on the provided inputs.";
}

