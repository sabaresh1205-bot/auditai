import type { AuditReport } from "@/lib/audit/engine";
import type { AuditInputV1 } from "@/lib/audit/types";
import type { JsonValue } from "@/lib/supabase/types";
import { generatePortfolioInsights } from "@/lib/report/insights";

export type PublicReportPayload = {
  report: AuditReport;
  insights: ReturnType<typeof generatePortfolioInsights>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toAuditInputOrNull(value: JsonValue): AuditInputV1 | null {
  if (!isObject(value)) return null;
  if (value.version !== 1) return null;
  if (!Array.isArray(value.tools)) return null;
  return value as unknown as AuditInputV1;
}

export function toAuditReportOrNull(value: JsonValue): AuditReport | null {
  if (!isObject(value)) return null;
  if (!isObject(value.summary)) return null;
  if (!Array.isArray(value.recommendations)) return null;
  return value as unknown as AuditReport;
}

export function buildPublicReportPayload(
  inputData: JsonValue,
  reportData: JsonValue
): PublicReportPayload | null {
  const input = toAuditInputOrNull(inputData);
  const report = toAuditReportOrNull(reportData);
  if (!input || !report) return null;
  const insights = generatePortfolioInsights(input, report);
  return { report, insights };
}

