import { NextResponse } from "next/server";
import { generateAuditSummary } from "@/lib/ai/generateAuditSummary";
import {
  generateSummaryPayloadSchema,
  type GenerateSummaryPayload,
} from "@/lib/validation/summary";
import { z } from "zod";

const requestSchema = z.object({
  provider: z.enum(["openai", "anthropic"]).optional(),
  payload: generateSummaryPayloadSchema,
});

type RequestBody = z.infer<typeof requestSchema>;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = requestSchema.parse(body) as RequestBody;
    const provider = parsed.provider ?? "openai";

    const result = await generateAuditSummary(
      parsed.payload as GenerateSummaryPayload,
      provider
    );

    return NextResponse.json(
      { ok: true, summary: result.summary, source: result.source },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: error.message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to generate summary." },
      },
      { status: 500 }
    );
  }
}

