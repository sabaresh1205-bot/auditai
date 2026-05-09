# Reflection

## 1. What was the hardest technical problem, and how did you debug it?

The hardest problems sat at **integration boundaries**, not inside the pure audit math. Two stand out: **Supabase Row Level Security (RLS)** blocking inserts in some environments, and **React hydration** when browser-only storage participated in render.

For RLS, the failure mode was a generic 500 or Postgres error message that did not spell out “policy.” I worked backward from the `insertLead` / report insert call sites, confirmed the service role vs anon client path in `tryCreateSupabaseAdminClient()`, and compared that to what `schema.sql` actually grants. The debugging loop was: reproduce locally with anon key only → read the exact error string → map it to “missing policy” vs “wrong column” vs “network.” That process is tedious but mechanical; the fix is almost always aligning **one** of: policy, key tier, or payload shape.

One subtle trap: **the app can “work” locally with a service role key** while **staging fails on anon RLS**, which feels like a flaky deploy until you realize the environments are not equivalent. Documenting “required policies for anon inserts” next to `schema.sql` would have saved an hour; I ended up diffing policies against the error text instead.

For hydration, the bug pattern was “server rendered default, client immediately read storage and diverged.” The fix was to centralize storage reads behind **`useSyncExternalStore`**-style hooks so the server snapshot and first client snapshot match, then subscribe for updates. That turned an intermittent warning into a **designed** contract: default on SSR, hydrate, then sync.

A secondary lesson: **client-only APIs** (`sessionStorage`, `clipboard`, `print`) must never gate first paint on their availability. Any “read storage in render without a safe snapshot” pattern will eventually break when React strict mode or SSR assumptions shift. The durable approach is: stable default → subscribe → re-render.

**Rating (problem-solving): 8/10** — Integration debugging is slow but methodical; the gap is earlier investment in integration tests for routes.

---

## 2. What was the most important architecture decision?

The most important decision was **deterministic-first audit output with an optional, isolated LLM narrative**. Concretely: `generateAuditReport()` and `lib/audit/rules.ts` own every dollar of `estimatedSavings` and every `RecommendationType`. The `/api/summary` route only **describes** that output; it never recomputes totals or invents new actions.

That decision traded “magic AI insights” for **auditability**: the same inputs must yield the same recommendations in CI, and product trust hinges on that. The LLM is a **presentation layer**—valuable for readability, but disposable thanks to `fallbackSummary()`.

The tradeoff is real: you cannot promise “the model will sound brilliant every time,” and you should not try. Instead you promise **repeatable math** and **bounded narrative**. For a founder selling into operators who forward reports internally, repeatability is the sharper wedge.

**Reversed decision:** An earlier sketch assumed the LLM could “refine” savings numbers for nuance. That was reversed before implementation: any numeric post-processing by a model would break testability and blur accountability. Narrative-only won.

Secondary benefits: **support and sales** can point to `rules.ts` and tests when challenged; **marketing** can claim repeatability; **engineering** can ship pricing catalog updates without retraining a model.

**Rating (architecture judgment): 9/10** — Correct for a compliance-minded B2B artifact; cost is that summaries feel less “creative.”

---

## 3. What would you improve in the next week of work?

I would prioritize three items:

1. **Route-level integration tests** (mock Supabase client) for `POST /api/reports` and `POST /api/leads` happy paths and RLS failure paths—Vitest already proves the engine; the next failure surface is HTTP + DB policy drift.

2. **Structured logging** (JSON lines) around persistence and Resend failures, with **no PII in logs**—today `console.error` is enough for MVP but not for triage at scale.

3. **Server-side rate limits** on lead submission keyed by IP + report id, keeping the honeypot and cooldown as defense-in-depth rather than the only wall.

I would *not* spend week two on new rules until observability proves which rules misfire in production.

A pragmatic sequencing rule: **instrument before optimizing**. Without counts of `/api/reports` successes, fallback summary rate, and lead POST failures, any performance work is guesswork. The smallest useful dashboard might be five counters and a latency histogram for the three POST routes.

**Rating (execution focus): 7/10** — Clear backlog; needs real traffic to prioritize.

---

## 4. What did you learn about mixing deterministic systems with AI—and how did you actually use AI tools?

**Deterministic systems fail visibly:** wrong rule → wrong number → unit test fails. **AI fails softly:** empty text, hedging, or plausible-sounding extra bullets. The lesson is that **constraints + validation + fallback** are not polish—they are part of the product contract.

**AI tool usage (honest):** I used an LLM assistant for scaffolding (copy tone, doc outlines, TypeScript refactors) and to sanity-check edge cases in natural language. I did **not** allow generated code to touch savings formulas without reading `engine.ts` and running `npm test`.

**Example where AI was wrong:** A suggested “fix” for a storage hook used `useEffect` to sync localStorage into React state on mount. That pattern reintroduced the hydration class of bugs the app had just eliminated. It was caught by **re-reading the existing `useSyncExternalStore` approach** and rejecting the effect-based patch. The correct fix was extending the same external-store pattern to session storage, not adding effects.

More broadly: **LLM prose drifts** even when numbers are fixed. That is why AuditAI clamps word count, strips markup, and replaces bad output with `fallbackSummary()`. The product lesson is not “never use AI”—it is **never let AI be the only line of defense** for user-visible claims that imply dollars.

**Rating (AI hygiene): 8/10** — Good when treated as a junior pair programmer with mandatory tests.

---

## 5. Self-evaluation (strengths, gaps, numeric self-ratings)

**Strengths**

- Deterministic core with **meaningful Vitest coverage** (overkill plans, redundancy, API spend, credit opportunity, optimized stack, edge cases, savings totals).
- **Clear separation** between narrative AI and numeric audit.
- **Shareable report + metadata** path that treats public URLs as first-class.

**Gaps**

- Production **abuse controls** are intentionally light; scaling users requires harder limits.
- **Observability** is minimal; debugging production will need structured logs and dashboards.
- **Pricing catalog** is static; real vendors move prices monthly.

**Self-ratings (1–10, with reason)**

| Area | Score | Why |
| --- | ---: | --- |
| Engineering rigor | 8 | Tests + typed engine; integration tests still thin. |
| Product clarity | 8 | Honest about deterministic vs AI; some UX still MVP. |
| Operational readiness | 6 | Logs/rate limits/alerting not yet “on-call ready.” |
| Communication (docs) | 8 | Architecture and prompts explain trust boundaries. |

**Overall: 7.5/10** — Strong submission for a constrained-time MVP; the next increment is operational hardening, not feature sprawl.

If I were an external reviewer, I would ask one uncomfortable question: **“What breaks first at 100× traffic?”** Today the honest answer is **database write pressure and abuse on `/api/leads`**, not the audit engine. Naming that explicitly is more credible than pretending infinite scale.
