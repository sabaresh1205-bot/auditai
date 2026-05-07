import { describe, expect, it } from "vitest";
import { generateAuditReport } from "@/lib/audit/engine";

/**
 * Business rule: When no rules apply, we should be honest and report NO_CHANGE.
 *
 * Why it matters: Trust is built by not inventing savings.
 */
describe("optimized stack", () => {
  it("returns NO_CHANGE for a small realistic setup with zero savings", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 3,
      primaryUseCase: "coding",
      tools: [{ toolId: "cursor", planType: "pro", monthlySpend: 60, seats: 3 }],
    });

    expect(report.monthlySavings).toBe(0);
    expect(report.annualSavings).toBe(0);

    const rec = report.recommendations.find((r) => r.toolId === "cursor");
    expect(rec).toBeTruthy();
    expect(rec?.type).toBe("NO_CHANGE");
    expect(rec?.confidence).toBe("high");
    expect(rec?.estimatedSavings).toBe(0);
  });
});

