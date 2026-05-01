import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchBusyAuthzForAccount } from "@/lib/busy-rbac";

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
  const idRaw = jar.get("bni_platform_account_id")?.value;
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
