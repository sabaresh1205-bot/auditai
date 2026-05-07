import { describe, expect, it } from "vitest";
import { generateAuditReport } from "@/lib/audit/engine";

/**
 * Business rule: Overkill plan detection should recommend a downgrade
 * when team size is below the plan’s intended minimum.
 *
 * Why it matters: Startups commonly overpay for team/admin tiers early.
 */
describe("overkill plan detection", () => {
  it("flags ChatGPT Team for a 2-person team and estimates savings", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 2,
      primaryUseCase: "writing",
      tools: [
        // ChatGPT Team ($30/seat) for 2 seats; downgrade target = Pro ($20/seat)
        { toolId: "chatgpt", planType: "team", monthlySpend: 60, seats: 2 },
      ],
    });

    const rec = report.recommendations.find((r) => r.toolId === "chatgpt");
    expect(rec).toBeTruthy();
    expect(rec?.type).toBe("DOWNGRADE_PLAN");
    expect(rec?.confidence).toBe("high");
    expect(rec?.estimatedSavings).toBeGreaterThan(0);
    expect(rec?.severity).toMatch(/low|medium|high/);
    expect(report.monthlySavings).toBeGreaterThan(0);
    expect(report.annualSavings).toBe(report.monthlySavings * 12);
  });
});

