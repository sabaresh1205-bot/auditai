# Architecture

This document describes AuditAI’s system architecture, end-to-end data flow, technology choices, deterministic engine behavior, AI isolation, scaling posture, and lightweight abuse protections.

---

## System diagram (Mermaid)

```mermaid
flowchart TB
  subgraph client [User browser]
    A[Landing /audit]
    F[AuditForm]
    E["generateAuditReport()"]
    R[/results]
    C[AuditReportContext sessionStorage]
  end

  subgraph next [Next.js App Router]
    P1["POST /api/reports"]
    P2["POST /api/summary"]
    P3["POST /api/leads"]
  end

  subgraph data [Persistence]
    SB[(Supabase Postgres + RLS)]
  end

  subgraph ai [Optional AI]
    LLM[OpenAI / Anthropic APIs]
    FB[fallbackSummary deterministic]
  end

  A --> F
  F --> E
  E --> C
  F --> R
  R --> P1
  R --> P2
  R --> P3
  P1 --> SB
  P3 --> SB
  P2 --> LLM
  P2 --> FB
  R --> Pub["/report/id SSR"]
  Pub --> SB
```

**Data flow (user input → audit result):**

1. User enters team context and tool rows on `/audit`.
2. Client runs `generateAuditReport(input)` (`lib/audit/engine.ts`): pure rules, no network.
3. Result is stored in React context (`contexts/AuditReportContext.tsx`, session-scoped).
4. `/results` shows recommendations, triggers `POST /api/reports` once (idempotent client guards), then optional `POST /api/summary`, then optional `POST /api/leads`.
5. Public share URL reads the row server-side with `is_public = true`.

---

## Why Next.js, TypeScript, Tailwind, and Supabase

| Choice | Rationale |
| --- | --- |
| **Next.js (App Router)** | Single codebase for marketing pages, client-heavy audit UI, and `route.ts` API handlers. SSR for public reports gives correct Open Graph metadata without a separate frontend. |
| **TypeScript** | The audit engine and validation schemas are correctness-critical; static typing catches drift between `AuditInputV1`, Zod payloads, and Supabase JSON. |
| **Tailwind CSS** | Fast iteration on a consistent design system; utility-first styling keeps UI code co-located with components. |
| **Supabase** | Managed Postgres + RLS for `audit_reports` and `leads` without running a custom API database. Anon + optional service role fit a no-login MVP. |

---

## Deterministic audit engine

- **Location:** `lib/audit/engine.ts` orchestrates; `lib/audit/rules.ts` defines rules; `lib/audit/pricing.ts` holds USD list-price assumptions for target-spend hints.
- **Properties:** Pure functions of input; same input → same recommendations and totals.
- **Selection:** Rules emit candidates; dedupe; then **one recommendation per `toolId`** via fixed type precedence and stable tie-breaks (savings, then action string).
- **Totals:** `monthlySavings` sums **positive** `estimatedSavings` from the selected set only; `annualSavings = round(monthlySavings × 12)`.
- **Benchmark mode (deterministic):** `lib/report/benchmarks.ts` compares current spend-per-developer to a static internal reference table by team-size bucket. It is a lightweight guidance layer and does not affect recommendations or savings totals.

---

## AI summary isolation

- **LLM generates narrative only, never pricing decisions.** Savings math and recommendation types are fixed before any model call.
- **Flow:** `POST /api/summary` builds a structured prompt from deterministic payload (`lib/ai/prompts.ts`), calls a provider (`lib/ai/providers/*`), sanitizes/clamps output (`lib/ai/generateAuditSummary.ts`).
- **Fallback:** On missing keys, timeout, or invalid short output, `fallbackSummary()` produces copy from the same deterministic facts—no LLM required.
- **Client cache:** Successful summaries may be cached in `localStorage` by hash of audit inputs to avoid repeat provider cost (does not affect savings math).

---

## Serverless / API separation

- **Edge-friendly static/compute split:** Core audit runs in the browser; server routes handle persistence, email, and optional LLM proxy. This keeps latency low for “Generate audit” and bounds server CPU cost.
- **Clear boundaries:** `route.ts` handlers validate with Zod, return structured errors, and never re-implement business rules that belong in `lib/audit/*`.
- **Embed mode:** `/embed` is intentionally client-local and deterministic (`generateAuditReport` only), with no Supabase persistence, no AI summary request, and no lead/email flow.

---

## Scaling toward ~10k audits/day

Rough capacity thinking (order-of-magnitude):

| Layer | At higher volume |
| --- | --- |
| **Deterministic compute** | Stays on clients; no central bottleneck for rule evaluation. |
| **`POST /api/reports`** | Becomes the main write path; ~10k inserts/day ≈ 0.12 sustained RPS—modest for Postgres with connection pooling; watch burst traffic and index size on `audit_reports`. |
| **`POST /api/summary`** | LLM cost and provider rate limits dominate; **per-report cap**, **queue**, or **async worker** would be the next step—not required at MVP scale. |
| **`POST /api/leads`** | Lower volume; still benefits from stricter per-IP/per-email limits if abused. |

**Caching / rate limiting (possible upgrades):**

- **CDN / static:** Next.js static assets and ISR/SSR pages benefit from edge caching for `/report/[id]` reads.
- **Application cache:** Redis or Vercel KV for idempotency keys or summary responses if moving AI server-side.
- **Rate limits:** WAF / middleware limits on `POST /api/leads` and `POST /api/reports` by IP + sliding window; stricter limits on summary if metered.

---

## Abuse protection (lightweight, production-minded)

The MVP intentionally avoids a full auth system but still reduces automated abuse:

| Mechanism | Where | Rationale |
| --- | --- | --- |
| **Honeypot field** | `LeadCaptureForm` → `POST /api/leads` | Bots often fill hidden fields; server rejects non-empty `honey`. |
| **Cooldown** | Server compares `cooldownAt` from client to reject rapid repeats (`COOLDOWN_MS`) | Cheap throttle on accidental or scripted spam; pairs with client-side spacing. |
| **Zod validation** | All POST bodies | Rejects malformed payloads early. |

**Why not heavier controls yet:** Lower friction for legitimate users sharing reports; next steps would be IP-based limits, CAPTCHA on leads only, or signed report tokens if abuse appears.

---

## Supabase and public reports

- Inserts: `audit_reports` with `is_public = true`; `leads` for email capture.
- Reads: public report page queries **only** `is_public = true` by id.
- RLS: schema expects policies for anon insert where applicable; optional `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS for server inserts when configured.

---

## Frontend/Backend/Data Flow (summary)

1. **Audit input → deterministic recommendations (client):** `AuditForm` → `generateAuditReport` → `AuditReportContext`.
2. **Results → persist:** `POST /api/reports` → Supabase row + share id.
3. **Results → summary:** `POST /api/summary` → LLM or fallback.
4. **Results → lead:** `POST /api/leads` → Supabase + transactional email (Resend) best-effort.
5. **Public read:** `app/report/[id]/page.tsx` SSR + `generateMetadata` for OG/Twitter/canonical URLs (`NEXT_PUBLIC_BASE_URL` or `VERCEL_URL`).

---

## SEO and Open Graph (public reports)

- **`app/report/[id]/page.tsx`** implements `generateMetadata`: dynamic **title** and **description** include deterministic monthly/annual savings (`formatMoneyDeterministic`), not hard-coded currency symbols.
- **Canonical and `openGraph.url`:** `lib/seo/publicSiteUrl.ts` builds absolute URLs from **`NEXT_PUBLIC_BASE_URL`** (preferred) or **`VERCEL_URL`** on Vercel. If neither is set (e.g. misconfigured self-host), metadata omits absolute URL fields rather than guessing—**set `NEXT_PUBLIC_BASE_URL` in production** for correct Slack/LinkedIn previews.
- **Twitter:** `twitter.card`, `twitter.title`, and `twitter.description` mirror the OG text for summary cards.

---

## Future improvements

- Stronger server-side rate limits and structured logging on route handlers.
- Optional queue for AI summaries at high volume.
- Expanded pricing catalog coverage (`PRICING_DATA.md` traceability).
