1. The hardest bug I hit this week, and how I debugged it

The hardest bug was Supabase Row Level Security blocking lead submissions after deployment. Locally, the form worked, but in production the email submit failed. First, I checked whether the frontend was sending the correct payload: email, company name, role, and team size. Then I checked the API route to confirm the request reached `/api/leads`.

My next hypothesis was that the database table existed, but the Supabase role did not have permission to insert. I verified the RLS policies and tested the difference between anon access and server-side service-role access. The fix was to configure the service-role key safely in Vercel so the backend could insert leads without exposing secrets to the client.

I also fixed a related UX issue with form persistence. The audit form originally used localStorage, so old values remained even after reopening the app. I changed it to sessionStorage so reloads still preserve work, but a new browser session starts cleanly. The main lesson was to debug production issues step by step instead of assuming the frontend was wrong.



2. A decision I reversed mid-week, and what made me reverse it

One decision I reversed was using AI for audit recommendations. At first, I thought the LLM could help make savings suggestions more personalized. It seemed useful because the AI could explain tools and maybe suggest alternatives. But after thinking through the assignment, I realized this would make the audit unreliable because the same input could produce different recommendations.

I changed the architecture so the audit engine became fully deterministic. The engine now calculates savings, recommendation types, confidence, severity, and reasons using fixed rules. This made the output easier to test, explain, and defend. It also matched the requirement that the audit logic should be understandable to a finance person.

AI is now used only for the executive summary. It explains the already-computed report in simple language, but it does not calculate money or decide recommendations. If the AI fails, the app uses a fallback summary based on the deterministic report. This decision made the project stronger because the financial logic stays predictable and the AI layer stays optional.



3. What I would build in week 2 if I had it

If I had one more week, I would focus on reliability and measurement instead of adding many new features. First, I would add stronger server-side rate limiting for `/api/leads`, `/api/reports`, and `/api/summary`. The current honeypot and cooldown are useful for MVP abuse protection, but production traffic needs stronger limits.

Second, I would improve logging. I would track report-save failures, lead submission failures, email sending errors, AI summary failures, and fallback summary usage. This would make production issues easier to debug after real users start using the tool.

Third, I would improve pricing maintenance. The current pricing assumptions are documented in `PRICING_DATA.md`, but AI tool pricing changes often, so I would create a regular process to verify official pricing pages and update the deterministic pricing catalog safely.

Finally, I would add integration tests for API routes. The audit engine already has unit tests, but backend route tests for reports, leads, and summaries would make the full system more reliable. Week 2 would be about making the MVP stronger, not adding random extra features.



4. How I used AI tools

I used AI tools like Cursor and ChatGPT as assistants, not as replacements for understanding the code. I used them for scaffolding components, improving UI copy, reviewing documentation structure, generating prompts, and checking whether the project matched the assignment requirements. They helped me move faster, especially when writing repetitive UI components and documentation.

I did not trust AI with the audit math. All savings rules, recommendation types, and totals are handled by deterministic code. After AI-assisted changes, I ran tests and manually reviewed important files to make sure the behavior was correct.

One specific time AI was wrong was when it suggested a simpler storage sync using `useEffect`. That could have caused hydration issues in Next.js because server-rendered output and client-rendered output might not match. I caught this by reviewing the existing storage hook and kept the safer snapshot-based approach instead.

The main lesson was that AI is useful for speed, but final decisions must come from code review, testing, and understanding the requirements. I used AI as a helper, not as the source of truth.



 5. Self-rating

**Discipline — 8/10**  

I worked step by step through the audit engine, UI, backend, email, testing, deployment, and documentation instead of trying to build everything at once.

**Code quality — 8/10**  

The project uses TypeScript, modular files, deterministic rules, validation, and tests. The code is organized, but API integration tests could still be improved.

**Design sense — 7/10**  

The UI is clean, responsive, and polished with a strong results page, benchmark card, savings chart, and PDF export. It could still be improved by a professional designer.

**Problem-solving — 8/10**  

I solved issues around Supabase RLS, Resend email, session storage, deployment variables, and print/PDF layout.

**Entrepreneurial thinking — 8/10**  

The project includes lead capture, shareable reports, Credex consultation CTA, benchmark mode, embeddable widget, pricing documentation, GTM, and economics thinking.

Overall, I would rate the project around **8/10**. The MVP works end-to-end with a real backend, real email sending, a deployed URL, and strong documentation. The biggest improvements left would be production monitoring, deeper API route testing, and more user feedback.