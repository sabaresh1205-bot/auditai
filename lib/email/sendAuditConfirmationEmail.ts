import { getResendClient } from "@/lib/email/resendServer";

const DEFAULT_FROM = "onboarding@resend.dev";
const SUBJECT = "Your AuditAI Report is Ready";

export type SendAuditConfirmationEmailInput = {
  toEmail: string;
  reportId?: string;
};

export type SendAuditConfirmationEmailResult =
  | { ok: true; provider: "resend" }
  | { ok: false; provider: "skipped" | "resend"; reason: string };

function resolveFromEmail(): string {
  const from = process.env.AUDITAI_FROM_EMAIL?.trim();
  if (from && from.length > 0) return from;
  return DEFAULT_FROM;
}

function buildReportUrl(reportId: string | undefined): string | null {
  if (reportId === undefined || reportId === null) return null;
  const id = String(reportId).trim();
  if (!id) return null;

  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const vercel = process.env.VERCEL_URL?.trim();
  const baseRaw =
    (fromEnv && fromEnv.replace(/\/$/, "")) ||
    (vercel ? `https://${vercel.replace(/^https?:\/\//, "")}` : "");
  if (!baseRaw) return null;

  return `${baseRaw}/report/${encodeURIComponent(id)}`;
}

function buildPlainTextBody(reportUrl: string | null): string {
  const lines: string[] = [
    "Thank you for using AuditAI.",
    "",
    "Your audit has been generated. AuditAI evaluated your inputs and flagged potential optimization opportunities in your AI tool spend.",
    "",
    "Teams with higher estimated savings may receive a short follow-up from us with clarification or practical next steps. You are never obligated to respond.",
    "",
  ];

  if (reportUrl) {
    lines.push("View your shareable report:");
    lines.push(reportUrl);
    lines.push("");
  }

  lines.push("— AuditAI");
  return lines.join("\n");
}

/**
 * Sends a transactional confirmation after a lead is saved.
 * Never throws; failures return `{ ok: false }` and should be logged by the caller.
 */
export async function sendAuditConfirmationEmail(
  input: SendAuditConfirmationEmailInput
): Promise<SendAuditConfirmationEmailResult> {
  try {
    const rawTo =
      input && typeof input.toEmail === "string" ? input.toEmail.trim().toLowerCase() : "";
    if (!rawTo || !rawTo.includes("@")) {
      return { ok: false, provider: "skipped", reason: "invalid_recipient" };
    }

    const resend = getResendClient();
    if (!resend) {
      console.warn("[auditai] sendAuditConfirmationEmail: RESEND_API_KEY missing; email skipped");
      return { ok: false, provider: "skipped", reason: "missing_api_key" };
    }

    const reportUrl = buildReportUrl(input.reportId);
    const { data, error } = await resend.emails.send({
      from: resolveFromEmail(),
      to: rawTo,
      subject: SUBJECT,
      text: buildPlainTextBody(reportUrl),
    });

    if (error) {
      console.error("[auditai] Resend send failed:", error);
      return { ok: false, provider: "resend", reason: "provider_error" };
    }

    if (!data?.id) {
      console.error("[auditai] Resend send returned no message id");
      return { ok: false, provider: "resend", reason: "no_message_id" };
    }

    return { ok: true, provider: "resend" };
  } catch (e) {
    console.error("[auditai] sendAuditConfirmationEmail failed:", e);
    return { ok: false, provider: "resend", reason: "unexpected_error" };
  }
}
