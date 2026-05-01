import { randomBytes } from "node:crypto";

/** URL-safe opaque token for `/m/{token}` (32 hex chars). */
export function createWeeklyMeetingPublicToken(): string {
  return randomBytes(16).toString("hex");
}
