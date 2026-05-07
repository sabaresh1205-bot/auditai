import { describe, expect, it } from "vitest";
import { generateAuditReport } from "@/lib/audit/engine";

/**
 * Edge cases ensure the engine is robust to messy real-world input.
 * These tests validate we don't crash and we remain deterministic.
 */
describe("audit engine edge cases", () => {
  it("handles zero spend across tools without producing positive savings", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 2,
      primaryUseCase: "research",
      tools: [
        { toolId: "chatgpt", planType: "pro", monthlySpend: 0, seats: 2 },
        { toolId: "openai_api", planType: "api_payg", monthlySpend: 0, seats: 1 },
      ],
    });

    expect(report.monthlySavings).toBe(0);
    expect(report.recommendations.every((r) => r.estimatedSavings >= 0)).toBe(true);
  });

  it("handles empty tools array without throwing", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 5,
      primaryUseCase: "mixed",
      tools: [],
    });

    expect(report.summary.toolCount).toBe(0);
    expect(report.monthlySavings).toBe(0);
    expect(report.recommendations.length).toBe(0);
  });

  it("handles invalid seat counts deterministically", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 3,
      primaryUseCase: "coding",
      tools: [
        // seats=0 is invalid but should not crash; engine clamps where needed.
        { toolId: "github_copilot", planType: "pro", monthlySpend: 30, seats: 0 },
      ],
    });

    expect(report.summary.totalMonthlySpend).toBe(30);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("handles duplicate tools (multiple rows) and does not stack per-tool savings", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 4,
      primaryUseCase: "mixed",
      tools: [
        { toolId: "chatgpt", planType: "pro", monthlySpend: 40, seats: 2 },
        { toolId: "chatgpt", planType: "pro", monthlySpend: 40, seats: 2 },
        { toolId: "claude", planType: "pro", monthlySpend: 80, seats: 4 },
      ],
    });

    // With duplicates, spend is aggregated by toolId; redundancy should remove ONE overlapping assistant.
    // Tie case: ChatGPT total ($80) and Claude ($80) are equal, so the engine deterministically drops
    // the first in the assistant ordering.
    const remove = report.recommendations.find((r) => r.type === "REMOVE_TOOL");
    expect(remove).toBeTruthy();
    expect(remove?.estimatedSavings).toBe(80);
    expect(["chatgpt", "claude"]).toContain(remove?.toolId);
  });

  it("flags huge enterprise spend with high severity where appropriate", () => {
    const report = generateAuditReport({
      version: 1,
      currency: "USD",
      teamSize: 3,
      primaryUseCase: "coding",
      tools: [{ toolId: "cursor", planType: "enterprise", monthlySpend: 600, seats: 10 }],
    });

    const rec = report.recommendations.find((r) => r.toolId === "cursor");
    expect(rec).toBeTruthy();
    expect(rec?.estimatedSavings).toBeGreaterThan(0);
    expect(rec?.severity).toBe("high");
  });
});

