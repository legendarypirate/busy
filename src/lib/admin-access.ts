import { redirect } from "next/navigation";
import type { PlatformRole } from "@prisma/client";
import { ADMIN_NAV_BNI, ADMIN_NAV_MAIN, type AdminNavItem } from "@/lib/admin-nav";
import { requireAdminUser } from "@/lib/admin-session";

/** Full sidebar + platform user management (assign managers). */
export function canManagePlatformUsers(role: PlatformRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function legacyRoleAllowsFullAdminApi(role: PlatformRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function legacyRoleAllowsTripAdminApi(role: PlatformRole): boolean {
  return role === "admin" || role === "super_admin" || role === "trip_manager";
}

export function legacyRoleAllowsEventAdminApi(role: PlatformRole): boolean {
  return role === "admin" || role === "super_admin" || role === "event_manager";
}

export function canManageEventsInAdminVenue(role: PlatformRole): boolean {
  return legacyRoleAllowsEventAdminApi(role);
}

const TRIP_NAV_KEYS = new Set(["trips", "trip_registrations"]);
const EVENT_MAIN_NAV_KEYS = new Set(["meetings"]);
const EVENT_BNI_NAV_KEYS = new Set(["bni_events"]);

export function filterAdminNavForRole(role: PlatformRole): {
  main: AdminNavItem[];
  bni: AdminNavItem[];
  showBniHeader: boolean;
} {
  if (role === "admin" || role === "super_admin") {
    return { main: ADMIN_NAV_MAIN, bni: ADMIN_NAV_BNI, showBniHeader: true };
  }
  if (role === "trip_manager") {
    return {
      main: ADMIN_NAV_MAIN.filter((i) => TRIP_NAV_KEYS.has(i.key)),
      bni: [],
      showBniHeader: false,
    };
  }
  if (role === "event_manager") {
    return {
      main: ADMIN_NAV_MAIN.filter((i) => EVENT_MAIN_NAV_KEYS.has(i.key)),
      bni: ADMIN_NAV_BNI.filter((i) => EVENT_BNI_NAV_KEYS.has(i.key)),
      showBniHeader: ADMIN_NAV_BNI.some((i) => EVENT_BNI_NAV_KEYS.has(i.key)),
    };
  }
  return { main: [], bni: [], showBniHeader: false };
}

/** Block managers from bookmarking other `/admin/*` routes. */
export function enforceAdminPathAllowedForRole(role: PlatformRole, pathname: string): void {
  const path = (pathname.split("?")[0] || "/admin").replace(/\/$/, "") || "/admin";

  if (role === "admin" || role === "super_admin") return;

  if (role === "trip_manager") {
    const ok =
      path.startsWith("/admin/trips") || path.startsWith("/admin/trip-registrations");
    if (!ok) redirect("/admin/trips");
    return;
  }

  if (role === "event_manager") {
    const ok =
      path.startsWith("/admin/meetings") ||
      path.startsWith("/admin/bni-events") ||
      path.startsWith("/admin/events");
    if (!ok) redirect("/admin/meetings");
    return;
  }

  redirect("/admin/login");
}

export async function requirePlatformUserManagement(nextPath = "/admin/bni-platform-users") {
  const u = await requireAdminUser(nextPath);
  const role = u.role as PlatformRole;
  if (!canManagePlatformUsers(role)) {
    redirect(role === "trip_manager" ? "/admin/trips" : "/admin/meetings");
  }
  return u;
}
