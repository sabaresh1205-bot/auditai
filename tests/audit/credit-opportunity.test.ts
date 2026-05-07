import { describe, expect, it } from "vitest";
import { generateAuditReport } from "@/lib/audit/engine";

/**
 * Business rule: When total spend > $500, suggest credit/discount strategy.
 *
 * Why it matters: At this spend level, committed use and credits often reduce cost.
 */
describe("credit opportunity detection", () => {
  it("emits CREDIT_DISCOUNT when total spend exceeds $500", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 10,
      primaryUseCase: "mixed",
      tools: [
        { toolId: "openai_api", planType: "api_payg", monthlySpend: 700, seats: 1 },
        { toolId: "cursor", planType: "pro", monthlySpend: 200, seats: 10 },
      ],
    });

    const credit = report.recommendations.find((r) => r.type === "CREDIT_DISCOUNT");
    expect(credit).toBeTruthy();
    expect(credit?.toolId).toBe("other");
    expect(credit?.confidence).toBe("medium");
    expect(credit?.estimatedSavings).toBeGreaterThan(0);

    // Ensure it contributes to totals deterministically
    expect(report.monthlySavings).toBeGreaterThan(0);
  });
});

