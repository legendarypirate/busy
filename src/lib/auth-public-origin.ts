import type { NextRequest } from "next/server";

/** Public origin for OAuth redirect_uri (must match Google Console). */
export function getPublicAppOrigin(request: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) {
    return env;
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const protoRaw = request.headers.get("x-forwarded-proto") ?? "http";
  const proto = protoRaw.split(",")[0]?.trim() === "https" ? "https" : "http";
  if (host) {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

/**
 * True when the legacy PHP base URL is on the **same hostname** as `NEXT_PUBLIC_APP_URL`.
 * In that case the marketing header should use Next `/auth/login` and `/platform` so Google/email
 * set `bni_platform_account_id`; PHP-only `PHPSESSID` does not authorize Next Server Actions.
 */
export function legacySameHostnameAsNextApp(
  legacyBase: string | undefined,
  appUrl: string | undefined,
): boolean {
  const l = legacyBase?.trim().replace(/\/$/, "");
  const a = appUrl?.trim().replace(/\/$/, "");
  if (!l || !a) return false;
  try {
    const legacyUrl = new URL(l.includes("://") ? l : `https://${l}`);
    const app = new URL(a.includes("://") ? a : `https://${a}`);
    return legacyUrl.hostname === app.hostname;
  } catch {
    return false;
  }
}
