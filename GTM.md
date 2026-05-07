# Go-to-Market (GTM)

This GTM plan is designed for the current MVP:
- rule-based deterministic audit engine
- optional AI executive summary layer
- shareable public report links
- lead capture via email on the results page
- no login required

---

## ICP (Ideal Customer Profile)

Primary ICP:
- Early-stage startups (seed to Series A)
- 5–50 people, where tooling decisions are handled by founders, engineering managers, or finance-adjacent operators
- Teams that use multiple AI tools (coding assistants + general LLMs + occasional API usage)

Common signals:
- multiple overlapping subscriptions (e.g., Cursor + Copilot + ChatGPT/Claude/Gemini)
- vague or inconsistent spend tracking for AI usage
- “we feel we overpay” rather than a precise billing report

Secondary ICP:
- Small consultancies or product studios that manage AI subscriptions across client projects.

---

## Positioning

AuditAI positions as:
- **Deterministic** “spend audit” for AI tooling (no login, quick results)
- **Actionable** recommendations with numeric savings estimates
- **Shareable** reports so teams can align internally (founder ↔ engineering ↔ finance)

Key differentiator versus generic “LLM cost calculators”:
- AuditAI doesn’t just estimate; it uses explicit rules to propose concrete actions (downgrades, consolidation, seat optimization, and a credit/discount opportunity when total spend is high).

---

## Acquisition Strategy

### 1) Viral “internal memo” via shareable links
After generating an audit, users can copy a share link (`/report/[id]`).
Sharing those links inside a company is a low-friction growth channel:
- a founder can send it to finance
- an engineer can send it to leadership

### 2) Content that targets “AI spend uncertainty”
Create lightweight guides and examples that speak to real questions:
- “How to spot redundant AI subscriptions”
- “When should you downgrade Cursor/Copilot?”
- “What does ‘cost per seat’ mean for AI tools?”

Each piece should include a “Run a free audit” link to `/audit`.

### 3) Community distribution
Post practical audit outcomes (sanitized) to:
- startup engineering communities
- founder/operator communities

Avoid “promotional screenshots”; focus on the concrete recommendations produced.

### 4) Partnerships (later)
Potential integrations with billing dashboards or startup ops tooling can add users, but this is not required for the MVP.

---

## First 100 Users Plan

Assume 100 users comes from a mix of direct outreach and organic sharing.

### Week 1 (seed users)
- Identify 30–50 startups where tooling spend is likely complex.
- Target outreach:
  - engineering managers
  - founders responsible for tooling budget
  - finance operators at small companies
- Offer “try the audit and share feedback” rather than requesting immediate sign-ups (there is no signup in MVP).

### Week 2–3 (content + sharing loop)
- Publish 3–5 pieces of content with deterministic examples.
- Each example should lead to a pre-filled mental model:
  - “If your team is small, overkill plans often appear.”
  - “If you pay for multiple general assistants, consolidation is usually the largest savings.”

### Week 4 (iterate based on what users share)
- Track which report sections users reference when sharing internally:
  - top recommendation list
  - savings breakdown
  - portfolio insights
- Use that to shape subsequent content topics.

---

## Why Startups Would Use AuditAI

Startups use AuditAI because it turns a hard-to-trust question (“Are we overpaying for AI tools?”) into:
- a deterministic list of actions
- a prioritized narrative
- a shareable report they can take to decision-makers

AuditAI’s “deterministic first” approach helps avoid the most common objection to LLM-only recommendations: trust in the savings math.

---

## Organic Growth Opportunities

1. **Internal forwarding as a distribution mechanism**
   - Public report pages are naturally shareable.

2. **Deterministic repeatability**
   - Since the core recommendations are rule-based, the same inputs should produce consistent outputs—users are more likely to trust and re-share.

3. **Lead capture as an “update channel”**
   - Users can opt in to receive report updates after sharing their results.
   - This supports organic retention rather than cold marketing.

