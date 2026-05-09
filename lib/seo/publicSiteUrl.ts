/**
 * Absolute site origin for canonical / Open Graph URLs on the server.
 * Prefer `NEXT_PUBLIC_BASE_URL` (e.g. https://example.com); falls back to Vercel’s URL in production previews.
 */
export function getPublicSiteOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      return null;
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (!vercel) return null;
  const host = vercel.replace(/^https?:\/\//, "");
  return `https://${host}`;
}

export function getPublicReportPageUrl(reportId: string): string | null {
  const origin = getPublicSiteOrigin();
  if (!origin) return null;
  return `${origin.replace(/\/$/, "")}/report/${encodeURIComponent(reportId)}`;
}
