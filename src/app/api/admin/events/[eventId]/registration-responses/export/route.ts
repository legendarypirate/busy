import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { buildAdminEventRegistrationExportCsv } from "@/lib/trip-registration-form/organizer";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ eventId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

/** UTF-8 CSV (Excel) — all registration responses for this event (admin). */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(_req);
  if (!user || user.legacyRole !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { eventId: raw } = await ctx.params;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return NextResponse.json({ error: "bad_event_id" }, { status: 400 });
  }
  let eventId: bigint;
  try {
    eventId = BigInt(trimmed);
  } catch {
    return NextResponse.json({ error: "bad_event_id" }, { status: 400 });
  }

  try {
    const { filename, body } = await buildAdminEventRegistrationExportCsv(eventId);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}
