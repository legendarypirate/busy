import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { PLATFORM_ACCOUNT_REF_COOKIE } from "@/lib/platform-session-cookies";
import { prisma } from "@/lib/prisma";
import { readCookieValueFromHeader } from "@/lib/read-cookie-from-header";
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

export async function loadPlatformUserByAccountId(id: bigint): Promise<PlatformUser | null> {
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

/** Cookie-based session (matches login / Google callback cookies). */
export async function getPlatformSession(): Promise<PlatformUser | null> {
  const h = await headers();
  const rawCookie = h.get("cookie");
  /** Prefer raw `Cookie` first: some proxies / full refreshes surface values here before `cookies()` merges. */
  const fromHeader =
    readCookieValueFromHeader(rawCookie, "bni_platform_account_id")?.trim() ||
    readCookieValueFromHeader(rawCookie, PLATFORM_ACCOUNT_REF_COOKIE)?.trim();

  const jar = await cookies();
  const fromJar =
    jar.get("bni_platform_account_id")?.value?.trim() ||
    jar.get(PLATFORM_ACCOUNT_REF_COOKIE)?.value?.trim();

  const idRaw = fromHeader || fromJar;

  if (!idRaw) {
    return null;
  }
  let id: bigint;
  try {
    id = BigInt(idRaw);
  } catch {
    return null;
  }

  return loadPlatformUserByAccountId(id);
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
