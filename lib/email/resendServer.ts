import { Resend } from "resend";

let client: Resend | null | undefined;

/**
 * Returns a Resend instance when `RESEND_API_KEY` is configured; otherwise `null`.
 * Safe to call from server route handlers only.
 */
export function getResendClient(): Resend | null {
  if (client !== undefined) return client;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    client = null;
    return null;
  }
  client = new Resend(key);
  return client;
}
