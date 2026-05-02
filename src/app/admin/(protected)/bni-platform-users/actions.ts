"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-session";

const ROLES: PlatformRole[] = ["visitor", "member", "director", "admin"];

export async function updatePlatformAccountRoleAction(formData: FormData): Promise<void> {
  await requireAdminUser("/admin/bni-platform-users");
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
