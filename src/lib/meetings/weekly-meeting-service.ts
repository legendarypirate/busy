import {
  BusyMeetingAttendanceStatus,
  BusyMeetingPaymentStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { dbBusyWeeklyMeeting, prisma } from "@/lib/prisma";
import { accountCanManageWeeklyMeeting, ensureBusyRbacSeed } from "@/lib/busy-rbac";
import { createWeeklyMeetingPublicToken } from "@/lib/weekly-meeting-tokens";
import { buildMeetingRosterCsv } from "@/lib/roster-export";
import { buildContentDispositionAttachment } from "@/lib/http/content-disposition";
import type { CreateWeeklyMeetingInput, PublicRegisterMeetingInput } from "@/lib/meetings/weekly-meeting-types";

export type { CreateWeeklyMeetingInput, PublicRegisterMeetingInput } from "@/lib/meetings/weekly-meeting-types";

function parseYmdToUtcDate(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) throw new Error("BAD_DATE");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d));
}

function parseHhMmToTime(hhmm: string): Date {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) throw new Error("BAD_TIME");
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mi) || h > 23 || mi > 59) throw new Error("BAD_TIME");
  return new Date(Date.UTC(1970, 0, 1, h, mi, 0));
}

export async function listWeeklyMeetingsForOrganizer(organizerAccountId: bigint) {
  const wm = dbBusyWeeklyMeeting();
  if (!wm) return [];
  return wm
    .findMany({
      where: { group: { organizerAccountId } },
      orderBy: [{ meetingDate: "desc" }, { startTime: "desc" }],
      take: 80,
      include: { group: true, _count: { select: { registrations: true } } },
    })
    .catch(() => []);
}

export async function getWeeklyMeetingWithRegistrations(meetingId: bigint) {
  return prisma.busyWeeklyMeeting
    .findUnique({
      where: { id: meetingId },
      include: { group: true, registrations: { orderBy: { createdAt: "asc" } } },
    })
    .catch(() => null);
}

export async function assertCanManageMeeting(accountId: bigint, organizerAccountId: bigint): Promise<void> {
  const ok = await accountCanManageWeeklyMeeting(accountId, organizerAccountId);
  if (!ok) {
    const err = new Error("FORBIDDEN");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}

export async function createWeeklyMeetingForAccount(
  accountId: bigint,
  input: CreateWeeklyMeetingInput,
): Promise<{ meetingId: bigint; publicToken: string }> {
  await ensureBusyRbacSeed();

  const groupName = input.groupName.trim();
  if (groupName.length < 2) throw new Error("GROUP_NAME");

  const anyRegChannel =
    (input.enableMemberRegistration ?? false) ||
    (input.enableGuestRegistration ?? false) ||
    (input.enableSubstituteRegistration ?? false);
  if (!anyRegChannel) throw new Error("NO_REG_CHANNEL");

  const meetingDate = parseYmdToUtcDate(input.meetingDateYmd);
  const startTime = parseHhMmToTime(input.startTimeHhMm);
  const endTime = input.endTimeHhMm?.trim() ? parseHhMmToTime(input.endTimeHhMm) : null;

  const fee =
    input.feeMnt === null || input.feeMnt === undefined || Number.isNaN(Number(input.feeMnt))
      ? null
      : Number(input.feeMnt);

  const publicToken = createWeeklyMeetingPublicToken();

  const meeting = await prisma.$transaction(async (tx) => {
    const group = await tx.busyMeetingGroup.create({
      data: { organizerAccountId: accountId, name: groupName },
    });
    const m = await tx.busyWeeklyMeeting.create({
      data: {
        groupId: group.id,
        publicToken,
        meetingDate,
        startTime,
        endTime,
        location: input.location?.trim() || null,
        feeMnt: fee,
        enableMemberRegistration: input.enableMemberRegistration ?? true,
        enableGuestRegistration: input.enableGuestRegistration ?? true,
        enableSubstituteRegistration: input.enableSubstituteRegistration ?? true,
        enableShortIntroduction: input.enableShortIntroduction ?? true,
        enablePaymentTracking: input.enablePaymentTracking ?? true,
      },
    });
    await tx.busyAuditLog.create({
      data: {
        actorAccountId: accountId,
        action: "weekly_meeting.create",
        subjectType: "busy_weekly_meeting",
        subjectId: m.id.toString(),
        metadata: { groupId: group.id.toString(), publicToken },
      },
    });
    return m;
  });

  return { meetingId: meeting.id, publicToken: meeting.publicToken };
}

export async function registerParticipantPublic(input: PublicRegisterMeetingInput): Promise<void> {
  const token = input.token.trim();
  if (!token) throw new Error("TOKEN");

  const meeting = await prisma.busyWeeklyMeeting.findUnique({
    where: { publicToken: token },
    include: { group: true },
  });
  if (!meeting) throw new Error("NOT_FOUND");

  const t = input.participantType;
  if (t === "member" && !meeting.enableMemberRegistration) throw new Error("TYPE_DISABLED");
  if (t === "guest" && !meeting.enableGuestRegistration) throw new Error("TYPE_DISABLED");
  if (t === "substitute" && !meeting.enableSubstituteRegistration) throw new Error("TYPE_DISABLED");

  const displayName = input.displayName.trim();
  if (displayName.length < 2) throw new Error("NAME");

  if (meeting.enableShortIntroduction) {
    const intro = input.shortIntroduction?.trim() ?? "";
    if (intro.length > 4000) throw new Error("INTRO_TOO_LONG");
  }

  await prisma.busyMeetingRegistration.create({
    data: {
      weeklyMeetingId: meeting.id,
      participantType: t,
      displayName,
      companyName: input.companyName?.trim() || null,
      position: input.position?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      invitedBy: input.invitedBy?.trim() || null,
      businessCategory: input.businessCategory?.trim() || null,
      shortIntroduction: meeting.enableShortIntroduction ? input.shortIntroduction?.trim() || null : null,
      paymentStatus: BusyMeetingPaymentStatus.unpaid,
      attendanceStatus: BusyMeetingAttendanceStatus.unknown,
    },
  });

  await prisma.busyAuditLog.create({
    data: {
      actorAccountId: null,
      action: "weekly_meeting.public_register",
      subjectType: "busy_weekly_meeting",
      subjectId: meeting.id.toString(),
      metadata: { participantType: t },
    },
  });
}

export async function patchRegistrationStaff(
  actorAccountId: bigint,
  registrationId: bigint,
  patch: { paymentStatus?: BusyMeetingPaymentStatus; attendanceStatus?: BusyMeetingAttendanceStatus },
  opts?: { weeklyMeetingId?: bigint },
): Promise<void> {
  const reg = await prisma.busyMeetingRegistration.findUnique({
    where: { id: registrationId },
    include: { meeting: { include: { group: true } } },
  });
  if (!reg) throw new Error("NOT_FOUND");
  if (opts?.weeklyMeetingId !== undefined && reg.weeklyMeetingId !== opts.weeklyMeetingId) {
    throw new Error("NOT_FOUND");
  }

  await assertCanManageMeeting(actorAccountId, reg.meeting.group.organizerAccountId);

  await prisma.busyMeetingRegistration.update({
    where: { id: registrationId },
    data: {
      ...(patch.paymentStatus ? { paymentStatus: patch.paymentStatus } : {}),
      ...(patch.attendanceStatus ? { attendanceStatus: patch.attendanceStatus } : {}),
    },
  });

  await prisma.busyAuditLog.create({
    data: {
      actorAccountId,
      action: "weekly_meeting.registration_staff_update",
      subjectType: "busy_meeting_registration",
      subjectId: registrationId.toString(),
      metadata: { paymentStatus: patch.paymentStatus, attendanceStatus: patch.attendanceStatus },
    },
  });
}

/** CSV download + roster export row + audit (shared by legacy and `/api/meetings/weekly/.../roster`). */
export async function getRosterCsvNextResponse(
  meetingId: bigint,
  actorAccountId: bigint,
  auditVia: string,
): Promise<NextResponse> {
  const meeting = await getWeeklyMeetingWithRegistrations(meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    await assertCanManageMeeting(actorAccountId, meeting.group.organizerAccountId);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const csv = buildMeetingRosterCsv({
    group: meeting.group,
    meeting,
    registrations: meeting.registrations,
  });

  await prisma.busyMeetingRosterExport.create({
    data: {
      weeklyMeetingId: meeting.id,
      format: "csv",
      rowCount: meeting.registrations.length,
      createdByAccountId: actorAccountId,
    },
  });

  await prisma.busyAuditLog.create({
    data: {
      actorAccountId,
      action: "weekly_meeting.roster_export",
      subjectType: "busy_weekly_meeting",
      subjectId: meeting.id.toString(),
      metadata: { format: "csv", via: auditVia },
    },
  });

  const filename = `busy-roster-${meeting.publicToken}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": buildContentDispositionAttachment(filename),
      "Cache-Control": "no-store",
    },
  });
}
