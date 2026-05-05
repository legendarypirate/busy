"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformUserManagement } from "@/lib/admin-access";
import { ensureOrganizerRoleForEligibleAccount } from "@/lib/busy-rbac";

const BCRYPT_ROUNDS = 12;

const ROLES: PlatformRole[] = [
  "visitor",
  "member",
  "director",
  "admin",
  "super_admin",
  "trip_manager",
  "event_manager",
];

/** Roles allowed when creating a new account (no `super_admin` via this form). */
const CREATABLE_ROLES: PlatformRole[] = [
  "trip_manager",
  "event_manager",
  "visitor",
  "member",
  "director",
  "admin",
];

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function createPlatformStaffUserAction(formData: FormData): Promise<void> {
  await requirePlatformUserManagement("/admin/bni-platform-users");
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const displayNameRaw = String(formData.get("display_name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim() as PlatformRole;

  if (!email || !password || !CREATABLE_ROLES.includes(roleRaw)) {
    redirect("/admin/bni-platform-users?create=invalid");
  }
  if (password.length < 8) {
    redirect("/admin/bni-platform-users?create=weak_password");
  }

  const existing = await prisma.platformAccount.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    redirect("/admin/bni-platform-users?create=email_taken");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const displayName = displayNameRaw || email.split("@")[0] || email;

  const created = await prisma.platformAccount.create({
    data: {
      email,
      passwordHash,
      role: roleRaw,
      status: "active",
      profile: {
        create: { displayName },
      },
    },
    select: { id: true },
  });

  try {
    await ensureOrganizerRoleForEligibleAccount(created.id);
  } catch {
    /* non-fatal */
  }

  revalidatePath("/admin/bni-platform-users");
  redirect("/admin/bni-platform-users?create=ok");
}

export async function updatePlatformAccountRoleAction(formData: FormData): Promise<void> {
  await requirePlatformUserManagement("/admin/bni-platform-users");
  const idStr = String(formData.get("account_id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim() as PlatformRole;
  if (!idStr || !ROLES.includes(roleRaw)) redirect("/admin/bni-platform-users");
  let id: bigint;
  try {
    id = BigInt(idStr);
  } catch {
    redirect("/admin/bni-platform-users");
  }
  await prisma.platformAccount.update({
    where: { id },
    data: { role: roleRaw },
  });
  revalidatePath("/admin/bni-platform-users");
  redirect("/admin/bni-platform-users");
}
