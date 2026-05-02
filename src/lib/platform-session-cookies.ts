import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { platformSessionMaxAgeSeconds } from "@/lib/platform-session-ttl";

/**
 * Non-httpOnly mirror of `bni_platform_account_id`.
 */
export const PLATFORM_ACCOUNT_REF_COOKIE = "bni_platform_account_ref";

/**
 * Force secure cookies in production (REQUIRED for SameSite=None).
 */
const secureCookie =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

/**
 * Parse domain safely (e.g. "busy.mn")
 */
function parsePlatformSessionCookieDomainHost(): string | undefined {
  const raw = process.env.PLATFORM_SESSION_COOKIE_DOMAIN?.trim();
  if (!raw || raw.includes("://")) return undefined;

  const withoutDot = raw.startsWith(".") ? raw.slice(1) : raw;
  const hostOnly = withoutDot.split(":")[0]?.trim();

  if (!hostOnly || hostOnly.includes("/") || hostOnly.includes(" ")) {
    return undefined;
  }

  return hostOnly;
}

export const platformSessionCookieDomain =
  parsePlatformSessionCookieDomainHost();

/**
 * Domain options (shared across subdomains)
 */
function domainOpts(): { domain?: string } {
  if (!platformSessionCookieDomain) return {};
  return {
    domain: `.${platformSessionCookieDomain}`.replace(/^\.+/, "."),
  };
}

/**
 * 🔥 FINAL COOKIE CONFIG (FIXED)
 */
function sessionCookieOpts(): {
  path: string;
  maxAge: number;
  sameSite: "none";
  secure: boolean;
  domain?: string;
} {
  return {
    path: "/",
    maxAge: platformSessionMaxAgeSeconds(),
    sameSite: "none", // ✅ FIX: required for OAuth redirects
    secure: true,     // ✅ MUST be true with SameSite=None
    ...domainOpts(),
  };
}

/**
 * Google OAuth helper cookies (state, next)
 */
export const googleOAuthCookieBase = {
  path: "/" as const,
  sameSite: "none" as const, // ✅ keep consistent
  secure: true,
  ...domainOpts(),
} as const;

/**
 * Server Actions: set cookies
 */
export async function setPlatformSessionCookies(
  accountId: bigint,
  display: string
): Promise<void> {
  const jar = await cookies();
  const idStr = accountId.toString();
  const so = sessionCookieOpts();

  jar.set("bni_platform_account_id", idStr, {
    ...so,
    httpOnly: true,
  });

  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, {
    ...so,
    httpOnly: false,
  });

  jar.set("bni_platform_nav_display", display, {
    ...so,
    httpOnly: false,
  });
}

/**
 * Route Handlers: attach cookies to response
 */
export function attachPlatformSessionToResponse(
  res: NextResponse,
  accountId: bigint,
  display: string
): void {
  const idStr = accountId.toString();
  const so = sessionCookieOpts();

  res.cookies.set("bni_platform_account_id", idStr, {
    ...so,
    httpOnly: true,
  });

  res.cookies.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, {
    ...so,
    httpOnly: false,
  });

  res.cookies.set("bni_platform_nav_display", display, {
    ...so,
    httpOnly: false,
  });
}

/**
 * Clear cookie options
 */
const clearCookieOpts = {
  path: "/",
  maxAge: 0,
  sameSite: "none" as const, // ✅ must match
  secure: true,
  ...domainOpts(),
};

/**
 * Clear cookies (Route Handlers)
 */
export function attachClearPlatformSessionToResponse(
  res: NextResponse
): void {
  res.cookies.set("bni_platform_account_id", "", {
    ...clearCookieOpts,
    httpOnly: true,
  });

  res.cookies.set(PLATFORM_ACCOUNT_REF_COOKIE, "", {
    ...clearCookieOpts,
    httpOnly: false,
  });

  res.cookies.set("bni_platform_nav_display", "", {
    ...clearCookieOpts,
    httpOnly: false,
  });
}

/**
 * Clear cookies (Server Actions)
 */
export async function clearPlatformSessionCookies(): Promise<void> {
  const jar = await cookies();

  jar.set("bni_platform_account_id", "", {
    ...clearCookieOpts,
    httpOnly: true,
  });

  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, "", {
    ...clearCookieOpts,
    httpOnly: false,
  });

  jar.set("bni_platform_nav_display", "", {
    ...clearCookieOpts,
    httpOnly: false,
  });
}