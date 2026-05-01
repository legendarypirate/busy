import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { getRosterCsvNextResponse } from "@/lib/meetings/weekly-meeting-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  let meetingId: bigint;
  try {
    meetingId = BigInt(id);
  } catch {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  return getRosterCsvNextResponse(meetingId, user.id, "api_weekly_meetings_roster");
}
