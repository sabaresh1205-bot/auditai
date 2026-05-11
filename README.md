# AuditAI

AuditAI is a no-login AI spend audit tool for startup teams, founders, and engineering leads. It helps users enter their AI tools, plans, seats, and monthly spend, then generates deterministic recommendations for reducing overspending. The app also creates shareable reports with AI summaries, lead capture, email confirmation, PDF export, and benchmark insights. 

Live URL : [https://auditai-credex.vercel.app/](https://auditai-credex.vercel.app/)

---

## Screenshots

Landing Page  

1. (screenshots/landing.png)

Audit Form  
2. (screenshots/audit-form.png)  

Results Dashboard  
3. (screenshots/results.png)  

Public Report  
4. (screenshots/public-report.png)  

Embeddable Widget  
5. (screenshots/embed-widget.png)

---

## Features

- No-login AI spend audit flow
- Spend input form for tools, plans, seats, monthly spend, team size, and use case
- Deterministic audit engine with monthly and annual savings
- Per-tool recommendations with clear one-sentence reasons
- AI-generated executive summary with fallback
- Supabase report storage and lead capture
- Resend transactional confirmation email
- Shareable public report URLs with Open Graph metadata
- Credex consultation CTA for high-savings audits
- Honest low-savings state with future optimization signup
- PDF export
- Benchmark mode
- Embeddable widget bonus

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Resend
- OpenAI / Anthropic-ready AI summary layer
- Vitest
- GitHub Actions
- Vercel

---

## Quick Start

### Install

```
npm install
```

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
AUDITAI_FROM_EMAIL=
NEXT_PUBLIC_BASE_URL=
OPENAI_API_KEY=
```

### Run Locally

```
npm run dev
```

Open:

```
http://localhost:3000
```

### Run Tests

```
npm test
```

### Build

```
npm run build
```

### Deploy

Deploy on Vercel.

Required production environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
AUDITAI_FROM_EMAIL
NEXT_PUBLIC_BASE_URL
OPENAI_API_KEY
```

Before testing live report storage and lead capture, run:

```
supabase/schema.sql
```

inside the Supabase SQL Editor.

---

## Decisions

### 1. Deterministic audit engine instead of AI math

Savings calculations are rule-based so the same input always produces the same result. This makes the audit easier to test, explain, and trust.

### 2. AI only for summary

The LLM only writes the executive summary. It does not calculate savings, choose tools, or create pricing recommendations.

### 3. Email capture after value

Users see their audit result before submitting email. This follows the product requirement and improves trust.

### 4. Supabase for backend storage

Supabase was chosen because it is fast to set up, supports Postgres, and works well for storing reports and leads.

### 5. Lightweight abuse protection

The lead form uses honeypot and cooldown protection instead of heavy CAPTCHA. This keeps the user flow simple while reducing spam.

---

## Bonus Features

### PDF Export

Audit reports can be exported using the browser print flow. Interactive UI like buttons, lead forms, and share controls are excluded from print.

### Benchmark Mode

AuditAI compares AI spend per developer against deterministic internal reference ranges. These are static benchmark ranges, not live market data.

### Embeddable Widget

A lightweight iframe widget is available at:

```
/embed
```

Usage instructions are in:

```
EMBED.md
```

---

