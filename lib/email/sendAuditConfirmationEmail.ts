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

function buildPlainTextBody(): string {
  return [
    "Thanks for using AuditAI.",
    "",
    "Your AI spend audit has been generated successfully.",
    "",
    "We identified potential optimization opportunities based on your current tooling stack. If your projected savings are significant, Credex may reach out with additional recommendations.",
    "",
    "Thanks,",
    "AuditAI",
  ].join("\n");
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

    const { data, error } = await resend.emails.send({
      from: resolveFromEmail(),
      to: rawTo,
      subject: SUBJECT,
      text: buildPlainTextBody(),
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
