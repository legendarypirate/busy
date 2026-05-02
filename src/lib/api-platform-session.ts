import type { NextRequest } from "next/server";
import { PLATFORM_ACCOUNT_REF_COOKIE } from "@/lib/platform-session-cookies";
import { prisma } from "@/lib/prisma";
import { readCookieValueFromHeader } from "@/lib/read-cookie-from-header";
import { postTokenFromFormData, verifyPlatformPostToken } from "@/lib/platform-trip-save-token";
import { fetchBusyAuthzForAccount } from "@/lib/busy-rbac";
import type { PlatformAccount, PlatformProfile } from "@prisma/client";

export type ApiPlatformUser = {
  id: bigint;
  email: string;
  displayName: string;
  /** Legacy `PlatformRole` from `bni_platform_accounts.role`. */
  legacyRole: PlatformAccount["role"];
  profile: Pick<PlatformProfile, "displayName" | "photoUrl"> | null;
};

export type ApiPlatformUserWithBusyAuthz = ApiPlatformUser & {
  busyRoleSlugs: string[];
  busyPermissionKeys: string[];
};

function parseAccountId(raw: string | undefined): bigint | null {
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/** Same resolution order as `getPlatformSession` (parsed jar + raw `Cookie` header). */
function resolveAccountIdFromRequest(req: NextRequest): bigint | null {
  const fromJar =
    parseAccountId(req.cookies.get("bni_platform_account_id")?.value) ??
    parseAccountId(req.cookies.get(PLATFORM_ACCOUNT_REF_COOKIE)?.value);
  if (fromJar) return fromJar;

  const raw = req.headers.get("cookie");
  return (
    parseAccountId(readCookieValueFromHeader(raw, "bni_platform_account_id")) ??
    parseAccountId(readCookieValueFromHeader(raw, PLATFORM_ACCOUNT_REF_COOKIE))
  );
}

async function loadApiPlatformUserByAccountId(id: bigint): Promise<ApiPlatformUser | null> {
  let account: (PlatformAccount & { profile: PlatformProfile | null }) | null;
  try {
    account = await prisma.platformAccount.findUnique({
      where: { id },
      include: { profile: true },
    });
  } catch {
    return null;
  }

  if (!account || account.status !== "active") return null;

  const display =
    account.profile?.displayName && account.profile.displayName.trim() !== ""
      ? account.profile.displayName.trim()
      : account.email;

  return {
    id: account.id,
    email: account.email,
    displayName: display,
    legacyRole: account.role,
    profile: account.profile
      ? { displayName: account.profile.displayName, photoUrl: account.profile.photoUrl }
      : null,
  };
}

/** Resolve logged-in platform user from platform session cookies (same as `getPlatformSession`). */
export async function getApiPlatformUser(req: NextRequest): Promise<ApiPlatformUser | null> {
  const id = resolveAccountIdFromRequest(req);
  if (!id) return null;
  return loadApiPlatformUserByAccountId(id);
}

/** Multipart trip save: signed token minted on `/platform/trips` when cookies are missing on POST. */
export async function getApiPlatformUserFromTripSaveForm(formData: FormData): Promise<ApiPlatformUser | null> {
  const id = verifyPlatformPostToken(postTokenFromFormData(formData));
  if (!id) return null;
  return loadApiPlatformUserByAccountId(id);
}

export async function getApiPlatformUserWithBusyAuthz(req: NextRequest): Promise<ApiPlatformUserWithBusyAuthz | null> {
  const base = await getApiPlatformUser(req);
  if (!base) return null;
  const authz = await fetchBusyAuthzForAccount(base.id);
  return { ...base, busyRoleSlugs: authz.roleSlugs, busyPermissionKeys: authz.permissionKeys };
}
