Day 1 — 2026-05-07

**Hours worked:** 5

**What I did:**  

I started the AuditAI project setup using Next.js, TypeScript, and Tailwind CSS. I understood the assignment requirements and planned the app flow: landing page, audit form, results page, lead capture, shareable report, and documentation. I also created the first structure for the project and started with the basic UI direction.

**What I learned:**  

I learned that this assignment is not just about coding. It checks product thinking, engineering discipline, documentation, and whether the app works end-to-end.

**Blockers / what I'm stuck on:**  

The main blocker was understanding the full scope because the assignment has both engineering and entrepreneurial requirements.

**Plan for tomorrow:**  

Build the audit input form and start defining the deterministic audit engine.



Day 2 — 2026-05-08

**Hours worked:** 6

**What I did:**  

I built the audit form with fields for team size, primary use case, AI tools, plan type, monthly spend, and number of seats. I added add/remove tool rows and form persistence across reloads. I also started implementing the audit engine structure.

**What I learned:**  

I learned that the input form must be simple and clear because users need to reach the results quickly. If the form is confusing, users may not complete the audit.

**Blockers / what I'm stuck on:**  

I forgot to check the git distinct-days requirement earlier using `git log --pretty=format:"%ad" --date=short | sort -u | wc -l`. Because of that, I decided not to rush-submit immediately and planned to continue improving the project properly before submission.

**Plan for tomorrow:**  

Finish deterministic audit rules and add automated tests for the audit engine.



Day 3 — 2026-05-09

**Hours worked:** 6

**What I did:**  

I implemented the deterministic audit engine. I added rules for overkill plans, redundant AI tools, high API spend, credit opportunity, and no-change cases. I also added recommendation types, confidence, severity, impact text, and non-stacking savings logic so the same tool does not produce unrealistic duplicate savings.

**What I learned:**  

I learned that savings logic must be explainable and conservative. It is better to show no savings than to manufacture fake recommendations.

**Blockers / what I'm stuck on:**  

Some test expectations needed adjustment because more than one rule could affect totals. I fixed this by keeping deterministic precedence and validating the final selected recommendations.

**Plan for tomorrow:**  

Build the results page and make the audit output easy to understand visually.



Day 4 — 2026-05-10

**Hours worked:** 6

**What I did:**  

I built the results page with total monthly savings, annual savings, recommendation cards, AI summary card, savings breakdown, benchmark mode, and savings-by-tool chart. I also added the public report page and report persistence using Supabase.

**What I learned:**  

I learned that the results page is the most important screen because it is the part users will screenshot and share. Clear visual hierarchy matters more than showing too much text.

**Blockers / what I'm stuck on:**  

I had to prevent duplicate report saves when the results page refreshed or re-rendered.

**Plan for tomorrow:**  

Add lead capture, transactional email, Open Graph metadata, and production-ready sharing behavior.



Day 5 — 2026-05-11

**Hours worked:** 7

**What I did:**  

I added Supabase storage for reports and leads. I implemented lead capture after the audit result, Resend transactional email, honeypot and cooldown abuse protection, shareable public report URLs, Open Graph metadata, and the high-savings Credex consultation CTA. I also tested the live email flow.

**What I learned:**  

I learned that backend setup is not only about writing API routes. Environment variables, Supabase RLS, service-role keys, and deployment configuration must be handled carefully.

**Blockers / what I'm stuck on:**  

Lead capture worked locally but initially failed in production because of Supabase RLS. I fixed it by safely configuring the service-role key in Vercel.

**Plan for tomorrow:**  

Complete final UI polish, update documentation, add screenshots, verify deployment, and submit the project.



Day 6 — 2026-05-12

**Hours worked:** 2

**What I did:**  

I completed final UI polish across the landing page, audit form, results page, public report page, and embed page. I added PDF export, benchmark mode, an embeddable widget, and a savings-by-tool chart. I ran Lighthouse and verified the app met the required scores. I also updated documentation, tested the deployed app, checked email delivery, and prepared the final submission.

**What I learned:**  

I learned that final polish is mostly about removing friction: clearer copy, cleaner spacing, better report layout, and making sure every important user flow works after deployment.

**Blockers / what I'm stuck on:**  

No major blocker at this stage. The remaining work was mainly final verification and making sure all assignment requirements were satisfied.

**Plan for tomorrow:**  

Submission day — no further development planned.