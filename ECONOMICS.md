# Economics

This document models the MVP’s economics using the behavior implemented in the current codebase:

- deterministic audit recommendations are computed in the browser (no LLM tokens for the core savings math)
- the app persists deterministic reports to Supabase when a user reaches `/results`
- the app calls an LLM endpoint (`POST /api/summary`) only for the optional executive summary
- AI summaries are cached client-side (localStorage) and use deterministic fallback when providers are unavailable

---

## Estimated Infrastructure Cost (Monthly, MVP scale)

Because the MVP is a small Next.js + Supabase app, infrastructure cost is dominated by:

- Next.js hosting (build/runtime)
- Supabase database storage/compute + bandwidth
- optional logging/observability

Typical MVP ranges (assumptions you should refine with your hosting provider):

- **Next.js hosting:** ~$10–$50/month  
  - Vercel/Next hosting varies with build frequency and traffic.
- **Supabase (Postgres + storage):** ~$20–$150/month  
  - depends heavily on database size, read/write volume, and the chosen Supabase tier.
- **Observability/logging (optional):** ~$0–$25/month  
  - depends on how aggressively you add logs/retention.

At low traffic, most costs are predictable. At higher traffic, DB write volume and AI calls become the primary drivers.

---

## API Cost Considerations (LLM + network)

### What triggers AI cost?

The only LLM-related call is:

- `POST /api/summary` → `generateAuditSummary()`

Key constraints in code:

- request timeout: ~8 seconds (aborts long calls)
- max tokens configured: `max_tokens: 200`
- output is further clamped to a word budget (~110 words)
- if keys are missing or provider call fails, the app uses deterministic `fallbackSummary()` (no LLM spend)

### How caching reduces AI spend

The results page caches summaries in localStorage keyed by a deterministic hash of the audit inputs.
Practical implication:

- repeat visits to the same audit payload do not always incur a new LLM call.

### Cost model (formula, not hard pricing)

Let:

- `R` = number of audits where the AI summary is generated
- `N` = average number of LLM calls per user session (should be ~1 due to client caching)
- `T_in` = average prompt tokens
- `T_out` = average output tokens (bounded by `max_tokens: 200` + clamping)

Estimated LLM spend:
`AI_cost ≈ R * N * (cost_per_token_in * T_in + cost_per_token_out * T_out)`

The easiest way to make this precise is to:

- log token usage from provider responses
- compute per-summary median tokens

---

## Hypothetical Pricing Model

This MVP is intentionally access-free. The pricing model below outlines a plausible path to sustainability while respecting current product behavior.

### Stage 1: Free audit + usage-limited AI (most realistic for MVP)

- **Free:** deterministic audit generation always available
- **Optional AI executive summary:** either free for limited usage or included for a small fee

Implementation alignment:

- the deterministic engine is already local-first, so it remains free
- you can meter AI summary generation by:
  - provider usage
  - and/or a simple server-side counter keyed by report id/email

### Stage 2: Paid tiers based on workflow value (future)

Paid tiers could differentiate via increased AI-summary usage allowances and higher throughput as adoption grows.

---

## CAC Assumptions (Early traction)

Assumptions for a small, deterministic SaaS:

- primary channels: content + community + viral sharing of public report links
- early acquisition can be founder-led outreach

- Early acquisition assumptions are hypothetical and would need validation through real usage data.

---

## Conversion Assumptions

Current conversion points in the UI:

- Activation event: user generates audit and reaches `/results`
- Persistence event: user triggers `POST /api/reports` and gets a persisted report id
- Lead event: user submits email via `/api/leads`

Plausible rates to start with (must validate):

- Visit → Generate audit: 25–40%
- Generate audit → Persist report: 10–25%
- Persist report → Email lead submission: 5–15%

If AI summary is optional and cached, a lower AI generation rate lowers costs; deterministically computed savings still provides value without AI.

---

## Path to Sustainable SaaS Economics

The app can reach sustainable economics by controlling one primary variable: **AI summaries per active user**.

Practical strategy:

1. Keep deterministic output always available and fast (already true).
2. Make AI summaries best-effort and cached (already true):
  - fallbackSummary provides value even when AI is unavailable.
3. Introduce hard metering only for the LLM layer:
  - cap AI summary generations per user/session/report in the backend.

When AI spend is under control:

- Supabase DB writes scale linearly with persisted reports.
- deterministic compute stays client-side.

That yields a clearer “unit economics” model:

- revenue must cover DB + hosting + a bounded AI cost per retained user.

---

## What to Measure First (to validate the model)

- Persisted reports per 1,000 audit attempts
- AI summary generation rate per persisted report
- median token usage per summary (from provider or token estimates)
- lead submission rate per persisted report

These measurements let you convert the formula into real cost per retained user.