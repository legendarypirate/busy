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
