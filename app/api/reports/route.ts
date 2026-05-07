import { NextResponse } from "next/server";
import { createSupabaseServerClient, insertAuditReport } from "@/lib/supabase/client";
import { createReportSchema, formatZodError } from "@/lib/validation/api";
import { z } from "zod";
import { classifySupabaseMissingTable } from "@/lib/server/errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createReportSchema.parse(body);

    const client = createSupabaseServerClient();
    const row = await insertAuditReport(client, {
      input_data: parsed.input,
      report_data: parsed.report,
      is_public: true,
      total_monthly_savings: parsed.report.monthlySavings,
      total_annual_savings: parsed.report.annualSavings,
    });

    return NextResponse.json({ id: row.id, createdAt: row.created_at }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error) }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create report.";
    if (classifySupabaseMissingTable(message)) {
      return NextResponse.json(
        {
          error: {
            code: "DB_SCHEMA_MISSING",
            message:
              "Supabase tables are missing. Run supabase/schema.sql in your project.",
            details: [{ message }],
          },
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message, details: [] } },
      { status: 500 }
    );
  }
}

