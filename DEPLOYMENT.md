## AuditAI Deployment Notes

### Required environment variables

Set these environment variables in your Vercel project:

- `NEXT_PUBLIC_BASE_URL` — production URL, e.g. `https://auditai.yourdomain.com`
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `OPENAI_API_KEY` — OpenAI key for AI summaries (optional; fallback works without it)
- `ANTHROPIC_API_KEY` — Anthropic key if you switch the summary provider (optional)

### Supabase schema

Run `supabase/schema.sql` in the Supabase SQL editor to create:

- `public.leads`
- `public.audit_reports` (with `is_public` column and RLS policies)

### Recommended Vercel settings

- Build command: `npm run build`
- Install command: `npm ci`
- Output: Next.js (App Router)

