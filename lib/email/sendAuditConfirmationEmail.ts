export type SendAuditConfirmationEmailInput = {
  toEmail: string;
  reportId?: string;
};

export type SendAuditConfirmationEmailResult = {
  ok: boolean;
  provider: "placeholder";
};

/**
 * Placeholder email abstraction for future provider integrations.
 *
 * Supported future providers:
 * - Resend
 * - Postmark
 * - SES
 */
export async function sendAuditConfirmationEmail(
  _input: SendAuditConfirmationEmailInput
): Promise<SendAuditConfirmationEmailResult> {
  void _input;
  return { ok: true, provider: "placeholder" };
}

