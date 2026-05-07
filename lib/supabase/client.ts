import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AuditReportInsert,
  LeadInsert,
  PublicAuditReportRow,
} from "@/lib/supabase/types";

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }
  return { url, anonKey };
}

export function createSupabaseServerClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function tryCreateSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function insertAuditReport(
  client: SupabaseClient,
  payload: AuditReportInsert
): Promise<PublicAuditReportRow> {
  const { data, error } = await client
    .from("audit_reports")
    .insert({ ...payload, is_public: payload.is_public ?? true })
    .select(
      "id, report_data, input_data, is_public, total_monthly_savings, total_annual_savings, created_at"
    )
    .single();
  if (error) throw new Error(error.message);
  return data as PublicAuditReportRow;
}

export async function getPublicAuditReportById(
  client: SupabaseClient,
  id: string
): Promise<PublicAuditReportRow | null> {
  const { data, error } = await client
    .from("audit_reports")
    .select(
      "id, report_data, input_data, is_public, total_monthly_savings, total_annual_savings, created_at"
    )
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PublicAuditReportRow | null) ?? null;
}

export async function insertLead(
  client: SupabaseClient,
  payload: LeadInsert
): Promise<{ id: string; created_at: string }> {
  const { data, error } = await client
    .from("leads")
    .insert(payload)
    .select("id, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; created_at: string };
}

// Future-ready helper for unlisting reports.
export async function setReportVisibility(
  client: SupabaseClient,
  id: string,
  isPublic: boolean
): Promise<void> {
  const { error } = await client.from("audit_reports").update({ is_public: isPublic }).eq("id", id);
  if (error) throw new Error(error.message);
}

// Future-ready helper for deleting reports.
export async function deleteReport(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("audit_reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

