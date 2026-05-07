import type { AuditSummaryProvider } from "@/lib/ai/providers/types";
import type { GenerateSummaryPayload } from "@/lib/validation/summary";

const DEFAULT_MODEL = "gpt-4o-mini";

export const openaiProvider: AuditSummaryProvider = {
  async generate(payload: GenerateSummaryPayload, systemPrompt: string, userPrompt: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY missing");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OpenAI error: ${res.status} ${text}`.trim());
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty OpenAI summary response");

      return { text: content };
    } finally {
      clearTimeout(timeout);
    }
  },
};

