import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { accountCanManageWeeklyMeeting } from "@/lib/busy-rbac";
import { getWeeklyMeetingWithRegistrations } from "@/lib/meetings/weekly-meeting-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  let meetingId: bigint;
  try {
    meetingId = BigInt(id);
  } catch {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  const meeting = await getWeeklyMeetingWithRegistrations(meetingId);
  if (!meeting) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const allowed = await accountCanManageWeeklyMeeting(user.id, meeting.group.organizerAccountId);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json({
    meeting: {
      id: meeting.id.toString(),
      publicToken: meeting.publicToken,
      meetingDate: meeting.meetingDate.toISOString(),
      startTime: meeting.startTime.toISOString(),
      endTime: meeting.endTime?.toISOString() ?? null,
      location: meeting.location,
      feeMnt: meeting.feeMnt,
      enableMemberRegistration: meeting.enableMemberRegistration,
      enableGuestRegistration: meeting.enableGuestRegistration,
      enableSubstituteRegistration: meeting.enableSubstituteRegistration,
      enableShortIntroduction: meeting.enableShortIntroduction,
      enablePaymentTracking: meeting.enablePaymentTracking,
      group: { id: meeting.group.id.toString(), name: meeting.group.name },
      registrations: meeting.registrations.map((r) => ({
        id: r.id.toString(),
        participantType: r.participantType,
        displayName: r.displayName,
        companyName: r.companyName,
        position: r.position,
        businessCategory: r.businessCategory,
        phone: r.phone,
        email: r.email,
        invitedBy: r.invitedBy,
        shortIntroduction: r.shortIntroduction,
        paymentStatus: r.paymentStatus,
        attendanceStatus: r.attendanceStatus,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  });
}
