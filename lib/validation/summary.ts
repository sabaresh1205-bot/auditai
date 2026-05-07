import { z } from "zod";
import type { AuditInputV1 } from "@/lib/audit/types";
import type { AuditReport } from "@/lib/audit/engine";
import type { Recommendation } from "@/lib/audit/rules";

const currencySchema = z.enum(["USD", "INR", "EUR", "GBP", "AUD", "CAD", "SGD"]);

const recommendationSchema = z.object({
  tool: z.string().min(1),
  toolId: z.string().min(1),
  type: z.enum([
    "REMOVE_TOOL",
    "REPLACE_TOOL",
    "DOWNGRADE_PLAN",
    "OPTIMIZE_USAGE",
    "CREDIT_DISCOUNT",
    "NO_CHANGE",
  ]),
  confidence: z.enum(["high", "medium"]),
  impact: z.string().min(1).max(120),
  currentSpend: z.number().finite().nonnegative(),
  recommendedAction: z.string().min(1),
  estimatedSavings: z.number().finite().nonnegative(),
  reason: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
});

const auditSummarySchema = z.object({
  currency: currencySchema,
  teamSize: z.number().int().nonnegative(),
  primaryUseCase: z.string().min(1),
  toolCount: z.number().int().nonnegative(),
  totalMonthlySpend: z.number().finite().nonnegative(),
  totalAnnualSpend: z.number().finite().nonnegative(),
  costPerTeamMember: z.number().finite().nonnegative(),
});

export const generateSummaryPayloadSchema = z.object({
  input: z.object({
    version: z.literal(1),
    currency: currencySchema,
    teamSize: z.number().int().nonnegative(),
    primaryUseCase: z.string().min(1),
    tools: z.array(
      z.object({
        toolId: z.string().min(1),
        toolNameOverride: z.string().optional(),
        planType: z.string().min(1),
        monthlySpend: z.number().finite().nonnegative(),
        seats: z.number().int().nonnegative(),
      })
    ),
  }) as z.ZodType<AuditInputV1>,
  report: z.object({
    summary: auditSummarySchema,
    recommendations: z.array(recommendationSchema),
    monthlySavings: z.number().finite().nonnegative(),
    annualSavings: z.number().finite().nonnegative(),
  }) as z.ZodType<Pick<AuditReport, "summary" | "recommendations" | "monthlySavings" | "annualSavings">>,
});

export type GenerateSummaryPayload = z.infer<typeof generateSummaryPayloadSchema>;
export type GenerateSummaryRecommendation = z.infer<typeof recommendationSchema> & Recommendation;

