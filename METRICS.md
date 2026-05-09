# Metrics

AuditAI is a **B2B lead-generation and decision-support** product—not a social consumer app. Metrics should track **artifact creation, sharing, and qualified interest**, not vanity pageviews alone.

---

## North Star metric

**Persisted public reports per week** (`POST /api/reports` returning **201**, `is_public = true`)

**Why:** A saved report is the **shareable decision artifact**—the moment a team can forward a URL to finance or leadership. Everything upstream (visits, audits) is diagnostic; everything downstream (leads, consults) is conversion.

---

## Three input metrics (leading indicators)

These feed the north star and surface funnel breakage early:

1. **Audit completion rate**  
   - **Definition:** Sessions that run `generateAuditReport` and land on `/results` ÷ sessions that start `/audit` with intent (e.g., first field interaction or “Run audit” click—pick one instrumentation definition and keep it stable).  
   - **Why:** Measures form friction and perceived value of starting.

2. **Persistence success rate**  
   - **Definition:** `201` responses from `POST /api/reports` ÷ attempts (client-side retries deduped if possible).  
   - **Why:** Separates “liked results” from **technical/config failure** (Supabase, RLS, network).

3. **Qualified lead rate (from persisted reports)**  
   - **Definition:** `POST /api/leads` **201** ÷ persisted reports in the same cohort window.  
   - **Why:** Measures whether the **artifact + copy** compels a low-friction opt-in.

---

## Instrumentation priorities (practical order)

| Priority | Event / metric | Implementation note |
| --- | --- | --- |
| P0 | Report persisted (201) | Server log + optional `report_id` hash (no PII). |
| P1 | Audit completed (client) | Single analytics event after navigation to `/results`. |
| P2 | Lead submitted (201) | Server log; never log raw email in plaintext. |
| P3 | Share link copied | Client event on successful clipboard write. |
| P4 | AI summary source | Count `source: ai` vs `fallback` from `/api/summary` responses (aggregate). |

Use **one** product analytics tool or structured logs first—dual tracking doubles failure modes.

---

## Pivot threshold (example policy)

**Review positioning if for 4 consecutive weeks:**

- **Persistence rate** under 8% of audit completions **and**  
- **Lead rate** under 2% of persisted reports **and**  
- Qualitative feedback says “not actionable”

**Interpretation:** Users may not trust self-reported inputs, may not need sharing, or the ICP is wrong—**do not** scale spend before diagnosing which leg failed.

---

## Supporting diagnostics (secondary)

- AI summary **fallback rate** (high fallback ⇒ fix provider reliability or expectations).
- **Error rate** on `/api/leads` and `/api/reports` by error code (RLS vs validation vs 5xx).
- **Time-to-persist** (results paint → first successful 201) for performance SLAs.

---

## Retention (no-login MVP)

Without accounts, use **operational proxies**:

- Repeat **persisted reports** from the same **hashed network fingerprint** or **company email domain** (privacy-sensitive—only with consent).
- **Return visits** to `/report/[id]` (server logs) as weak sharing signal.
