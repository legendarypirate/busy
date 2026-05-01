import { randomBytes } from "node:crypto";

/** URL-safe public slug for `/register/[publicSlug]`. */
export function newTripFormPublicSlug(): string {
  return `t${randomBytes(9).toString("base64url").replace(/=/g, "")}`;
}
