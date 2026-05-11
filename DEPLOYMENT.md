## AuditAI Deployment Notes

### Required environment variables

Set these environment variables in your Vercel project:

`NEXT_PUBLIC_BASE_URL` — production URL, e.g. 

```shellscript
https://auditai-credex.vercel.app/
```

`NEXT_PUBLIC_SUPABASE_URL` — 

```shellscript
https://tniwecfisedwtdbznwlu.supabase.co
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` — 

```shellscript
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuaXdlY2Zpc2Vkd3RkYnpud2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjgyMzIsImV4cCI6MjA5MzcwNDIzMn0.32f9EkCqmlXssmF2k1JYz-fysUrtVGPGL07qeGJEaIs
```

`OPENAI_API_KEY` — With our key

Supabase schema

Run `supabase/schema.sql` in the Supabase SQL editor to create:

- `public.leads`
- `public.audit_reports` (with `is_public` column and RLS policies)

### Recommended Vercel settings

- Build command: `npm run build`
- Install command: `npm ci`
- Output: Next.js (App Router)

