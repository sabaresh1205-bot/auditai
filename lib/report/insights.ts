import type { AuditInputV1, ToolId } from "@/lib/audit/types";
import type { AuditReport } from "@/lib/audit/engine";

export type PortfolioInsight = {
  id: string;
  title: string;
  detail: string;
};

function topCategoryFromTools(input: AuditInputV1): "coding" | "assistants" | "api" | "mixed" {
  const codingIds: ToolId[] = ["cursor", "github_copilot"];
  const assistantIds: ToolId[] = ["chatgpt", "claude", "gemini"];
  const apiIds: ToolId[] = ["openai_api", "anthropic_api"];

  const spend = (ids: ToolId[]) =>
    input.tools
      .filter((t) => ids.includes(t.toolId))
      .reduce((sum, t) => sum + (Number.isFinite(t.monthlySpend) ? t.monthlySpend : 0), 0);

  const coding = spend(codingIds);
  const assistants = spend(assistantIds);
  const api = spend(apiIds);

  const entries = [
    ["coding", coding] as const,
    ["assistants", assistants] as const,
    ["api", api] as const,
  ].sort((a, b) => b[1] - a[1]);

  if (entries[0][1] <= 0) return "mixed";
  const [top, topSpend] = entries[0];
  const second = entries[1][1];
  return topSpend >= second * 1.25 ? top : "mixed";
}

function hasOverlapAssistants(input: AuditInputV1): boolean {
  const assistantIds: ToolId[] = ["chatgpt", "claude", "gemini"];
  const present = assistantIds.filter((id) => input.tools.some((t) => t.toolId === id && t.monthlySpend > 0));
  return present.length >= 2;
}

function hasApiOptimization(report: AuditReport): boolean {
  return report.recommendations.some((r) => r.type === "OPTIMIZE_USAGE" && (r.toolId === "openai_api" || r.toolId === "anthropic_api"));
}

export function generatePortfolioInsights(input: AuditInputV1, report: AuditReport): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];

  const top = topCategoryFromTools(input);
  if (top === "coding") {
    insights.push({
      id: "top_spend_coding",
      title: "Most spend comes from coding tools",
      detail: "Your highest spend is in IDE and coding assistant seats.",
    });
  } else if (top === "assistants") {
    insights.push({
      id: "top_spend_assistants",
      title: "Most spend comes from assistant tools",
      detail: "Your highest spend is in general-purpose LLM subscriptions.",
    });
  } else if (top === "api") {
    insights.push({
      id: "top_spend_api",
      title: "Most spend comes from API usage",
      detail: "Your highest spend is usage-based API billing.",
    });
  } else {
    insights.push({
      id: "top_spend_mixed",
      title: "Spend is spread across categories",
      detail: "Costs are distributed across assistants, coding tools, and APIs.",
    });
  }

  if (hasOverlapAssistants(input)) {
    insights.push({
      id: "overlap_assistants",
      title: "Overlapping assistant tools detected",
      detail: "Multiple general-purpose assistants often overlap heavily day-to-day.",
    });
  }

  if (hasApiOptimization(report)) {
    insights.push({
      id: "api_optimization",
      title: "API optimization opportunity detected",
      detail: "Caching and model routing can reduce token-based spend.",
    });
  }

  if (report.monthlySavings <= 0) {
    insights.push({
      id: "optimized",
      title: "Your stack is already optimized",
      detail: "No material savings were detected from the current inputs.",
    });
  } else {
    insights.push({
      id: "savings_detected",
      title: "Potential savings detected",
      detail: "Focus on the highest-savings actions first for quickest impact.",
    });
  }

  return insights.slice(0, 4);
}

