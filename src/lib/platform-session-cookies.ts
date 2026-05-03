import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { platformSessionMaxAgeSeconds } from "@/lib/platform-session-ttl";

/**
 * Non-httpOnly mirror of `bni_platform_account_id` (same digits as httpOnly cookie).
 */
export const PLATFORM_ACCOUNT_REF_COOKIE = "bni_platform_account_ref";

const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
const secureCookie =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  publicAppUrl.startsWith("https://");

function parsePlatformSessionCookieDomainHost(): string | undefined {
  const raw = process.env.PLATFORM_SESSION_COOKIE_DOMAIN?.trim();
  if (!raw || raw.includes("://")) return undefined;
  const withoutDot = raw.startsWith(".") ? raw.slice(1) : raw;
  const hostOnly = withoutDot.split(":")[0]?.trim();
  if (!hostOnly || hostOnly.includes("/") || hostOnly.includes(" ")) return undefined;
  return hostOnly;
}

export const platformSessionCookieDomain = parsePlatformSessionCookieDomainHost();

/** `Domain=.example.com` attribute for Set-Cookie when `PLATFORM_SESSION_COOKIE_DOMAIN` is set. */
function dottedCookieDomainAttr(): string | undefined {
  if (!platformSessionCookieDomain) return undefined;
  return `.${platformSessionCookieDomain}`.replace(/^\.+/, ".");
}

function domainOpts(): { domain?: string } {
  const d = dottedCookieDomainAttr();
  if (!d) return {};
  return { domain: d };
}

type CookieSetter = (
  name: string,
  value: string,
  options: {
    path: string;
    maxAge: number;
    sameSite: "lax";
    secure: boolean;
    httpOnly: boolean;
    domain?: string;
  },
) => void;

/**
 * Remove duplicate shards: host-only vs `Domain=.busy.mn` both sent in production → wrong user if old cookie wins.
 */
function clearPlatformSessionCookieVariants(setter: CookieSetter): void {
  const names: [string, boolean][] = [
    ["bni_platform_account_id", true],
    [PLATFORM_ACCOUNT_REF_COOKIE, false],
    ["bni_platform_nav_display", false],
  ];
  const base = { path: "/", maxAge: 0, sameSite: "lax" as const, secure: secureCookie };
  const dom = dottedCookieDomainAttr();
  for (const [name, httpOnly] of names) {
    setter(name, "", { ...base, httpOnly });
    if (dom) {
      setter(name, "", { ...base, httpOnly, domain: dom });
    }
  }
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
  clearPlatformSessionCookieVariants((name, value, options) => {
    jar.set(name, value, options);
  });
  const idStr = accountId.toString();
  const so = sessionCookieOpts();
  jar.set("bni_platform_account_id", idStr, { ...so, httpOnly: true });
  jar.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, { ...so, httpOnly: false });
  jar.set("bni_platform_nav_display", display, { ...so, httpOnly: false });
}

export function attachPlatformSessionToResponse(res: NextResponse, accountId: bigint, display: string): void {
  clearPlatformSessionCookieVariants((name, value, options) => {
    res.cookies.set(name, value, options);
  });
  const idStr = accountId.toString();
  const so = sessionCookieOpts();
  res.cookies.set("bni_platform_account_id", idStr, { ...so, httpOnly: true });
  res.cookies.set(PLATFORM_ACCOUNT_REF_COOKIE, idStr, { ...so, httpOnly: false });
  res.cookies.set("bni_platform_nav_display", display, { ...so, httpOnly: false });
}

export function attachClearPlatformSessionToResponse(res: NextResponse): void {
  clearPlatformSessionCookieVariants((name, value, options) => {
    res.cookies.set(name, value, options);
  });
}

export async function clearPlatformSessionCookies(): Promise<void> {
  const jar = await cookies();
  clearPlatformSessionCookieVariants((name, value, options) => {
    jar.set(name, value, options);
  });
}

function decodeCookieValue(v: string): string {
  let out = v;
  if (out.startsWith('"') && out.endsWith('"') && out.length >= 2) {
    out = out.slice(1, -1);
  }
  try {
    return decodeURIComponent(out);
  } catch {
    return out;
  }
}

/** Parse one cookie value from a raw `Cookie` header (first match). */
export function readCookieValueFromHeader(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const seg of cookieHeader.split(";")) {
    const trimmed = seg.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    if (k !== name) continue;
    return decodeCookieValue(trimmed.slice(eq + 1).trim());
  }
  return undefined;
}

/**
 * Last match wins (duplicate `name=` from host-only + `Domain=` shards — newest is often last).
 * Prefer this for session id resolution in production.
 */
export function readCookieLastValueFromHeader(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  let last: string | undefined;
  for (const seg of cookieHeader.split(";")) {
    const trimmed = seg.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    if (k !== name) continue;
    last = decodeCookieValue(trimmed.slice(eq + 1).trim());
  }
  return last;
}
