import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompts";
import { fallbackSummary } from "@/lib/ai/fallbackSummary";
import type { AuditSummaryProvider } from "@/lib/ai/providers/types";
import { openaiProvider } from "@/lib/ai/providers/openai";
import { anthropicProvider } from "@/lib/ai/providers/anthropic";
import type { GenerateSummaryPayload } from "@/lib/validation/summary";

function sanitizeSummaryText(input: string): string {
  // Remove any accidental markup and collapse whitespace deterministically.
  const noTags = input.replace(/<[^>]*>/g, "");
  const cleaned = noTags.replace(/\s+/g, " ").trim();
  return cleaned;
}

function wordCount(s: string): number {
  const m = s.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function clampWords(s: string, maxWords: number): string {
  const parts = s.trim().split(/\s+/);
  return parts.slice(0, maxWords).join(" ").trim();
}

function getProvider(providerName?: string): AuditSummaryProvider {
  if (providerName === "anthropic") return anthropicProvider;
  return openaiProvider;
}

export type AuditSummaryResult = {
  summary: string;
  source: "ai" | "fallback";
};

export async function generateAuditSummary(
  payload: GenerateSummaryPayload,
  providerName: "openai" | "anthropic" = "openai"
): Promise<AuditSummaryResult> {
  const provider = getProvider(providerName);

  const aiAttempted =
    (providerName === "openai" && process.env.OPENAI_API_KEY) ||
    (providerName === "anthropic" && process.env.ANTHROPIC_API_KEY);

  const fallback = () => {
    const s = fallbackSummary(payload);
    const cleaned = sanitizeSummaryText(s);
    return clampWords(cleaned, 110);
  };

  if (!aiAttempted) {
    return { summary: fallback(), source: "fallback" };
  }

  try {
    const userPrompt = buildUserPrompt(payload);
    const result = await provider.generate(payload, SYSTEM_PROMPT, userPrompt);
    const cleaned = sanitizeSummaryText(result.text);

    if (!cleaned) {
      return { summary: fallback(), source: "fallback" };
    }

    // Enforce compactness.
    const limited = clampWords(cleaned, 110);
    if (wordCount(limited) < 12) {
      return { summary: fallback(), source: "fallback" };
    }

    return { summary: limited, source: "ai" };
  } catch {
    return { summary: fallback(), source: "fallback" };
  }
}

