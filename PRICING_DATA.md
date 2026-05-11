PRICING_[DATA.md](http://DATA.md)

Pricing verified: **2026-05-09**

All prices are static assumptions used by the AuditAI rule engine. Pricing can change, so these should be re-checked against official vendor pages before production use.



Cursor

Source: [https://cursor.com/pricing](https://cursor.com/pricing) — verified 2026-05-09

- Pro: $20/user/month

- Business: $40/user/month

- Enterprise: $60/user/month



GitHub Copilot

Source: [https://github.com/features/copilot/plans](https://github.com/features/copilot/plans) — verified 2026-05-09

- Individual / Pro: $10/user/month

- Business: $19/user/month

- Enterprise: $39/user/month



ChatGPT

Source: [https://openai.com/chatgpt/pricing](https://openai.com/chatgpt/pricing) — verified 2026-05-09

- Plus / Pro: $20/user/month

- Team: $30/user/month

- Enterprise: $60/user/month assumption for audit modeling



Claude

Source: [https://www.anthropic.com/pricing](https://www.anthropic.com/pricing) — verified 2026-05-09

- Pro: $20/user/month

- Team: $30/user/month

- Enterprise: $60/user/month assumption for audit modeling



Gemini

Source: [https://one.google.com/about/plans](https://one.google.com/about/plans) — verified 2026-05-09

- Pro: $20/user/month assumption for audit modeling

- Business: $30/user/month assumption for audit modeling

- Enterprise: $60/user/month assumption for audit modeling



 OpenAI API Direct

Source: [https://openai.com/api/pricing](https://openai.com/api/pricing) — verified 2026-05-09

- API direct: pay-as-you-go

- AuditAI models fixed plan price as $0 and evaluates optimization based on entered monthly API spend.



 Anthropic API Direct

Source: [https://www.anthropic.com/pricing](https://www.anthropic.com/pricing) — verified 2026-05-09

- API direct: pay-as-you-go

- AuditAI models fixed plan price as $0 and evaluates optimization based on entered monthly API spend.



Windsurf

Source: [https://windsurf.com/pricing](https://windsurf.com/pricing) — verified 2026-05-09

- Listed as supported assignment tool reference.

- Not used for deterministic numeric savings unless added to `lib/audit/pricing.ts`.



v0

Source: [https://v0.dev/pricing](https://v0.dev/pricing) — verified 2026-05-09

- Listed as supported assignment tool reference.

- Not used for deterministic numeric savings unless added to `lib/audit/pricing.ts`.



Notes

- User-entered monthly spend is treated as the current spend source of truth.

- Savings are capped so recommendations never produce negative or impossible savings.

- Enterprise prices may vary in real contracts, so AuditAI uses conservative assumptions for MVP modeling.