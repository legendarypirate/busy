import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { legacyRoleAllowsTripAdminApi } from "@/lib/admin-access";
import { buildAdminTripRegistrationExportCsv } from "@/lib/trip-registration-form/organizer";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ tripId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

/** UTF-8 CSV (Excel) — all registration responses for this trip (admin). */
export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user || !legacyRoleAllowsTripAdminApi(user.legacyRole)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { tripId: raw } = await ctx.params;
  const tripId = Math.max(0, Number.parseInt(raw.trim(), 10));
  if (!Number.isFinite(tripId) || tripId < 1) {
    return NextResponse.json({ error: "bad_trip_id" }, { status: 400 });
  }

  try {
    const { filename, body } = await buildAdminTripRegistrationExportCsv(tripId);
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
