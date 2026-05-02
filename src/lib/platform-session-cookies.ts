import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Non-httpOnly mirror of `bni_platform_account_id` (same digits). Some browsers / multipart Server Action
 * POSTs omit the httpOnly session cookie on the wire; this cookie is readable by JS (XSS trade-off) but
 * the server still loads the account from DB — treat like a session handle, not a secret.
 */
export const PLATFORM_ACCOUNT_REF_COOKIE = "bni_platform_account_ref";

const WEEK = 60 * 60 * 24 * 7;
const secureCookie = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

const rawDomain = process.env.PLATFORM_SESSION_COOKIE_DOMAIN?.trim();
/**
 * Optional parent domain host **without** leading dot (e.g. `busy.mn`). Must NOT be a full URL.
 * Set-Cookie uses `Domain=.{host}` so apex and subdomains share the cookie.
 */
export const platformSessionCookieDomain =
  rawDomain && !rawDomain.includes("://")
    ? (rawDomain.startsWith(".") ? rawDomain.slice(1) : rawDomain)
    : undefined;

function domainOpts(): { domain?: string } {
  if (!platformSessionCookieDomain) return {};
  return { domain: `.${platformSessionCookieDomain}`.replace(/^\.+/, ".") };
}

const sessionOpts = {
  path: "/",
  maxAge: WEEK,
  sameSite: "lax" as const,
  secure: secureCookie,
  ...domainOpts(),
};

/** Shared attributes for Google OAuth start/callback cookies (state, next). */
export const googleOAuthCookieBase = {
  path: "/" as const,
  sameSite: "lax" as const,
  secure: secureCookie,
  ...domainOpts(),
} as const;

/** Server actions: mutate Next cookie store (not during RSC render). */
export async function setPlatformSessionCookies(accountId: bigint, display: string): Promise<void> {
  const jar = await cookies();
  const idStr = accountId.toString();
  jar.set("bni_platform_account_id", idStr, { ...sessionOpts, httpOnly: true });
  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, { ...sessionOpts, httpOnly: false });
  jar.set("bni_platform_nav_display", display, { ...sessionOpts, httpOnly: false });
}

/** Route handlers: attach to redirect response. */
export function attachPlatformSessionToResponse(res: NextResponse, accountId: bigint, display: string): void {
  const idStr = accountId.toString();
  res.cookies.set("bni_platform_account_id", idStr, { ...sessionOpts, httpOnly: true });
  res.cookies.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, { ...sessionOpts, httpOnly: false });
  res.cookies.set("bni_platform_nav_display", display, { ...sessionOpts, httpOnly: false });
}

const clearCookieOpts = {
  path: "/",
  maxAge: 0,
  sameSite: "lax" as const,
  secure: secureCookie,
  ...domainOpts(),
};

/** Clear session cookies (route handlers). */
export function attachClearPlatformSessionToResponse(res: NextResponse): void {
  res.cookies.set("bni_platform_account_id", "", { ...clearCookieOpts, httpOnly: true });
  res.cookies.set(PLATFORM_ACCOUNT_REF_COOKIE, "", { ...clearCookieOpts, httpOnly: false });
  res.cookies.set("bni_platform_nav_display", "", { ...clearCookieOpts, httpOnly: false });
}

/**
 * Clears session cookies from a Server Action only (`cookies().set` is not allowed during RSC render).
 * For “visit link to log out”, use `GET /auth/logout` or `attachClearPlatformSessionToResponse`.
 */
export async function clearPlatformSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.set("bni_platform_account_id", "", { ...clearCookieOpts, httpOnly: true });
  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, "", { ...clearCookieOpts, httpOnly: false });
  jar.set("bni_platform_nav_display", "", { ...clearCookieOpts, httpOnly: false });
}
