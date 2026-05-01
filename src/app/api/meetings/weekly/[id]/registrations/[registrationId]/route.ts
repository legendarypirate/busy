import { BusyMeetingAttendanceStatus, BusyMeetingPaymentStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { patchRegistrationStaff } from "@/lib/meetings/weekly-meeting-service";

type Ctx = { params: Promise<{ id: string; registrationId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, registrationId } = await ctx.params;
  let meetingId: bigint;
  let regId: bigint;
  try {
    meetingId = BigInt(id);
    regId = BigInt(registrationId);
  } catch {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  let body: { paymentStatus?: BusyMeetingPaymentStatus; attendanceStatus?: BusyMeetingAttendanceStatus };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.paymentStatus && !body.attendanceStatus) {
    return NextResponse.json({ error: "empty_patch" }, { status: 400 });
  }

  try {
    await patchRegistrationStaff(user.id, regId, body, { weeklyMeetingId: meetingId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
