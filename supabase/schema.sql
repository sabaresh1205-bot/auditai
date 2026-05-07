-- AuditAI Supabase schema
-- Run this in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_name text null,
  role text null,
  team_size integer null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  report_data jsonb not null,
  input_data jsonb not null,
  is_public boolean not null default true,
  total_monthly_savings numeric(12,2) not null default 0,
  total_annual_savings numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.audit_reports
  add column if not exists is_public boolean not null default true;

create index if not exists idx_leads_email on public.leads (email);
create index if not exists idx_audit_reports_created_at on public.audit_reports (created_at desc);
create index if not exists idx_audit_reports_public on public.audit_reports (is_public, created_at desc);

alter table public.leads enable row level security;
alter table public.audit_reports enable row level security;

-- This project currently uses anon key via API routes and no auth/login.
-- Keep insert/select open to anon for MVP usage.
drop policy if exists "anon_insert_leads" on public.leads;
create policy "anon_insert_leads"
  on public.leads
  for insert
  to anon
  with check (true);

drop policy if exists "authenticated_insert_leads" on public.leads;
create policy "authenticated_insert_leads"
  on public.leads
  for insert
  to authenticated
  with check (true);

drop policy if exists "anon_insert_audit_reports" on public.audit_reports;
create policy "anon_insert_audit_reports"
  on public.audit_reports
  for insert
  to anon
  with check (true);

drop policy if exists "anon_select_audit_reports" on public.audit_reports;
create policy "anon_select_audit_reports"
  on public.audit_reports
  for select
  to anon
  using (is_public = true);

