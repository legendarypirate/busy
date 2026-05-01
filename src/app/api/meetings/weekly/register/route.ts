import { type NextRequest, NextResponse } from "next/server";
import { registerParticipantPublic } from "@/lib/meetings/weekly-meeting-service";
import type { PublicRegisterMeetingInput } from "@/lib/meetings/weekly-meeting-types";

export async function POST(req: NextRequest) {
  let body: PublicRegisterMeetingInput;
  try {
    body = (await req.json()) as PublicRegisterMeetingInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    await registerParticipantPublic(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    const status = msg === "NOT_FOUND" ? 404 : msg === "TYPE_DISABLED" || msg === "NAME" || msg === "INTRO_TOO_LONG" ? 400 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
