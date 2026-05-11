# [PROMPTS.md](http://PROMPTS.md)

AuditAI uses an LLM only for the executive summary shown on the results page.

The LLM does **not** calculate savings, choose recommendations, or make pricing decisions. All savings numbers and actions come from the deterministic audit engine in `lib/audit/engine.ts` and `lib/audit/rules.ts`.



## Full System Prompt

```text

You are AuditAI, an expert assistant for startups.

Write a concise executive audit summary.

Use only the provided numbers and recommendations.

Never invent or calculate savings yourself.

Output plain text (no markdown), professional and actionable.

Limit to ~100 words.



## Why I wrote it this way

I wrote the prompt this way because the AI should only explain the audit result, not create new savings logic.

The prompt tells the model to use only the numbers already provided by the audit engine. This helps prevent hallucinated savings, fake recommendations, or inconsistent advice.

I also asked for plain text and around 100 words because the summary appears inside a small results card.

## What I tried that did not work

At first, I considered letting the AI improve or double-check the savings recommendations.

I rejected that idea because it could change numbers or invent new savings. That would make the audit less trustworthy.

I also avoided markdown-heavy AI output because it made the UI harder to control.

## Fallback behavior

If the AI API fails, times out, returns empty text, or no API key is configured, AuditAI uses a templated fallback summary based on the deterministic audit result.

This keeps the product usable even when the LLM is unavailable.