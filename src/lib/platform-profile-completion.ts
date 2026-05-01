import type { PlatformProfile } from "@prisma/client";

/** Same weights as PHP `platform-home.php` (`$profileFields`). */
export function computeProfileCompletionPct(
  profile: Pick<PlatformProfile, "displayName" | "companyName" | "website" | "addressLine" | "bio" | "businessPhone" | "businessEmail"> | null,
  businessJson: Record<string, unknown>,
): number {
  const contactOk =
    String(profile?.businessPhone ?? "").trim() !== "" || String(profile?.businessEmail ?? "").trim() !== "";
  const fields = [
    String(profile?.displayName ?? "").trim(),
    String(profile?.companyName ?? "").trim(),
    String(businessJson.industry ?? "").trim(),
    contactOk ? "x" : "",
    String(profile?.website ?? "").trim(),
    String(profile?.addressLine ?? "").trim(),
    String(profile?.bio ?? "").trim(),
  ];
  const filled = fields.filter((f) => f.trim() !== "").length;
  return Math.round((filled / Math.max(1, fields.length)) * 100);
}
