import { describe, expect, it } from "vitest";
import { generateAuditReport } from "@/lib/audit/engine";

/**
 * Business rule: High API spend should trigger an OPTIMIZE_USAGE recommendation.
 *
 * Why it matters: Usage-based spend is frequently reducible via caching/routing.
 */
describe("high API spend detection", () => {
  it("flags OpenAI API spend above threshold with deterministic savings estimate", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 8,
      primaryUseCase: "data",
      // Keep total spend < $500 so CREDIT_DISCOUNT does not stack onto totals.
      tools: [{ toolId: "openai_api", planType: "api_payg", monthlySpend: 400, seats: 1 }],
    });

    const rec = report.recommendations.find((r) => r.toolId === "openai_api");
    expect(rec).toBeTruthy();
    expect(rec?.type).toBe("OPTIMIZE_USAGE");
    expect(rec?.confidence).toBe("medium");

    // Spend band: >= 200 -> 10% savings
    expect(rec?.estimatedSavings).toBeCloseTo(40, 2);
    expect(report.monthlySavings).toBeCloseTo(40, 2);
  });
});

