# Architecture

This document describes AuditAI’s implemented system architecture and data flow across the frontend, backend route handlers, deterministic audit engine, AI summary generation, and Supabase persistence.

---

## High-level System Architecture

AuditAI is a Next.js (App Router) application with:

1. **Client-side UI (React Client Components)**
  - Collects audit inputs (`/audit`)
  - Computes deterministic recommendations in the browser
  - Shows results and handles sharing / lead capture (`/results`)
  - Renders public reports (`/report/[id]`)
2. **Server-side route handlers (Next.js `route.ts`)**
  - `POST /api/reports`: persist a deterministic, shareable public audit report in Supabase
  - `POST /api/summary`: generate an executive summary via LLM providers or fallback deterministically
  - `POST /api/leads`: store lead submissions in Supabase
3. **Core deterministic business logic**
  - Pure rule engine computes recommendations and numeric savings
4. **Optional LLM layer (isolated)**
  - LLM is used only for narrative text (“executive summary”), not for numeric savings
  - The system sanitizes and constrains output and falls back deterministically when AI is unavailable or invalid
5. **Supabase persistence + RLS**
  - Audit reports are stored with an `is_public` flag and retrieved only when public
  - Leads are stored in a separate table and are subject to RLS policies

---

## Frontend/Backend/Data Flow

### 1) Audit input → deterministic recommendations (client-first)

1. A user opens `**/audit`** (`app/audit/page.tsx`).
2. `AuditForm` (`components/audit/AuditForm.tsx`) collects:
  - `teamSize`, `primaryUseCase`, `currency`
  - a list of tools with `{ toolId, planType, monthlySpend, seats }`
3. `AuditForm` validates the input with deterministic checks (basic bounds + presence).
4. On “Generate audit”, the browser computes:
  - `generateAuditReport(input)` from `lib/audit/engine.ts`
5. The computed payload is stored in `AuditReportContext` (`contexts/AuditReportContext.tsx`) and the app navigates to `**/results`**.

### 2) Deterministic results → persist shareable report (backend insert)

1. On `**/results**` (`app/results/page.tsx`), the page uses the stored deterministic report.
2. The page persists a shareable report by calling:
  - `POST /api/reports` (`app/api/reports/route.ts`)
3. The server persists:
  - input (`input_data`)
  - deterministic recommendations and savings (`report_data`, plus numeric totals)
  - `is_public = true`
4. The results page avoids duplicate inserts using local idempotency guards:
  - a local ref (`persistAttemptedForKeyRef`)
  - deterministic localStorage keys (`buildPersistKey`)

### 3) Executive summary generation (isolated AI call)

1. Still on `**/results**`, the page calls `POST /api/summary` (`app/api/summary/route.ts`) to generate an executive summary.
2. `POST /api/summary`:
  - builds an LLM prompt from deterministic inputs + top recommendations (`lib/ai/prompts.ts`)
  - calls one of the providers:
    - OpenAI (`lib/ai/providers/openai.ts`)
    - Anthropic (`lib/ai/providers/anthropic.ts`)
  - sanitizes/clamps model output (`lib/ai/generateAuditSummary.ts`)
  - falls back to deterministic summary generation (`lib/ai/fallbackSummary.ts`) when:
    - provider keys are missing
    - provider calls fail
    - output is empty/too short after constraints
3. Results caching:
  - The client caches successful/fallback summaries in `localStorage` keyed by a deterministic hash (`fnv1a32`).

### 4) Shareable public report rendering (public read path)

1. Once persisted, the results page computes:
  - `shareUrl = /report/[id]` using the saved persisted report id
2. The public report page (`app/report/[id]/page.tsx`) loads:
  - Supabase row filtered by `is_public = true` (`getPublicAuditReportById`)
3. The page converts DB row JSON into typed structures:
  - `buildPublicReportPayload` (`lib/report/public.ts`)
4. The page derives additional deterministic “portfolio insights”:
  - `generatePortfolioInsights` (`lib/report/insights.ts`)

### 5) Lead capture after share (backend insert + anti-spam checks)

1. On `**/results**`, the `LeadCaptureForm` is shown (`components/lead-capture/LeadCaptureForm.tsx`).
2. The form posts to `POST /api/leads` (`app/api/leads/route.ts`) with:
  - `email` (required)
  - optional: `companyName`, `role`, `teamSize`
  - hidden: `honey` field (anti-bot)
  - Lead submissions include lightweight anti-spam protections and retry controls.
3. `POST /api/leads`:
  - validates payload via Zod (`lib/validation/api.ts`)
  - performs anti-spam checks
  - inserts into Supabase `leads`
  - sends a confirmation email

---

## Deterministic Audit Engine Flow

The deterministic audit engine is the source of truth for:

- numeric savings totals
- per-tool recommendations

It is implemented as pure functions:

1. `**generateAuditReport(input)**` (`lib/audit/engine.ts`)
  - builds deterministic context:
    - aggregates tool spend by toolId
    - groups tool usage rows
  - applies deterministic rules from `ALL_RULES` (`lib/audit/rules.ts`)
  - deduplicates recommendations deterministically:
    - same `(toolId, type, recommendedAction)` keeps the higher savings estimate
  - selects at most one highest-priority recommendation per toolId using:
    - a fixed `PRECEDENCE` ordering by recommendation type
    - stable tie-breaking by savings and then action name
  - computes totals deterministically:
    - monthly savings sums only positive savings
    - annual savings derived as monthly × 12
2. **Deterministic testability**
  - The repo includes Vitest coverage focused on rule outputs (`auditai/tests/audit/*.test.ts`), ensuring stable behavior across changes.

---

## AI Summary Isolation

AuditAI isolates the AI “executive summary” from the deterministic numeric audit:

1. The AI layer receives **structured deterministic inputs**:
  - team size, use case, currency
  - top recommendations (selected deterministically in `buildUserPrompt`)
  - the computed savings totals
2. The LLM prompt includes constraints:
  - system prompt instructs the model to use only the provided numbers/recommendations and to avoid inventing savings (`lib/ai/prompts.ts`)
3. Output normalization and reliability:
  - `sanitizeSummaryText` removes accidental markup and collapses whitespace
  - output is clamped to a word budget
  - output is constrained for readability
4. Fallback behavior:
  - When the AI call cannot be completed or output is invalid, the app uses `fallbackSummary()` which is deterministic and derived from the same recommendations used for the prompt.

---

## Supabase Persistence Flow

Supabase tables:

- `public.audit_reports`
- `public.leads`

### Persist public audit reports

- `POST /api/reports` inserts rows into `audit_reports` with:
  - `input_data` (JSON of `AuditInputV1`)
  - `report_data` (JSON of deterministic summary/recommendations)
  - `total_monthly_savings`, `total_annual_savings`
  - `is_public = true`

### Persist leads

- `POST /api/leads` inserts into `leads`:
  - `email`
  - `company_name`, `role`, `team_size` (optional)
  - `created_at` defaults to `now()`

### Public report reads

- `GET` is not used for report persistence; instead the public report page:
  - calls `getPublicAuditReportById(client, id)` which selects only rows with `is_public = true`
  - uses the stored JSON to build a UI payload and derived insights

---

## Public/Private Report Separation

Separation is implemented via an `is_public` boolean in `public.audit_reports`.

Current behavior:

- All persisted reports are inserted as public (`/api/reports` always sets `is_public = true`).
- Public rendering explicitly filters to `is_public = true`.

---

## Scalability Considerations

1. **Deterministic compute is client-side**
  - The server is only responsible for persistence and AI summary generation.
2. **Persistence and AI costs are minimized**
  - Report persistence is protected against duplicate inserts via deterministic keys and local idempotency guards.
  - AI summaries are cached on the client (localStorage) so repeated visits do not always trigger new LLM calls.
3. **LLM reliability controls**
  - Provider requests are time-bounded (abort after ~8s).
  - Output constraints + deterministic fallback reduce the risk of unbounded or unusable output.
4. **RLS policy complexity**
  - Supabase RLS governs inserts/reads on stored tables.
5. **Anti-spam behavior**
  - Lead submissions include lightweight anti-spam protections and retry controls.
  - This reduces repeated writes under bot-like behavior.

---

## Future Improvements

Potential future improvements include:

1. **Better server-side throttling**
  - Lead submissions could benefit from stronger server-side, key-based throttling to improve abuse resistance.
2. **More robust tool pricing coverage**
  - Deterministic rules use a pricing catalog for numeric target spends.
  - Inputs can include toolIds beyond what the pricing catalog currently models; rules skip unknown pricing entries.
3. **Observability**
  - Add structured logging for route handlers (especially around Supabase insert failures and AI provider failures).

