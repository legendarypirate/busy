import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Permission keys — keep stable; wire to `BusyPermission` after seeding. */
export const BUSY_PERMISSIONS = {
  weeklyMeetingManageOwn: "weekly_meeting.manage_own",
  weeklyMeetingManageAny: "weekly_meeting.manage_any",
  adminUsersRead: "admin.users.read",
} as const;

export type BusyPermissionKey = (typeof BUSY_PERMISSIONS)[keyof typeof BUSY_PERMISSIONS];

export const BUSY_ROLE_SLUGS = {
  guest: "guest",
  registeredUser: "registered_user",
  businessMember: "business_member",
  organizer: "organizer",
  supplier: "supplier",
  investor: "investor",
  admin: "admin",
  superAdmin: "super_admin",
} as const;

/** Bootstrap RBAC rows so assignments and future admin UI work. Idempotent. */
export async function ensureBusyRbacSeed(): Promise<void> {
  try {
    const roleCount = await prisma.busyRole.count();
    if (roleCount > 0) return;
  } catch {
    return;
  }

  const roles = [
    { slug: BUSY_ROLE_SLUGS.guest, label: "Guest" },
    { slug: BUSY_ROLE_SLUGS.registeredUser, label: "Registered user" },
    { slug: BUSY_ROLE_SLUGS.businessMember, label: "Business member" },
    { slug: BUSY_ROLE_SLUGS.organizer, label: "Organizer" },
    { slug: BUSY_ROLE_SLUGS.supplier, label: "Supplier" },
    { slug: BUSY_ROLE_SLUGS.investor, label: "Investor" },
    { slug: BUSY_ROLE_SLUGS.admin, label: "Admin" },
    { slug: BUSY_ROLE_SLUGS.superAdmin, label: "Super admin" },
  ];

  const perms = [
    { key: BUSY_PERMISSIONS.weeklyMeetingManageOwn, description: "Create and manage own weekly meetings" },
    { key: BUSY_PERMISSIONS.weeklyMeetingManageAny, description: "Manage any weekly meeting" },
    { key: BUSY_PERMISSIONS.adminUsersRead, description: "Read users (admin panel)" },
  ];

  try {
    await prisma.$transaction(async (tx) => {
    await tx.busyRole.createMany({ data: roles, skipDuplicates: true });
    await tx.busyPermission.createMany({ data: perms, skipDuplicates: true });

    const dbRoles = await tx.busyRole.findMany();
    const dbPerms = await tx.busyPermission.findMany();
    const bySlug = new Map(dbRoles.map((r) => [r.slug, r.id]));
    const byKey = new Map(dbPerms.map((p) => [p.key, p.id]));

    const links: { roleId: number; permissionId: number }[] = [];
    const organizerId = bySlug.get(BUSY_ROLE_SLUGS.organizer);
    const adminId = bySlug.get(BUSY_ROLE_SLUGS.admin);
    const superId = bySlug.get(BUSY_ROLE_SLUGS.superAdmin);
    const pOwn = byKey.get(BUSY_PERMISSIONS.weeklyMeetingManageOwn);
    const pAny = byKey.get(BUSY_PERMISSIONS.weeklyMeetingManageAny);
    const pUsers = byKey.get(BUSY_PERMISSIONS.adminUsersRead);

    if (organizerId && pOwn) links.push({ roleId: organizerId, permissionId: pOwn });
    if (adminId && pAny) links.push({ roleId: adminId, permissionId: pAny });
    if (adminId && pUsers) links.push({ roleId: adminId, permissionId: pUsers });
    if (superId && pAny) links.push({ roleId: superId, permissionId: pAny });
    if (superId && pUsers) links.push({ roleId: superId, permissionId: pUsers });

    if (links.length) {
      await tx.busyRolePermission.createMany({ data: links, skipDuplicates: true });
    }
    });
  } catch {
    /* concurrent first boot: another request may have seeded */
  }
}

export function legacyRoleCanManageAnyWeeklyMeeting(role: PlatformRole): boolean {
  return role === "admin" || role === "director";
}

/** MVP: platform admin/director, or meeting group owner, or explicit RBAC assignment. */
export async function accountCanManageWeeklyMeeting(accountId: bigint, organizerAccountId: bigint): Promise<boolean> {
  if (organizerAccountId === accountId) return true;

  const acc = await prisma.platformAccount.findUnique({ where: { id: accountId }, select: { role: true } });
  if (acc && legacyRoleCanManageAnyWeeklyMeeting(acc.role)) return true;

  const rows = await prisma.busyUserRoleAssignment.findMany({
    where: { accountId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  for (const row of rows) {
    for (const rp of row.role.permissions) {
      if (rp.permission.key === BUSY_PERMISSIONS.weeklyMeetingManageAny) return true;
    }
  }
  return false;
}

/** Non-visitor legacy roles may create weekly meetings (MVP gate before Busy RBAC UI). */
export function canAccountCreateWeeklyMeeting(legacyRole: PlatformRole): boolean {
  return legacyRole !== "visitor";
}

export type BusyAuthzSnapshot = {
  roleSlugs: string[];
  permissionKeys: string[];
};

/** Busy role slugs + permission keys for this account (from `busy_user_role_assignments`). */
export async function fetchBusyAuthzForAccount(accountId: bigint): Promise<BusyAuthzSnapshot> {
  try {
    const rows = await prisma.busyUserRoleAssignment.findMany({
      where: { accountId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    const roleSlugs = [...new Set(rows.map((r) => r.role.slug))];
    const permissionKeys = new Set<string>();
    for (const r of rows) {
      for (const rp of r.role.permissions) {
        permissionKeys.add(rp.permission.key);
      }
    }
    return { roleSlugs, permissionKeys: [...permissionKeys] };
  } catch {
    return { roleSlugs: [], permissionKeys: [] };
  }
}

/**
 * Idempotent: gives active non-visitor accounts the `organizer` Busy role so `weekly_meeting.manage_own` applies.
 * Call after successful login (email + Google).
 */
export async function ensureOrganizerRoleForEligibleAccount(accountId: bigint): Promise<void> {
  let acc: { role: PlatformRole } | null;
  try {
    acc = await prisma.platformAccount.findUnique({ where: { id: accountId }, select: { role: true } });
  } catch {
    return;
  }
  if (!acc || acc.role === "visitor") return;

  await ensureBusyRbacSeed();

  let organizerId: number | undefined;
  try {
    const organizer = await prisma.busyRole.findUnique({
      where: { slug: BUSY_ROLE_SLUGS.organizer },
      select: { id: true },
    });
    organizerId = organizer?.id;
  } catch {
    return;
  }
  if (organizerId === undefined) return;

  try {
    await prisma.busyUserRoleAssignment.upsert({
      where: { accountId_roleId: { accountId, roleId: organizerId } },
      create: { accountId, roleId: organizerId },
      update: {},
    });
  } catch {
    /* concurrent upsert */
  }
}
