import { headers } from "next/headers";

/** Canonical site origin for OG URLs, QR, and social share (prefer `NEXT_PUBLIC_APP_URL`). */
export async function tripDetailsPublicOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? "";
  const protoRaw = h.get("x-forwarded-proto") ?? "http";
  const proto = protoRaw.split(",")[0]?.trim().toLowerCase() === "https" ? "https" : "http";
  return host ? `${proto}://${host}` : "";
}
