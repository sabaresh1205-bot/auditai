# Development Log (AuditAI)

This devlog is an engineering-focused reconstruction of the work needed to reach the current implemented architecture and MVP behavior.

---

## Day 1 — Deterministic audit engine foundation

**Hours worked:** 5.5  
**Completed tasks:**
- Implemented the core deterministic audit engine (`lib/audit/engine.ts`) as pure functions.
- Added deterministic recommendation selection:
  - de-duplication by `(toolId, type, recommendedAction)`
  - stable “one recommendation per tool” selection using a fixed precedence ordering.
- Sketched the business-rule approach by splitting logic into `lib/audit/rules.ts` and a pricing catalog (`lib/audit/pricing.ts`) used only for numeric target spend.

**Blockers / challenges:**
- Avoiding accidental non-determinism (object iteration order, unstable sorting) so outputs remain stable for the same input.

**Decisions made:**
- Keep the savings math entirely rule-based and computed locally in the browser.
- Use deterministic tie-breakers (priority → estimated savings → recommended action/tool name).

**Lessons learned:**
- Determinism is easiest when the engine is pure and when sorting/tie-breaking rules are explicit.

**Next-day plan:**
- Add the first set of deterministic rules (overkill plan detection, cost-per-seat, redundant tools).
- Create baseline Vitest tests that lock expected behavior.

---

## Day 2 — Implement core rules + deterministic test coverage

**Hours worked:** 6  
**Completed tasks:**
- Added rule implementations in `lib/audit/rules.ts` (e.g., overkill plan detection, cost-per-seat, redundant tool detection).
- Implemented deterministic “honesty” behaviors:
  - when no savings apply, produce `NO_CHANGE` rather than inventing opportunities.
  - only positive savings contribute to totals.
- Added initial Vitest suite (`auditai/tests/audit/*.test.ts`) covering:
  - overkill plan downgrades
  - redundancy consolidation
  - API spend thresholds
  - edge cases (zero spend, empty tool list, duplicates).

**Blockers / challenges:**
- Modeling savings so they never exceed the current spend (and never go negative).

**Decisions made:**
- Centralize numeric rounding and clamp behavior in shared helpers (to keep all rules consistent).

**Lessons learned:**
- Tests are most valuable when they encode business intent (“don’t invent savings”) rather than just snapshots.

**Next-day plan:**
- Build the UI flow that wires the engine output into persistence and results presentation.

---

## Day 3 — UI flow + Supabase persistence (reports)

**Hours worked:** 4.5  
**Completed tasks:**
- Implemented `AuditForm` (`components/audit/AuditForm.tsx`) with input validation and local report generation.
- Added client state + persistence context (`contexts/AuditReportContext.tsx`) backed by localStorage.
- Implemented report persistence API:
  - `POST /api/reports` inserts into `public.audit_reports`
  - route returns `{ id, createdAt }`.
- Added the public report page:
  - `app/report/[id]/page.tsx` loads by `is_public = true` and renders deterministic recommendations + portfolio insights.

**Blockers / challenges:**
- Ensuring “shareable report creation” runs once per audit payload even under StrictMode rerenders.

**Decisions made:**
- Use deterministic localStorage-backed idempotency keys (`buildPersistKey`) plus a `useRef` guard (`persistAttemptedForKeyRef`) on the results page.

**Lessons learned:**
- Idempotency matters even in small apps because React rerenders can easily duplicate side effects.

**Next-day plan:**
- Add optional AI executive summary generation and isolate it from numeric savings logic.

---

## Day 4 — AI executive summary (isolated) + deterministic fallback

**Hours worked:** 5  
**Completed tasks:**
- Implemented `POST /api/summary` and `generateAuditSummary()`:
  - builds prompt from deterministic top recommendations (`lib/ai/prompts.ts`)
  - calls OpenAI by default, with Anthropic supported by code
  - sanitizes and clamps output (`sanitizeSummaryText`, word counting/clamping)
  - falls back to `fallbackSummary()` when AI is unavailable or output is invalid.
- Added AI summary caching in the results page via localStorage keyed by a deterministic hash.
- Added the `AISummaryCard` UI with loading/error/retry states.

**Blockers / challenges:**
- Preventing “LLM output drift” from breaking UX (empty output, very short outputs, accidental markup).

**Decisions made:**
- Treat AI as a “best-effort narrative layer” only; numeric savings remain deterministic.

**Lessons learned:**
- Output constraints + deterministic fallback are essential for predictable user experience.

**Next-day plan:**
- Implement lead capture and Supabase schema/RLS alignment for MVP usage.

---

## Day 5 — Lead capture, spam protection, and RLS troubleshooting

**Hours worked:** 6  
**Completed tasks:**
- Implemented `LeadCaptureForm` that posts to `POST /api/leads` with:
  - a hidden honeypot field (`honey`)
  - client-side retry cooldown and session de-dupe using `sessionStorage`
  - server-side cooldown (`COOLDOWN_MS = 8000`)
- Implemented the `POST /api/leads` route:
  - validates payload with Zod (`leadSubmissionSchema`)
  - checks honey and cooldown before inserting.
- Added `supabase/schema.sql` with tables and RLS policies for leads and audit reports.
- Added clearer error handling around RLS failures and Supabase configuration.

**Blockers / challenges:**
- Supabase Row Level Security policy mismatch: even when the schema file was updated, inserts still failed until the policy matched the actual role used by the request.

**Decisions made:**
- Keep leads insertion as MVP-only, but make failure modes explicit (error codes and actionable messages).
- Allow optional service-role bypass (`SUPABASE_SERVICE_ROLE_KEY`) for server-side inserts when configured.

**Lessons learned:**
- “Schema exists” is not enough; RLS role/policy correctness must be validated in the target Supabase project.

**Next-day plan:**
- Clean up UI correctness issues (hydration mismatches) and ensure the app stays stable in production-like rendering.

---

## Day 6 — Stabilize client rendering and finalize docs-ready architecture

**Hours worked:** 3.5  
**Completed tasks:**
- Fixed a hydration mismatch caused by localStorage reads during the initial render.
- Adjusted the storage hook to initialize safely and hydrate in `useEffect`.
- Updated the audit context hydration state to avoid server/client markup divergence.

**Blockers / challenges:**
- React hydration errors are noisy and can hide real issues during development.

**Decisions made:**
- Centralize “read localStorage only after mount” behavior in `useLocalStorageJson` to prevent repeat issues.

**Lessons learned:**
- Hydration mismatches are best solved by eliminating server/client branching and deferring browser-only reads.

**Next-day plan:**
- Add/expand documentation (README, architecture, prompts, testing philosophy, and go-to-market narrative) so the implementation is easier to maintain.

