import { redirect } from "next/navigation";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlatformSession, type PlatformUser } from "@/lib/platform-session";

/** Roles allowed to sign in at `/admin/login`. */
export const ADMIN_PANEL_ROLES: PlatformRole[] = ["admin", "super_admin", "trip_manager", "event_manager"];

export function isAdminPanelRole(role: string): role is PlatformRole {
  return ADMIN_PANEL_ROLES.includes(role as PlatformRole);
}

/** Post-login redirect for admin; only allows paths under `/admin`. */
export function defaultPostAdminLoginPath(requested: string): string {
  const t = requested.trim();
  if (t === "" || t === "/" || t === "/admin") return "/admin/dashboard";
  if (!t.startsWith("/admin") || t.startsWith("//")) return "/admin/dashboard";
  return t.slice(0, 512);
}

/** Scoped managers land in their section unless `next` already targets allowed routes. */
export function defaultAdminLandingPath(role: PlatformRole, requestedNextRaw: string): string {
  const safe = defaultPostAdminLoginPath(requestedNextRaw);

  if (role === "trip_manager") {
    if (safe.startsWith("/admin/trips") || safe.startsWith("/admin/trip-registrations")) return safe;
    return "/admin/trips";
  }

  if (role === "event_manager") {
    if (
      safe.startsWith("/admin/meetings") ||
      safe.startsWith("/admin/bni-events") ||
      safe.startsWith("/admin/events")
    ) {
      return safe;
    }
    return "/admin/meetings";
  }

  return safe;
}

/** For `requireAdminUser` redirect `next` query (from middleware `x-pathname`). */
export function getAdminLoginNextPath(h: Headers): string {
  const raw = h.get("x-pathname")?.trim() ?? "";
  if (raw.startsWith("/admin") && !raw.startsWith("//")) {
    const sliced = raw.slice(0, 512);
    if (sliced === "" || sliced === "/admin") return "/admin/dashboard";
    return sliced;
  }
  return "/admin/dashboard";
}

export async function requireAdminUser(nextPath = "/admin"): Promise<PlatformUser> {
  const q = nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : "";
  const u = await getPlatformSession();
  if (!u) {
    redirect(`/admin/login${q}`);
  }
  try {
    const row = await prisma.platformAccount.findUnique({
      where: { id: u.id },
      select: { role: true, status: true },
    });
    if (!row || row.status !== "active" || !isAdminPanelRole(row.role)) {
      redirect(`/admin/login${q}`);
    }
  } catch {
    redirect(`/admin/login${q}`);
  }
  return u;
}
