"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureOrganizerRoleForEligibleAccount } from "@/lib/busy-rbac";
import { defaultPostLoginPath } from "@/lib/platform-session";
import { setPlatformSessionCookies } from "@/lib/platform-session-cookies";

export type RegisterFormState = {
  errorKey:
    | "invalid"
    | "password_mismatch"
    | "password_weak"
    | "terms_required"
    | "email_taken"
    | "use_google"
    | "account_inactive"
    | "server_error"
    | null;
  displayName: string;
  email: string;
};

const BCRYPT_ROUNDS = 12;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t.slice(0, 512);
}

function isWeakPassword(p: string): boolean {
  return p.length < 8;
}

export async function registerAction(_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> {
  const displayNameRaw = String(formData.get("displayName") ?? "");
  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const terms = String(formData.get("terms") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  const displayName = displayNameRaw.trim();
  const email = normalizeEmail(emailRaw);

  const baseState: RegisterFormState = {
    errorKey: null,
    displayName: displayNameRaw,
    email: emailRaw,
  };

  if (!displayName || !email || !password) {
    return { ...baseState, errorKey: "invalid" };
  }

  if (!terms || terms !== "on") {
    return { ...baseState, errorKey: "terms_required" };
  }

  if (password !== passwordConfirm) {
    return { ...baseState, errorKey: "password_mismatch" };
  }

  if (isWeakPassword(password)) {
    return { ...baseState, errorKey: "password_weak" };
  }

  let existing;
  try {
    existing = await prisma.platformAccount.findUnique({
      where: { email },
      select: { id: true, status: true, passwordHash: true, googleSub: true },
    });
  } catch {
    return { ...baseState, errorKey: "server_error" };
  }

  if (existing) {
    if (existing.status !== "active") {
      return { ...baseState, errorKey: "account_inactive" };
    }
    const hasPassword = Boolean(existing.passwordHash && existing.passwordHash !== "");
    if (!hasPassword && existing.googleSub) {
      return { ...baseState, errorKey: "use_google" };
    }
    return { ...baseState, errorKey: "email_taken" };
  }

  let passwordHash: string;
  try {
    passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  } catch {
    return { ...baseState, errorKey: "server_error" };
  }

  let accountId: bigint;
  try {
    const created = await prisma.platformAccount.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            displayName,
          },
        },
      },
      select: { id: true },
    });
    accountId = created.id;
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002") {
      return { ...baseState, errorKey: "email_taken" };
    }
    return { ...baseState, errorKey: "server_error" };
  }

  try {
    await prisma.platformAccount.update({
      where: { id: accountId },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    /* non-fatal */
  }

  await setPlatformSessionCookies(accountId, displayName);
  await ensureOrganizerRoleForEligibleAccount(accountId);

  redirect(defaultPostLoginPath(next));
}
