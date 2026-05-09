import { describe, expect, it } from "vitest";
import { generateAuditReport } from "@/lib/audit/engine";

function money(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

describe("audit engine savings totals", () => {
  it("sets annualSavings to monthlySavings × 12 (deterministic rounding)", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 8,
      primaryUseCase: "coding",
      tools: [
        { toolId: "cursor", planType: "business", monthlySpend: 320, seats: 8 },
        { toolId: "github_copilot", planType: "pro", monthlySpend: 10, seats: 2 },
      ],
    });

    expect(report.monthlySavings).toBeGreaterThan(0);
    expect(report.annualSavings).toBe(money(report.monthlySavings * 12));
  });

  it("aggregates monthlySavings as the sum of positive estimatedSavings on emitted recommendations", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 4,
      primaryUseCase: "mixed",
      tools: [
        { toolId: "chatgpt", planType: "team", monthlySpend: 120, seats: 4 },
        { toolId: "claude", planType: "pro", monthlySpend: 80, seats: 4 },
        { toolId: "gemini", planType: "pro", monthlySpend: 20, seats: 1 },
      ],
    });

    const sumPositive = report.recommendations
      .filter((r) => r.estimatedSavings > 0)
      .reduce((acc, r) => acc + r.estimatedSavings, 0);

    expect(report.monthlySavings).toBe(money(sumPositive));
  });

  it("produces zero totals when stack is already rightsized for a minimal scenario", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 3,
      primaryUseCase: "coding",
      tools: [{ toolId: "cursor", planType: "pro", monthlySpend: 60, seats: 3 }],
    });

    expect(report.monthlySavings).toBe(0);
    expect(report.annualSavings).toBe(0);
  });
});
