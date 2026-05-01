"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  BusyMeetingAttendanceStatus,
  BusyMeetingPaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { accountCanManageWeeklyMeeting, canAccountCreateWeeklyMeeting } from "@/lib/busy-rbac";
import {
  createWeeklyMeetingForAccount,
  patchRegistrationStaff,
  registerParticipantPublic,
} from "@/lib/meetings/weekly-meeting-service";
import type { CreateWeeklyMeetingInput, PublicRegisterMeetingInput } from "@/lib/meetings/weekly-meeting-types";

export type { CreateWeeklyMeetingInput, PublicRegisterMeetingInput } from "@/lib/meetings/weekly-meeting-types";

function parseAccountId(raw: string | undefined): bigint | null {
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

async function requireAccountIdFromCookie(): Promise<bigint> {
  const jar = await cookies();
  const id = parseAccountId(jar.get("bni_platform_account_id")?.value);
  if (!id) throw new Error("UNAUTHORIZED");
  const acc = await prisma.platformAccount.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!acc || acc.status !== "active") throw new Error("UNAUTHORIZED");
  return id;
}

export async function createWeeklyMeetingAction(
  input: CreateWeeklyMeetingInput,
): Promise<{ ok: true; meetingId: string; publicToken: string } | { ok: false; error: string }> {
  try {
    const accountId = await requireAccountIdFromCookie();

    const acc = await prisma.platformAccount.findUnique({ where: { id: accountId }, select: { role: true } });
    if (!acc || !canAccountCreateWeeklyMeeting(acc.role)) {
      return { ok: false, error: "FORBIDDEN" };
    }

    const created = await createWeeklyMeetingForAccount(accountId, input);
    revalidatePath("/dashboard/weekly-meetings");
    return { ok: true, meetingId: created.meetingId.toString(), publicToken: created.publicToken };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "UNAUTHORIZED") return { ok: false, error: "UNAUTHORIZED" };
    return { ok: false, error: msg };
  }
}

export async function updateRegistrationStaffFieldsAction(input: {
  registrationId: string;
  weeklyMeetingId?: string;
  paymentStatus?: BusyMeetingPaymentStatus;
  attendanceStatus?: BusyMeetingAttendanceStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const accountId = await requireAccountIdFromCookie();
    const regId = BigInt(input.registrationId);
    let meetingId: bigint | undefined;
    if (input.weeklyMeetingId?.trim()) {
      try {
        meetingId = BigInt(input.weeklyMeetingId.trim());
      } catch {
        return { ok: false, error: "BAD_MEETING_ID" };
      }
    }
    await patchRegistrationStaff(
      accountId,
      regId,
      {
        paymentStatus: input.paymentStatus,
        attendanceStatus: input.attendanceStatus,
      },
      meetingId !== undefined ? { weeklyMeetingId: meetingId } : undefined,
    );

    if (meetingId !== undefined) {
      revalidatePath(`/dashboard/weekly-meetings/${meetingId.toString()}`);
    } else {
      const reg = await prisma.busyMeetingRegistration.findUnique({
        where: { id: regId },
        select: { weeklyMeetingId: true },
      });
      if (reg) revalidatePath(`/dashboard/weekly-meetings/${reg.weeklyMeetingId.toString()}`);
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "NOT_FOUND") return { ok: false, error: "NOT_FOUND" };
    if (msg === "FORBIDDEN") return { ok: false, error: "FORBIDDEN" };
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function publicRegisterForWeeklyMeetingAction(
  input: PublicRegisterMeetingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await registerParticipantPublic(input);
    const token = input.token.trim();
    revalidatePath(`/m/${token}`);
    const meeting = await prisma.busyWeeklyMeeting.findUnique({
      where: { publicToken: token },
      select: { id: true },
    });
    if (meeting) revalidatePath(`/dashboard/weekly-meetings/${meeting.id.toString()}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    return { ok: false, error: msg };
  }
}

export async function logRosterExportAction(input: {
  meetingId: string;
  format: string;
  rowCount: number;
}): Promise<void> {
  try {
    const accountId = await requireAccountIdFromCookie();
    const meetingId = BigInt(input.meetingId);
    const meeting = await prisma.busyWeeklyMeeting.findUnique({
      where: { id: meetingId },
      include: { group: true },
    });
    if (!meeting) return;
    const allowed = await accountCanManageWeeklyMeeting(accountId, meeting.group.organizerAccountId);
    if (!allowed) return;

    await prisma.busyMeetingRosterExport.create({
      data: {
        weeklyMeetingId: meeting.id,
        format: input.format,
        rowCount: input.rowCount,
        createdByAccountId: accountId,
      },
    });
    await prisma.busyAuditLog.create({
      data: {
        actorAccountId: accountId,
        action: "weekly_meeting.roster_export",
        subjectType: "busy_weekly_meeting",
        subjectId: meeting.id.toString(),
        metadata: { format: input.format, rowCount: input.rowCount },
      },
    });
  } catch {
    /* noop */
  }
}
