import { NextResponse } from "next/server";
import { createSupabaseServerClient, tryCreateSupabaseAdminClient, insertLead } from "@/lib/supabase/client";
import { sendAuditConfirmationEmail } from "@/lib/email/sendAuditConfirmationEmail";
import { formatZodError, leadSubmissionSchema } from "@/lib/validation/api";
import { z } from "zod";
import { classifySupabaseMissingTable } from "@/lib/server/errors";

const COOLDOWN_MS = 8_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = leadSubmissionSchema.parse(body);

    if (parsed.honey && parsed.honey.trim().length > 0) {
      return NextResponse.json(
        { error: { code: "SPAM_DETECTED", message: "Invalid submission.", details: [] } },
        { status: 400 }
      );
    }
    // `cooldownAt` is intended to be the client's *previous* attempt timestamp.
    // Be defensive: ignore timestamps that are effectively "now" (common client bug)
    // or in the future.
    if (
      parsed.cooldownAt &&
      parsed.cooldownAt < Date.now() - 250 &&
      Date.now() - parsed.cooldownAt < COOLDOWN_MS
    ) {
      return NextResponse.json(
        { error: { code: "COOLDOWN_ACTIVE", message: "Please wait and retry.", details: [] } },
        { status: 429 }
      );
    }

    // Prefer an admin (service role) client when configured (bypasses RLS),
    // but fall back to anon client for setups that rely on RLS policies (see `supabase/schema.sql`).
    const client = tryCreateSupabaseAdminClient() ?? createSupabaseServerClient();
    const lead = await insertLead(client, {
      email: parsed.email,
      company_name: parsed.companyName ?? null,
      role: parsed.role ?? null,
      team_size: typeof parsed.teamSize === "number" ? parsed.teamSize : null,
    });

    await sendAuditConfirmationEmail({ toEmail: parsed.email });

    return NextResponse.json({ id: lead.id, createdAt: lead.created_at }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(error) }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to submit lead.";
    console.error("POST /api/leads failed", error);

    if (message.toLowerCase().includes("missing supabase environment variables")) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_MISSING",
            message:
              "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
            details: [],
          },
        },
        { status: 500 }
      );
    }
    if (message.toLowerCase().includes("row-level security")) {
      return NextResponse.json(
        {
          error: {
            code: "RLS_BLOCKED",
            message:
              "Insert was blocked by Supabase Row Level Security (RLS). Either run `supabase/schema.sql` (which adds an anon insert policy for `leads`) or set SUPABASE_SERVICE_ROLE_KEY to bypass RLS on the server.",
            details: [{ message }],
          },
        },
        { status: 500 }
      );
    }
    if (error instanceof Error && classifySupabaseMissingTable(message)) {
      return NextResponse.json(
        {
          error: {
            code: "DB_SCHEMA_MISSING",
            message: "Supabase tables are missing. Run supabase/schema.sql in your project.",
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

