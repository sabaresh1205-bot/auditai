# Pricing Data (Deterministic Assumptions)

AuditAI uses deterministic, static pricing assumptions to estimate “target spend” when proposing:

- downgrades to a lower plan tier
- cost-per-seat sanity checks
- conservative savings caps (savings never exceed current spend and never go negative)

The goal is consistency and auditability of the numeric recommendations, not perfect real-world billing accuracy.

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

## Pricing Assumptions (USD catalog)

Catalog semantics:

- Seat-based SaaS plan tiers define `monthlyPrice` as a **price per seat**.
- API pay-as-you-go tools (`openai_api`, `anthropic_api`) use a pricing model where `monthlyPrice = 0` and spend optimizations come from usage-based rules (not fixed seat list prices).
- The user’s entered `monthlySpend` is treated as the “current spend source of truth”.

### Cursor

- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 20 }`
- `business`: $40/month per seat, intendedTeamSize `{ min: 10, max: 500 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### GitHub Copilot

- `pro`: $10/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `business`: $19/month per seat, intendedTeamSize `{ min: 2, max: 5000 }`
- `enterprise`: $39/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### ChatGPT

- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `team`: $30/month per seat, intendedTeamSize `{ min: 5, max: 200 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### Claude

- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `team`: $30/month per seat, intendedTeamSize `{ min: 5, max: 200 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### Gemini

- `pro`: $20/month per seat, intendedTeamSize `{ min: 1, max: 10 }`
- `business`: $30/month per seat, intendedTeamSize `{ min: 2, max: 2000 }`
- `enterprise`: $60/month per seat, intendedTeamSize `{ min: 50, max: 100000 }`

### OpenAI API

- `api_payg`: `monthlyPrice = 0`, intendedTeamSize `{ min: 1, max: 100000 }`

### Anthropic API

- `api_payg`: `monthlyPrice = 0`, intendedTeamSize `{ min: 1, max: 100000 }`

---

## Limitations of Static Pricing

1. **List price drift**
  - SaaS vendors change pricing over time. Static catalog values can become outdated.
2. **Discounts and negotiated rates**
  - Enterprise discounts, negotiated contracts, and volume pricing aren’t modeled.
3. **Spend input quality**
  - Numeric recommendations depend on the accuracy of `monthlySpend` entered by the user.
4. **Incomplete catalog coverage**
  - Tools like `perplexity`, `google_ai_studio_api`, and `other` are accepted as inputs, but numeric catalog-based rules skip where pricing data is missing.
5. **API spend model is simplified**
  - API tools do not use fixed seat list pricing (`monthlyPrice = 0`); API recommendations are derived from usage spend thresholds and conservative deterministic savings rates.

