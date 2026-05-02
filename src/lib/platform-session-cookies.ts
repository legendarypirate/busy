import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { platformSessionMaxAgeSeconds } from "@/lib/platform-session-ttl";

/**
 * Non-httpOnly mirror of `bni_platform_account_id` (same digits). Some browsers / multipart Server Action
 * POSTs omit the httpOnly session cookie on the wire; this cookie is readable by JS (XSS trade-off) but
 * the server still loads the account from DB — treat like a session handle, not a secret.
 */
export const PLATFORM_ACCOUNT_REF_COOKIE = "bni_platform_account_ref";

const secureCookie = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

/**
 * Optional parent domain host **without** leading dot (e.g. `busy.mn`). Must NOT be a full URL or port.
 * Set-Cookie uses `Domain=.{host}` so apex and subdomains share the cookie.
 * A mistaken `busy.mn:443` env would otherwise emit an invalid Domain attribute and browsers drop the cookie.
 */
function parsePlatformSessionCookieDomainHost(): string | undefined {
  const raw = process.env.PLATFORM_SESSION_COOKIE_DOMAIN?.trim();
  if (!raw || raw.includes("://")) return undefined;
  const withoutDot = raw.startsWith(".") ? raw.slice(1) : raw;
  const hostOnly = withoutDot.split(":")[0]?.trim();
  if (!hostOnly || hostOnly.includes("/") || hostOnly.includes(" ")) return undefined;
  return hostOnly;
}

export const platformSessionCookieDomain = parsePlatformSessionCookieDomainHost();

function domainOpts(): { domain?: string } {
  if (!platformSessionCookieDomain) return {};
  /** `Domain=.busy.mn` shares session between apex and `www` (must match `PLATFORM_SESSION_COOKIE_DOMAIN`). */
  return { domain: `.${platformSessionCookieDomain}`.replace(/^\.+/, ".") };
}

function sessionCookieOpts(): {
  path: string;
  maxAge: number;
  sameSite: "lax";
  secure: boolean;
  domain?: string;
} {
  return {
    path: "/",
    maxAge: platformSessionMaxAgeSeconds(),
    sameSite: "lax",
    secure: secureCookie,
    ...domainOpts(),
  };
}

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
  const so = sessionCookieOpts();
  jar.set("bni_platform_account_id", idStr, { ...so, httpOnly: true });
  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, { ...so, httpOnly: false });
  jar.set("bni_platform_nav_display", display, { ...so, httpOnly: false });
}

/** Route handlers: attach to redirect response. */
export function attachPlatformSessionToResponse(res: NextResponse, accountId: bigint, display: string): void {
  const idStr = accountId.toString();
  const so = sessionCookieOpts();
  res.cookies.set("bni_platform_account_id", idStr, { ...so, httpOnly: true });
  res.cookies.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, { ...so, httpOnly: false });
  res.cookies.set("bni_platform_nav_display", display, { ...so, httpOnly: false });
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
