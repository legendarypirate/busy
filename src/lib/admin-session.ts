import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPlatformSession, type PlatformUser } from "@/lib/platform-session";

/** Post-login redirect for admin; only allows paths under `/admin`. */
export function defaultPostAdminLoginPath(requested: string): string {
  const t = requested.trim();
  if (t === "" || t === "/" || t === "/admin") return "/admin/dashboard";
  if (!t.startsWith("/admin") || t.startsWith("//")) return "/admin/dashboard";
  return t.slice(0, 512);
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
    if (!row || row.status !== "active" || row.role !== "admin") {
      redirect(`/admin/login${q}`);
    }
  } catch {
    redirect(`/admin/login${q}`);
  }
  return u;
}
