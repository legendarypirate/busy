import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { renderWeeklyMeetingQrPng } from "@/lib/meetings/weekly-meeting-qr";

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

  const out = await renderWeeklyMeetingQrPng(req, meetingId, user.id);
  if (!out.ok) {
    return NextResponse.json({ error: out.status === 404 ? "not_found" : "forbidden" }, { status: out.status });
  }

  return new Response(Buffer.from(out.body), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
