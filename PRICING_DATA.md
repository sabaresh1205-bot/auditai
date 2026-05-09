# Pricing Data (Deterministic Assumptions)

AuditAI uses deterministic, static pricing assumptions to estimate “target spend” when proposing:

- downgrades to a lower plan tier
- cost-per-seat sanity checks
- conservative savings caps (savings never exceed current spend and never go negative)

The goal is consistency and auditability of the numeric recommendations, not perfect real-world billing accuracy.

**Pricing can change over time and should be periodically re-verified against vendor pricing pages.**

---

## Supported Tools

### Tools supported in the UI (input options)

`components/audit/AuditForm.tsx` supports these `toolId` values:

- `cursor`
- `github_copilot`
- `claude`
- `chatgpt`
- `gemini`
- `perplexity`
- `openai_api`
- `anthropic_api`
- `google_ai_studio_api`
- `other` (requires a custom tool name)

### Tools supported by the pricing catalog (USD)

`lib/audit/pricing.ts` contains numeric pricing only for this subset:

- `cursor`
- `github_copilot`
- `chatgpt`
- `claude`
- `gemini`
- `openai_api`
- `anthropic_api`

For toolIds not present in the pricing catalog (`perplexity`, `google_ai_studio_api`, `other`), rules that depend on catalog prices will skip target-spend calculations. In those cases, the engine may still produce `NO_CHANGE` or other non-pricing-driven recommendations.

---

## Official vendor pricing references

All URLs below point to **vendor-hosted** pricing or plan information. Catalog rows were checked for alignment with `lib/audit/pricing.ts` on **2026-05-09** (submission week).

| Catalog tool | Official pricing / plans URL | Verified |
| --- | --- | --- |
| Cursor | [cursor.com/pricing](https://cursor.com/pricing) | 2026-05-09 |
| GitHub Copilot | [github.com/features/copilot/plans](https://github.com/features/copilot/plans) | 2026-05-09 |
| ChatGPT (consumer / team) | [openai.com/chatgpt/pricing](https://openai.com/chatgpt/pricing/) | 2026-05-09 |
| Claude (consumer / team) | [anthropic.com/pricing](https://www.anthropic.com/pricing) | 2026-05-09 |
| Gemini (Google AI / workspace plans) | [one.google.com — Google One plans (Gemini)](https://one.google.com/about/google-one-plans/) | 2026-05-09 |
| OpenAI API | [openai.com/api/pricing](https://openai.com/api/pricing/) | 2026-05-09 |
| Anthropic API | [anthropic.com/pricing](https://www.anthropic.com/pricing) (API section) | 2026-05-09 |

### Assignment / roadmap tools (not in `lib/audit/pricing.ts` today)

The Credex specification references **Windsurf** and **v0** as tools to trace. They are **not** modeled in `PRICING_USD` yet—no list prices are asserted here. Use only official pages when extending the catalog.

| Product | Official pricing / plans URL | Verified |
| --- | --- | --- |
| Windsurf | [windsurf.com/pricing](https://windsurf.com/pricing) | 2026-05-09 |
| v0 (Vercel) | [v0.dev/pricing](https://v0.dev/pricing) | 2026-05-09 |

---

## Pricing Assumptions (USD catalog)

Catalog semantics:

- Seat-based SaaS plan tiers define `monthlyPrice` as a **price per seat**.
- API pay-as-you-go tools (`openai_api`, `anthropic_api`) use a pricing model where `monthlyPrice = 0` and spend optimizations come from usage-based rules (not fixed seat list prices).
- The user’s entered `monthlySpend` is treated as the “current spend source of truth”.
- Documented tiers below are **only** those present in `PRICING_USD` in `lib/audit/pricing.ts` (no extra plans are implied here).

### Cursor

- **Source:** [cursor.com/pricing](https://cursor.com/pricing) · **Verified:** 2026-05-09  
- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 20 }`
- `business`: $40/month per seat, intendedTeamSize `{ min: 10, max: 500 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### GitHub Copilot

- **Source:** [github.com/features/copilot/plans](https://github.com/features/copilot/plans) · **Verified:** 2026-05-09  
- `pro`: $10/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `business`: $19/month per seat, intendedTeamSize `{ min: 2, max: 5000 }`
- `enterprise`: $39/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### ChatGPT

- **Source:** [openai.com/chatgpt/pricing](https://openai.com/chatgpt/pricing/) · **Verified:** 2026-05-09  
- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `team`: $30/month per seat, intendedTeamSize `{ min: 5, max: 200 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### Claude

- **Source:** [anthropic.com/pricing](https://www.anthropic.com/pricing) · **Verified:** 2026-05-09  
- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `team`: $30/month per seat, intendedTeamSize `{ min: 5, max: 200 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### Gemini

- **Source:** [one.google.com — Google One plans](https://one.google.com/about/google-one-plans/) (Gemini offering context) · **Verified:** 2026-05-09  
- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `business`: $30/month per seat, intendedTeamSize `{ min: 2, max: 2000 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### OpenAI API

- **Source:** [openai.com/api/pricing](https://openai.com/api/pricing/) · **Verified:** 2026-05-09  
- `api_payg`: `monthlyPrice = 0`, intendedTeamSize `{ min: 1, max: 100000 }`

### Anthropic API

- **Source:** [anthropic.com/pricing](https://www.anthropic.com/pricing) · **Verified:** 2026-05-09  
- `api_payg`: `monthlyPrice = 0`, intendedTeamSize `{ min: 1, max: 100000 }`

---

## Limitations of Static Pricing

1. **List price drift**
   - SaaS vendors change pricing over time. Static catalog values can become outdated; re-check the official URLs above regularly.
2. **Discounts and negotiated rates**
   - Enterprise discounts, negotiated contracts, and volume pricing aren’t modeled.
3. **Spend input quality**
   - Numeric recommendations depend on the accuracy of `monthlySpend` entered by the user.
4. **Incomplete catalog coverage**
   - Tools like `perplexity`, `google_ai_studio_api`, and `other` are accepted as inputs, but numeric catalog-based rules skip where pricing data is missing.
5. **API spend model is simplified**
   - API tools do not use fixed seat list pricing (`monthlyPrice = 0`); API recommendations are derived from usage spend thresholds and conservative deterministic savings rates.
