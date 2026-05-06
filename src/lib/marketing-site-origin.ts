/**
 * Absolute site origin for Open Graph, Facebook share, trip QR, and canonical URLs.
 * When `NEXT_PUBLIC_APP_URL` is unset (e.g. prod without touching `.env`), defaults to live marketing host.
 */
const DEFAULT_MARKETING_ORIGIN = "https://busy.mn";

export function marketingSiteOrigin(): string {
  const fallback = DEFAULT_MARKETING_ORIGIN.replace(/\/$/, "");
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (!env) return fallback;
  const lower = env.toLowerCase();
  // Prevent OG/canonical URLs pointing to localhost in production shares.
  if (lower.includes("localhost") || lower.includes("127.0.0.1") || lower.includes("0.0.0.0")) {
    return fallback;
  }
  if (!/^https?:\/\//i.test(env)) return fallback;
  return env;
}
