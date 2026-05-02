"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureOrganizerRoleForEligibleAccount } from "@/lib/busy-rbac";
import { defaultPostAdminLoginPath } from "@/lib/admin-session";
import { setPlatformSessionCookies } from "@/lib/platform-session-cookies";

export type AdminLoginFormState = {
  errorKey: "invalid" | "use_google" | "forbidden" | null;
  email: string;
};

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function safeAdminNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/admin";
  const t = raw.trim();
  if (!t.startsWith("/admin") || t.startsWith("//")) return "/admin";
  return t.slice(0, 512);
}

export async function adminLoginAction(_prev: AdminLoginFormState, formData: FormData): Promise<AdminLoginFormState> {
  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeAdminNextPath(String(formData.get("next") ?? ""));
  const email = normalizeEmail(emailRaw);

  if (!email || !password) {
    return { errorKey: "invalid", email: emailRaw };
  }

  let account;
  try {
    account = await prisma.platformAccount.findUnique({
      where: { email },
      include: { profile: { select: { displayName: true } } },
    });
  } catch {
    return { errorKey: "invalid", email: emailRaw };
  }

  if (!account || account.status !== "active") {
    return { errorKey: "invalid", email: emailRaw };
  }

  if (account.role !== "admin") {
    return { errorKey: "forbidden", email: emailRaw };
  }

  const hash = account.passwordHash;
  if (!hash || hash === "") {
    return { errorKey: "use_google", email: emailRaw };
  }

  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    return { errorKey: "invalid", email: emailRaw };
  }

  try {
    await prisma.platformAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    /* non-fatal */
  }

  const display =
    account.profile?.displayName && account.profile.displayName.trim() !== ""
      ? account.profile.displayName.trim()
      : account.email;

  await setPlatformSessionCookies(account.id, display);
  await ensureOrganizerRoleForEligibleAccount(account.id);

  redirect(defaultPostAdminLoginPath(next));
}
