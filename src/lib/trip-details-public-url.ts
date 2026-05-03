import { headers } from "next/headers";
import { marketingSiteOrigin } from "@/lib/marketing-site-origin";

/** Request-derived origin when possible; otherwise `marketingSiteOrigin()` (stable for OG/QR). */
export async function tripDetailsPublicOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h.get("host") ?? "";
  const protoRaw = h.get("x-forwarded-proto") ?? "http";
  const proto = protoRaw.split(",")[0]?.trim().toLowerCase() === "https" ? "https" : "http";
  if (host) return `${proto}://${host}`;
  return marketingSiteOrigin();
}
