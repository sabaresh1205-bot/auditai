# Metrics

These metrics are derived from the current user journey and implemented endpoints:

- deterministic audit generation on the client
- persistence to Supabase via `POST /api/reports`
- optional executive summary via `POST /api/summary` with fallback
- lead capture via `POST /api/leads`

---

## North-Star Metric

**Shareable public reports created**

- Definition: number of successfully persisted report rows in `public.audit_reports` (where `is_public = true`), aggregated by time window (daily/weekly).
- Why this is the north star:
  - it represents a user reaching the “decision artifact” moment (a public URL they can share internally)
  - it directly ties to a measurable backend event (`/api/reports` returning `201`)

---

## Supporting Metrics

1. **Audit activation rate**
  - Definition: % of landing/audit page visits that generate deterministic recommendations and navigate to `/results`.
  - Proxy signals in code:
    - navigation occurs after `AuditForm` sets stored report state and routes to `/results`.
2. **Persistence conversion rate**
  - Definition: % of `/results` sessions that successfully call `POST /api/reports` and obtain an `id`.
  - Why it matters: it measures whether users find the output worth sharing.
3. **Share link readiness rate**
  - Definition: % of persisted reports where the computed `shareUrl` is non-null and the UI copy action is used.
  - Note: the current code doesn’t record analytics; you’d add lightweight event logging around the “Copy share link” handler.
4. **Lead capture opt-in rate**
  - Definition: leads created per persisted report.
  - Backend tie-in: `/api/leads` returns `201` with a deterministic JSON structure `{ id, createdAt }`.
5. **AI summary success rate**
  - Definition: % of summary requests that return AI source vs fallback source.
  - Backend tie-in: `/api/summary` returns `{ ok: true, summary, source }` and `generateAuditSummary()` chooses `ai` vs `fallback`.
6. **AI summary failure / fallback rate**
  - Definition: % of summary requests that ended in fallback due to missing keys or provider errors.
  - Why it matters: high fallback rates reduce perceived value of the AI layer (even though deterministic output remains valuable).

---

## Activation Metric

**Primary activation:** persisted public report creation

- Definition: user generates audit → reaches `/results` → report persistence succeeds (`/api/reports` returns 201).

Secondary activation (optional):

- user reads recommendations and sees the executive summary card (AI or fallback).

---

## Retention Signals

Because there is no login in the current MVP, retention should be measured with anonymous, client-side signals (e.g., localStorage counters) or operational aggregates:

1. **Repeat audit artifact creation**
  - Definition: % of anonymous users who create a second persisted report within 7/14 days.
2. **Re-sharing of prior outputs**
  - Definition: users generating multiple share URLs or re-copying share links from the same session.
3. **Lead follow-up responsiveness (future)**
  - If/when outbound confirmation is fully enabled, measure:
    - open/click rates
    - conversion back to running audits

