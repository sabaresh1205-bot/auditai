# Tests

This repo’s tests focus on the **deterministic** audit engine and numeric savings logic.  
The LLM layer (`POST /api/summary`) and external providers are **not** unit-tested here (non-deterministic; requires credentials).

---

## Framework and commands


| Item          | Detail                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Runner**    | [Vitest](https://vitest.dev/)                                                                  |
| **Config**    | `vitest.config.ts` — `include: ["tests/**/*.test.ts"]`, `vite-tsconfig-paths` for `@/` imports |
| **Run tests** | `npm test`                                                                                     |
| **Coverage**  | `npm run coverage` — includes `lib/audit/**/*.ts` per Vitest coverage config                   |


---

## Automated test files (complete list)


| File                                     | What it covers                                                                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/audit/overkill-plans.test.ts`     | **Overkill plan** detection: team size below plan’s intended range → `DOWNGRADE_PLAN` (or equivalent savings); positive totals; annual = monthly × 12 pattern.                                                            |
| `tests/audit/redundancy.test.ts`         | **Redundant assistants** (e.g., ChatGPT + Claude + Gemini): `REMOVE_TOOL`; deterministic choice of which overlapping assistant is removed; savings align with removed spend.                                              |
| `tests/audit/api-spend.test.ts`          | **High API spend** (`openai_api` / `anthropic_api`): `OPTIMIZE_USAGE`-style opportunities from spend bands; deterministic savings from usage rules.                                                                       |
| `tests/audit/credit-opportunity.test.ts` | **Credit / discount** path when total spend crosses catalog threshold: `CREDIT_DISCOUNT` behavior and contribution to totals.                                                                                             |
| `tests/audit/optimized-stack.test.ts`    | **No-change / efficient stack**: near-zero or zero `monthlySavings`, `NO_CHANGE` recommendations where appropriate.                                                                                                       |
| `tests/audit/edge-cases.test.ts`         | **Robustness**: zero spend, empty `tools` array, invalid seats, **duplicate tool rows** (tie-breaking / no double-counting), large enterprise spend + severity.                                                           |
| `tests/audit/savings-totals.test.ts`     | **Savings totals integrity**: `annualSavings` matches rounded `monthlySavings × 12`; sum of positive `estimatedSavings` on emitted recommendations matches `monthlySavings`; zero totals for minimal rightsized scenario. |


---

## CI

`auditai/.github/workflows/ci.yml` runs:

1. `npm ci`
2. `npm run lint`
3. `npm test` (Vitest)
4. `npm run build` (with non-secret placeholder Supabase env vars)

