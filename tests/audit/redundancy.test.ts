import { describe, expect, it } from "vitest";
import { generateAuditReport } from "@/lib/audit/engine";

/**
 * Business rule: Redundant assistants should be consolidated.
 *
 * Why it matters: Multiple LLM subscriptions often overlap heavily.
 */
describe("redundant tool detection", () => {
  it("recommends removing the most expensive assistant when ChatGPT+Claude+Gemini are present", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 5,
      primaryUseCase: "mixed",
      tools: [
        { toolId: "chatgpt", planType: "pro", monthlySpend: 100, seats: 5 },
        { toolId: "claude", planType: "pro", monthlySpend: 80, seats: 5 },
        { toolId: "gemini", planType: "pro", monthlySpend: 60, seats: 5 },
      ],
    });

    const removals = report.recommendations.filter((r) => r.type === "REMOVE_TOOL");
    expect(removals.length).toBeGreaterThanOrEqual(1);

    // Deterministic: drop the most expensive overlapping LLM (ChatGPT at $100).
    const chatgptRec = report.recommendations.find((r) => r.toolId === "chatgpt");
    expect(chatgptRec).toBeTruthy();
    expect(chatgptRec?.type).toBe("REMOVE_TOOL");
    expect(chatgptRec?.confidence).toBe("high");
    expect(chatgptRec?.estimatedSavings).toBe(100);
    expect(report.monthlySavings).toBeGreaterThanOrEqual(100);
  });
});

