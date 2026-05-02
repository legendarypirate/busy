function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/**
 * Browsers cap persistent cookie lifetime (Chrome ~400 days). We use this as the practical “no expiry” default.
 * @see https://developer.chrome.com/blog/cookie-max-age-expires/
 */
export const PLATFORM_SESSION_BROWSER_MAX_DAYS = 400;

/**
 * Platform session cookie + signed post-token TTL (days), capped at {@link PLATFORM_SESSION_BROWSER_MAX_DAYS}.
 *
 * - **Unset**, **`0`**, or **`unlimited`** → {@link PLATFORM_SESSION_BROWSER_MAX_DAYS} (effectively limitless in browsers).
 * - Otherwise integer **1…400** via `PLATFORM_SESSION_MAX_DAYS`.
 */
export function platformSessionMaxDays(): number {
  const raw = process.env.PLATFORM_SESSION_MAX_DAYS?.trim();
  if (!raw || raw === "0" || raw.toLowerCase() === "unlimited") {
    return PLATFORM_SESSION_BROWSER_MAX_DAYS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return PLATFORM_SESSION_BROWSER_MAX_DAYS;
  return clampInt(n, 1, PLATFORM_SESSION_BROWSER_MAX_DAYS);
}

export function platformSessionMaxAgeSeconds(): number {
  return platformSessionMaxDays() * 24 * 60 * 60;
}
