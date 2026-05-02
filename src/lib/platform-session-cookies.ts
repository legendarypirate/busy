import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { platformSessionMaxAgeSeconds } from "@/lib/platform-session-ttl";

/**
 * Non-httpOnly mirror of `bni_platform_account_id` (same digits as httpOnly cookie).
 */
export const PLATFORM_ACCOUNT_REF_COOKIE = "bni_platform_account_ref";

const secureCookie = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

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

export const googleOAuthCookieBase = {
  path: "/" as const,
  sameSite: "lax" as const,
  secure: secureCookie,
  ...domainOpts(),
} as const;

export async function setPlatformSessionCookies(accountId: bigint, display: string): Promise<void> {
  const jar = await cookies();
  const idStr = accountId.toString();
  const so = sessionCookieOpts();
  jar.set("bni_platform_account_id", idStr, { ...so, httpOnly: true });
  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, { ...so, httpOnly: false });
  jar.set("bni_platform_nav_display", display, { ...so, httpOnly: false });
}

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

export function attachClearPlatformSessionToResponse(res: NextResponse): void {
  res.cookies.set("bni_platform_account_id", "", { ...clearCookieOpts, httpOnly: true });
  res.cookies.set(PLATFORM_ACCOUNT_REF_COOKIE, "", { ...clearCookieOpts, httpOnly: false });
  res.cookies.set("bni_platform_nav_display", "", { ...clearCookieOpts, httpOnly: false });
}

export async function clearPlatformSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.set("bni_platform_account_id", "", { ...clearCookieOpts, httpOnly: true });
  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, "", { ...clearCookieOpts, httpOnly: false });
  jar.set("bni_platform_nav_display", "", { ...clearCookieOpts, httpOnly: false });
}
