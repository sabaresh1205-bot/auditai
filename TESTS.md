# Tests

This repo’s tests focus on the deterministic parts of the system: the audit rule engine and the numeric savings logic.

The LLM layer (`/api/summary`) and external providers are intentionally not unit-tested here because provider responses are non-deterministic and require external credentials.

---

## Test Structure

### Framework
- **Vitest**
- Node test environment: configured in `vitest.config.ts`

### Where tests live
- `auditai/tests/audit/*.test.ts`

### What coverage includes
`vitest.config.ts` configures coverage to include:
- `lib/audit/**/*.ts`

### Test runner configuration
`auditai/vitest.config.ts`:
- discovers tests with: `include: ["tests/**/*.test.ts"]`
- enables global test APIs (`globals: true`)
- uses `vite-tsconfig-paths` so `@/` imports work in tests

---

## Deterministic Validation Philosophy

The central goal is to ensure the audit engine remains stable and honest:

1. **No invention of savings**
   - When rules don’t detect a concrete opportunity, the engine should return `NO_CHANGE` with `estimatedSavings = 0`, not fabricated savings.

2. **Deterministic tie-breaking**
   - When multiple rules could apply, selection is performed using explicit precedence and stable ordering.
   - Tests assert the deterministic outcome (for example: which tool is removed in overlapping cases).

3. **Numeric assertions over string snapshots**
   - Tests validate:
     - recommendation `type` and `confidence`
     - `estimatedSavings` values
     - totals (`monthlySavings` / `annualSavings`)

4. **Edge-case robustness without crashes**
   - Tests ensure the engine does not throw and still produces valid outputs when inputs are “messy” (e.g., zero spend, empty tool arrays, invalid seat counts).

---

## Major Business-Rule Test Scenarios

### Overkill plan detection
- File: `tests/audit/overkill-plans.test.ts`
- Scenario:
  - team size below plan intended minimum for a seat-based tool
- Assertions:
  - recommendation `type === "DOWNGRADE_PLAN"`
  - savings totals are positive and annual savings match monthly × 12

### Redundant assistant detection
- File: `tests/audit/redundancy.test.ts`
- Scenario:
  - multiple overlapping assistants (ChatGPT + Claude + Gemini)
- Assertions:
  - at least one `REMOVE_TOOL` recommendation appears
  - deterministic removal of the most expensive assistant
  - `monthlySavings` reflects the selected deterministic savings

### High API spend detection
- File: `tests/audit/api-spend.test.ts`
- Scenario:
  - API usage above a spend band threshold
- Assertions:
  - recommendation `type === "OPTIMIZE_USAGE"`
  - deterministic savings estimate computed from the spend band

### Credit opportunity
- File: `tests/audit/credit-opportunity.test.ts`
- Scenario:
  - total spend exceeds the $500 threshold
- Assertions:
  - `CREDIT_DISCOUNT` appears with toolId `"other"`
  - totals contribute deterministically

### “Already optimized” behavior
- File: `tests/audit/optimized-stack.test.ts`
- Scenario:
  - a small realistic setup where no rules should trigger savings
- Assertions:
  - `monthlySavings === 0` and `annualSavings === 0`
  - recommendation type for the tool is `NO_CHANGE`

---

## Edge-Case Coverage

Edge cases are covered in `tests/audit/edge-cases.test.ts`.

The current suite covers:
- zero spend across tools (no positive savings)
- empty `tools` array (engine should not throw; output has empty recommendations and zero savings)
- invalid seat counts (e.g., `seats = 0`) doesn’t crash; engine clamps/handles deterministically
- duplicate tool rows:
  - ensures per-tool savings do not stack
  - validates deterministic choice when the tie occurs
- huge enterprise spend:
  - ensures severity is high where appropriate and savings are positive

---

## CI Integration

CI is defined in `auditai/.github/workflows/ci.yml` and runs:

1. `npm ci`
2. `npm run lint`
3. `npm test` (executes Vitest)
4. `npm run build`

CI ensures lint, unit tests, and a production build succeed.

