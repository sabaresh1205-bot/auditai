# Prompts (AI Summary Layer)

AuditAI uses an LLM **only** to produce a short **executive summary narrative**.  
**The LLM generates narrative only, never pricing decisions.** All savings figures, recommendation types, and tool-level actions are computed by `lib/audit/engine.ts` and `lib/audit/rules.ts` before any model is called.

---

## Full system prompt (exact string)

The following is the **complete** `SYSTEM_PROMPT` from `lib/ai/prompts.ts` (joined with newlines):

```text
You are AuditAI, an expert assistant for startups.
Write a concise executive audit summary.
Use only the provided numbers and recommendations.
Never invent or calculate savings yourself.
Output plain text (no markdown), professional and actionable.
Limit to ~100 words.
```

---

## User prompt construction (`buildUserPrompt`)

The user message is built **deterministically** in `lib/ai/prompts.ts`:

1. **Top recommendations:** `report.recommendations` sorted by `estimatedSavings` descending; **top 3 only**.
2. Each line format:  
   `{i}. {tool}: {recommendedAction} ({≈Xsavings/month or "0 savings"}). Reason: {reason}`  
   where `reason` and `recommendedAction` already came from rules (not from the LLM).
3. **Savings state line:**  
   - If `monthlySavings > 0`: `Potential savings: {monthlySavings}/month ({annualSavings}/year).`  
   - Else: `No deterministic savings found in inputs.`
4. **Fixed closing:** `Write the summary now.`

Skeleton of the assembled user prompt:

```text
Team size: <teamSize>
Primary use case: <primaryUseCase>
< savingsState line >

Top recommendations (use these only):
< numbered lines, or "None" >

Write the summary now.
```

No user free-text is injected except what already passed Zod validation on the API payload.

---

## Why the prompt is designed this way

| Design choice | Intent |
| --- | --- |
| **Narrow system role** | Reduces “creative” digressions; keeps output in executive-summary shape. |
| **“Use only provided numbers”** | Forces the model to treat the audit as **read-only** context. |
| **Plain text, ~100 words** | Fits UI card, avoids markdown rendering bugs, bounds latency/cost. |
| **Top 3 recs only** | Shrinks context window and limits surface for hallucinated extra actions. |
| **Savings state duplicated** | Gives the model an explicit numeric headline aligned with the UI. |

---

## Output handling, constraints, and hallucination mitigation

After the provider returns:

1. **`sanitizeSummaryText`** — strips accidental HTML/markup.
2. **`clampWords`** — enforces a maximum word budget (~110 words in implementation).
3. **Heuristic validation** — rejects empty/too-short summaries.

If any step fails, **`fallbackSummary()`** generates narrative from the **same** deterministic recommendations—**no LLM pricing or new math**.

Additional guardrails:

- Provider calls use **`AbortController`** (~8s) to avoid hung requests.
- API keys missing → **never call provider**; immediate fallback.

---

## Prompt attempts that did *not* work (and why)

| Attempt | Problem |
| --- | --- |
| Asking the model to “double-check” or “revise” savings | Introduces unauthorized numeric edits; violates single source of truth. |
| Long system prompts with marketing tone | Increased verbosity and off-brand output; harder to clamp. |
| Feeding the entire recommendation list (10+ items) | Noise + higher chance of mentioning tools not in the “selected per tool” set. |
| Markdown-rich output | Broke simple `<p>` rendering and required heavier sanitization. |

---

## Isolation from savings math (non-negotiable)

**What the LLM never sees as an instruction to compute:**

- Per-tool `estimatedSavings` beyond what is already printed in the prompt.
- Pricing catalog rows from `lib/audit/pricing.ts`.
- Precedence / tie-break rules from `lib/audit/engine.ts`.

**What the LLM is allowed to do:**

- Rephrase the provided recommendations into a coherent paragraph.
- Prioritize themes (e.g., consolidation vs downgrade) **using only** the given list.

**Single-sentence compliance statement:**  
*LLM generates narrative only, never pricing decisions; all dollar amounts and actions originate in the deterministic engine.*
