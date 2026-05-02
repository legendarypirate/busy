import crypto from "crypto";
import { platformSessionMaxAgeSeconds } from "@/lib/platform-session-ttl";
import {
  PLATFORM_POST_TOKEN_FIELD,
  PLATFORM_TRIP_SAVE_TOKEN_FIELD,
} from "@/lib/platform-post-token-constants";

export { PLATFORM_POST_TOKEN_FIELD, PLATFORM_TRIP_SAVE_TOKEN_FIELD };

const AUD_POST = "busy_platform_post_v1";
const AUD_TRIP_SAVE_LEGACY = "busy_trip_save_v1";

function secretKey(): Buffer | null {
  const s =
    process.env.PLATFORM_TRIP_SAVE_SECRET?.trim() ||
    process.env.PLATFORM_POST_TOKEN_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (s) return Buffer.from(s, "utf8");
  if (process.env.NODE_ENV === "development") {
    return Buffer.from("__busy_platform_trip_save_dev_only__", "utf8");
  }
  return null;
}

export function postTokenFromFormData(formData: FormData): FormDataEntryValue | null {
  return formData.get(PLATFORM_POST_TOKEN_FIELD) ?? formData.get(PLATFORM_TRIP_SAVE_TOKEN_FIELD);
}

/** HMAC-signed bearer for HTML forms when cookies are missing on POST. */
export function issuePlatformPostToken(accountId: bigint): string | null {
  const key = secretKey();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + platformSessionMaxAgeSeconds();
  const payload = JSON.stringify({ aud: AUD_POST, sub: accountId.toString(), exp });
  const mac = crypto.createHmac("sha256", key).update(payload).digest();
  const body = Buffer.from(payload, "utf8").toString("base64url");
  const sig = mac.toString("base64url");
  return `${body}.${sig}`;
}

/** @deprecated Use `issuePlatformPostToken` */
export const issuePlatformTripSaveToken = issuePlatformPostToken;

export function verifyPlatformPostToken(raw: FormDataEntryValue | null | undefined): bigint | null {
  if (raw == null || typeof raw !== "string" || !raw.includes(".")) return null;
  const key = secretKey();
  if (!key) return null;
  const dot = raw.lastIndexOf(".");
  const bodyB64 = raw.slice(0, dot);
  const sigB64 = raw.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(bodyB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sigB64, "base64url");
  } catch {
    return null;
  }
  const expectedMac = crypto.createHmac("sha256", key).update(payload).digest();
  if (sigBuf.length !== expectedMac.length || !crypto.timingSafeEqual(sigBuf, expectedMac)) {
    return null;
  }
  try {
    const o = JSON.parse(payload) as { aud?: string; sub?: string; exp?: number };
    if ((o.aud !== AUD_POST && o.aud !== AUD_TRIP_SAVE_LEGACY) || typeof o.sub !== "string" || typeof o.exp !== "number") {
      return null;
    }
    if (o.exp < Math.floor(Date.now() / 1000)) return null;
    return BigInt(o.sub);
  } catch {
    return null;
  }
}

/** @deprecated Use `verifyPlatformPostToken` */
export const verifyPlatformTripSaveToken = verifyPlatformPostToken;
