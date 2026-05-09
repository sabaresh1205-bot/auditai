# Economics

Spreadsheet-style model for a **B2B lead-generation** motion: free audit → shareable report → email lead → human consultation / paid services. Numbers are **assumptions** for planning—replace with your funnel data after 30 days of traffic.

---

## Unit definitions

| Symbol | Meaning |
| --- | --- |
| **V** | Monthly unique visitors (landing + `/audit`) |
| **A** | Audits completed (reach `/results` with deterministic output) |
| **P** | Persisted public reports (`POST /api/reports` **201**) |
| **L** | Leads captured (`POST /api/leads` **201**) |
| **C** | Paid consultations closed (human sales) |

---

## Conversion funnel (illustrative)

Plausible **early** funnel (tune with real analytics):

| Step | Rate | Formula |
| --- | ---: | --- |
| Visit → Audit start | 35% | A = 0.35 × V |
| Audit → Persist report | 18% | P = 0.18 × A |
| Persist → Lead | 10% | L = 0.10 × P |
| Lead → Consult booked | 8% | Consults = 0.08 × L |
| Consult → Close (services) | 25% | C = 0.25 × Consults |

**Example:** V = 10,000 / month  
- A = 3,500  
- P = 630  
- L = 63  
- Consults ≈ 5  
- C ≈ 1.25 **new paying engagements / month** at this stage

---

## CAC assumptions by channel (rough)

| Channel | Blended CAC to **persisted report** | Notes |
| --- | ---: | --- |
| Organic community / founder content | **$15–$40** | Time-heavy; cash-light. |
| LinkedIn organic | **$20–$50** | If boosted, add spend / P. |
| Cold outbound (tools + labor) | **$80–$200** | Includes list + hourly cost amortized. |
| Paid search (later) | **$120–$350** | Competitive keywords; not MVP-first. |

**CAC to lead** ≈ CAC_report ÷ (lead rate from report). At 10% lead rate, multiply by ~10.

---

## Estimated lead value (consulting path)

Assume:

- **Consultation fee:** $800 (90 min deep dive)
- **Win rate to implementation project:** 25%
- **Project margin:** $6,000 contribution margin per win (illustrative 2-week engagement)

**Expected value per booked consult:**  
0.75 × $800 + 0.25 × ($800 + $6,000) = $600 + $1,700 = **$2,300** (illustrative)

**Expected value per lead** (8% consult booking):  
0.08 × $2,300 ≈ **$184 / lead** (order-of-magnitude; sensitivity analysis belongs in a sheet)

---

## Monthly COGS (MVP scale)

| Line item | Range |
| --- | ---: |
| Hosting (Vercel/similar) | $20–$80 |
| Supabase | $25–$150 |
| Resend email | $0–$40 |
| LLM summaries (bounded) | $30–$400 |
| **Total** | **$75–$670** |

LLM cost scales with **summary calls**; client caching reduces repeat calls.

---

## Path to **$1M ARR** (illustrative)

**Interpretation:** ARR here means **revenue from AuditAI-adjacent services** (consulting + implementation), not ARR from the free web app alone.

**Scenario math:**

- Target **$1,000,000 ARR** ≈ **$83,333 MRR**
- If **average contract** = $12,000/year ACV (SMB advisory + setup), need **~83 customers** active or **~7 new / month** with churn modeled separately.
- If **average project** = $8,000 one-time with 40% repeat annually, blend into a cohort model—in a spreadsheet, model **leads → consults → wins** explicitly.

**Bridge from product funnel:**

- Require **L** leads/month such that:  
  `L × consult_rate × close_rate × ACV/12 ≈ MRR_target`  
- Example: consult_rate 8%, close 25%, ACV $12k → each lead yields ~`0.08 × 0.25 × $1k` = **$20 MRR-equivalent** at steady state (illustrative).  
  Then **L ≈ 4,200/month** for $83k MRR from that channel alone—shows why **higher ACV or partner distribution** must enter before pure PLG carries $1M.

**Realistic combo:** raise ACV (enterprise advisory), add **partner channel** (fractional CFO firms), and keep AuditAI as **top-of-funnel proof**.

---

## What to measure first

1. **P / A** — Is the report worth saving?
2. **L / P** — Is the artifact worth leaving an email?
3. **Summary `source: ai` vs `fallback` rate** — LLM budget control.
4. **Cost per P** by channel — replaces vanity traffic metrics.

This document is **financially reasoned but assumption-driven**—export the formulas to Google Sheets and replace rates monthly.
