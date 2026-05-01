import { NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { canAccountCreateWeeklyMeeting } from "@/lib/busy-rbac";
import { createWeeklyMeetingForAccount, listWeeklyMeetingsForOrganizer } from "@/lib/meetings/weekly-meeting-service";
import type { CreateWeeklyMeetingInput } from "@/lib/meetings/weekly-meeting-types";

export async function GET(req: NextRequest) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const list = await listWeeklyMeetingsForOrganizer(user.id);
  return NextResponse.json({
    meetings: list.map((m) => ({
      id: m.id.toString(),
      publicToken: m.publicToken,
      groupName: m.group.name,
      meetingDate: m.meetingDate.toISOString(),
      startTime: m.startTime.toISOString(),
      endTime: m.endTime?.toISOString() ?? null,
      location: m.location,
      registrationCount: m._count.registrations,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccountCreateWeeklyMeeting(user.legacyRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: CreateWeeklyMeetingInput;
  try {
    body = (await req.json()) as CreateWeeklyMeetingInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const created = await createWeeklyMeetingForAccount(user.id, body);
    return NextResponse.json({
      ok: true,
      meetingId: created.meetingId.toString(),
      publicToken: created.publicToken,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
