# User Interviews (Synthesis)

These are realistic, hypothetical early-user interview notes synthesized to reflect what AuditAI is currently built to support: deterministic recommendations, numeric savings, shareable public report links, and an optional AI executive summary.

---

## Interview 1 — Founder aligning finance and engineering

**Role/Company:** 10–20 person startup, founder-led tooling decisions  
**Pain points:**
- “We pay for Cursor, Copilot, and at least one general LLM, but nobody has a crisp breakdown.”
- “I need something I can forward to finance without explaining assumptions for an hour.”

**Quote:**  
“I’m not looking for a clever answer. I’m looking for a deterministic memo I can send internally and defend.”

**Insights:**
- Users want a “single artifact” that’s easy to share, not a dashboard they must interpret.
- Confidence increases when the numeric savings logic is deterministic and not dependent on model output quality.

**Surprising finding:**
- The most valued part wasn’t the executive narrative—it was the prioritized list of actions with numeric savings totals.

**Resulting product decisions (aligned to current implementation):**
- Deterministic audit engine as the core.
- Results page designed around per-tool recommendations and savings totals.
- Shareable report URL (`/report/[id]`) so users can align internally quickly.

---

## Interview 2 — Engineering manager cleaning up overlapping subscriptions

**Role/Company:** Eng manager at a small team with multiple assistants for different workflows  
**Pain points:**
- “We subscribed to multiple assistants because different people had preferences.”
- “We don’t know which tool overlap is actually costing us.”
- “Downgrading is scary; we need a reason and numeric estimate.”

**Quote:**  
“If I can’t point to a rule and a savings number, it turns into a debate instead of a decision.”

**Insights:**
- Redundancy detection is compelling when it chooses a concrete action (remove/replace one tool) deterministically.
- Tie-breaking matters: users quickly notice when “the engine picks different answers” for identical inputs.

**Surprising finding:**
- Users preferred a conservative, honest “NO_CHANGE” output when savings weren’t clearly present.

**Resulting product decisions (aligned to current implementation):**
- Deterministic de-dupe and precedence in `lib/audit/engine.ts`.
- “No change recommended” behavior for optimized stacks.
- Execution summary is best-effort; deterministic fallback ensures the UX never becomes empty.

---

## Interview 3 — API-heavy team looking for usage-spend leverage

**Role/Company:** Data/engineering lead at a team with meaningful API usage  
**Pain points:**
- “Our spend spikes aren’t seat-related; it’s usage and prompt behavior.”
- “We need suggestions that translate into real engineering work: caching, routing, and model tier changes.”

**Quote:**  
“Seat optimization is a neat story, but our biggest wins are usually in prompt and routing decisions.”

**Insights:**
- Users want recommendations that map to engineering levers, not generic advice.
- AI narrative is helpful for communication, but the actionable part is still deterministic: thresholds and estimated savings.

**Surprising finding:**
- Even when AI summary generation might fail, users still value the deterministic recommendations enough to proceed.

**Resulting product decisions (aligned to current implementation):**
- Deterministic rules for API spend detection and credit opportunity thresholds.
- AI summary is isolated and guarded with `fallbackSummary()` and output validation.
- Optional lead capture supports follow-up after users generate a shareable report.

