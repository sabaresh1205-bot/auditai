import { z } from "zod";

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

const reportSchema = z.object({
  summary: z.object({
    currency: z.string().min(3).max(8),
    teamSize: z.number().int().nonnegative(),
    primaryUseCase: z.string().min(1),
    toolCount: z.number().int().nonnegative(),
    totalMonthlySpend: z.number().finite().nonnegative(),
    totalAnnualSpend: z.number().finite().nonnegative(),
    costPerTeamMember: z.number().finite().nonnegative(),
  }),
  recommendations: z.array(recommendationSchema),
  perToolRecommendations: z.record(z.string(), z.array(recommendationSchema)),
  monthlySavings: z.number().finite().nonnegative(),
  annualSavings: z.number().finite().nonnegative(),
});

const auditInputSchema = z.object({
  version: z.literal(1),
  currency: z.string().min(3).max(8),
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
});

export const createReportSchema = z.object({
  input: auditInputSchema,
  report: reportSchema.superRefine((val, ctx) => {
    if (val.annualSavings !== Number((val.monthlySavings * 12).toFixed(2))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "annualSavings must equal monthlySavings * 12.",
        path: ["annualSavings"],
      });
    }
  }),
});

export const leadSubmissionSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  companyName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  role: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  teamSize: z.number().int().min(1).max(100000).optional(),
  reportId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().trim().uuid().optional()
  ),
  honey: z.string().max(0).optional(),
  cooldownAt: z.number().int().optional(),
});

export type StructuredValidationError = {
  code: "VALIDATION_ERROR";
  message: string;
  details: Array<{ path: string; message: string }>;
};

export function formatZodError(error: z.ZodError): StructuredValidationError {
  return {
    code: "VALIDATION_ERROR",
    message: "Invalid request payload.",
    details: error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}

