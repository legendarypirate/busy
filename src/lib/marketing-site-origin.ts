/**
 * Absolute site origin for Open Graph, Facebook share, trip QR, and canonical URLs.
 * When `NEXT_PUBLIC_APP_URL` is unset (e.g. prod without touching `.env`), defaults to live marketing host.
 */
const DEFAULT_MARKETING_ORIGIN = "https://busy.mn";

export function marketingSiteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return env || DEFAULT_MARKETING_ORIGIN.replace(/\/$/, "");
}
