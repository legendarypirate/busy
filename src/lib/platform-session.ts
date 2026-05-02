import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchBusyAuthzForAccount } from "@/lib/busy-rbac";

/** Fallback when `cookies()` is empty but the browser sent `Cookie` (e.g. some Server Action multipart POST paths). */
function readCookieFromHeader(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const segment of cookieHeader.split(";")) {
    const s = segment.trim();
    const eq = s.indexOf("=");
    if (eq <= 0) continue;
    const key = s.slice(0, eq).trim();
    if (key !== name) continue;
    const val = s.slice(eq + 1).trim();
    if (!val) return undefined;
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  }
  return undefined;
}

export type PlatformUser = {
  id: bigint;
  email: string;
  displayName: string;
  role: string;
  photoUrl: string | null;
};

export type PlatformUserWithBusyAuthz = PlatformUser & {
  busyRoleSlugs: string[];
  busyPermissionKeys: string[];
};

/** Cookie-based session (matches login / Google callback cookies). */
export async function getPlatformSession(): Promise<PlatformUser | null> {
  const jar = await cookies();
  const idValue = jar.get("bni_platform_account_id")?.value;

  const h = await headers();
  const rawCookie = h.get("cookie");

  // Prioritize headers fallback for Server Actions / multipart, or use jar value
  const idRaw = idValue || readCookieFromHeader(rawCookie, "bni_platform_account_id");

  if (!idRaw) {
    return null;
  }
  let id: bigint;
  try {
    id = BigInt(idRaw);
  } catch {
    return null;
  }

  let account;
  try {
    account = await prisma.platformAccount.findUnique({
      where: { id },
      include: { profile: { select: { displayName: true, photoUrl: true } } },
    });
  } catch {
    return null;
  }

  if (!account || account.status !== "active") {
    return null;
  }

  const display =
    account.profile?.displayName && account.profile.displayName.trim() !== ""
      ? account.profile.displayName.trim()
      : account.email;

  return {
    id: account.id,
    email: account.email,
    displayName: display,
    role: account.role,
    photoUrl: account.profile?.photoUrl?.trim() || null,
  };
}

export async function getPlatformSessionWithBusyAuthz(): Promise<PlatformUserWithBusyAuthz | null> {
  const base = await getPlatformSession();
  if (!base) return null;
  const authz = await fetchBusyAuthzForAccount(base.id);
  return { ...base, busyRoleSlugs: authz.roleSlugs, busyPermissionKeys: authz.permissionKeys };
}

export async function requirePlatformUser(nextPath = "/platform"): Promise<PlatformUser> {
  const u = await getPlatformSession();
  if (!u) {
    const q = nextPath.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/auth/login${q}`);
  }
  return u;
}

/** PHP `bni_platform_login_redirect_url`: хоосон `next` үед платформын нүүр. */
export function defaultPostLoginPath(requested: string): string {
  const t = requested.trim();
  if (t === "" || t === "/") {
    return "/platform";
  }
  return t;
}
