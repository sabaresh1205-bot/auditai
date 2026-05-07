# Reflection

## Hardest Technical Problem

The most time-consuming issue wasn’t the deterministic audit math—it was the integration boundaries:

1. **Supabase Row Level Security (RLS) mismatches for lead inserts**
  - One of the more time-consuming challenges was aligning Supabase access policies with the application’s persistence flow across local and deployed environments.
2. **Hydration mismatches caused by localStorage reads during initial render**
  - The results page includes client components that depend on browser storage.
  - An initial render mismatch between server markup and client-rendered markup produced React hydration warnings, which can mask other issues during development.

Together, these issues reinforced the importance of correctness at integration boundaries.

---

## Biggest Architecture Decision

The biggest decision was to make the audit output **deterministic and rule-based**, and to treat the LLM as an optional, isolated narrative layer.

Concretely:

- deterministic recommendations + numeric savings are produced by pure functions (`lib/audit/`*)
- the AI summary call (`/api/summary`) transforms that deterministic output into a short executive summary
- if the LLM is unavailable or output validation fails, the system falls back to a deterministic `fallbackSummary()`

This minimized the risk of “AI drift” affecting the business logic and made the core product more trustworthy.

---

## What Would Improve in Week 2

If we continue for another week, the improvements that would give the best ROI are:

1. **Stronger server-side observability**
  - Structured logs around:
    - Supabase insert failures (especially for RLS)
    - provider failures and fallback usage
  - This would reduce time-to-diagnosis when issues occur in a deployed environment.
2. **More robust rate limiting / idempotency for lead capture**
  - The current cooldown is time-based and relies partly on the client-sent timestamp.
  - A server-side limiter keyed by IP/email/report id would better prevent abuse while keeping legitimate retry behavior smooth.
3. **Integration tests for route handlers**
  - Deterministic unit tests are already strong; adding narrow integration tests for:
    - `/api/reports` success/error paths
    - `/api/leads` RLS/config failure modes
  - would improve confidence without requiring real LLM calls.

---

## Lessons About Deterministic vs AI Systems

1. **Deterministic systems fail in predictable ways**
  - Most failures show up as “wrong output given input”, which unit tests can catch.
2. **AI systems fail in ambiguous ways**
  - “Empty output”, “too short output”, “minor formatting drift”, and “hallucinated content” are all realistic failure modes.
  - The combination of strict prompt constraints, output sanitization, and deterministic fallback is essential—not optional.
3. **Isolation is the real win**
  - Keeping savings math entirely outside the AI layer reduces the blast radius of LLM unreliability.

---

## Self-evaluation

Strengths:

- The core audit engine is deterministic, test-covered, and structured around explicit business rules.
- The AI layer is constrained and guarded with fallback logic, which keeps UX dependable.

Gaps:

- Operational reliability (RLS policy mismatch handling and observability) still needs hardening for production.
- Some user-facing distribution features are intentionally minimal; future iteration can improve report delivery workflows.

