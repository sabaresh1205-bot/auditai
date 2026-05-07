import type { AuditSummaryProvider } from "@/lib/ai/providers/types";
import type { GenerateSummaryPayload } from "@/lib/validation/summary";

const DEFAULT_MODEL = "claude-3-5-sonnet-20240620";

export const anthropicProvider: AuditSummaryProvider = {
  async generate(payload: GenerateSummaryPayload, systemPrompt: string, userPrompt: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY missing");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
          system: systemPrompt,
          max_tokens: 200,
          temperature: 0.3,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Anthropic error: ${res.status} ${text}`.trim());
      }

      const json = (await res.json()) as { content?: Array<{ text?: string }> };
      const contentText = json.content?.[0]?.text;
      if (!contentText) throw new Error("Empty Anthropic summary response");
      return { text: contentText };
    } finally {
      clearTimeout(timeout);
    }
  },
};

