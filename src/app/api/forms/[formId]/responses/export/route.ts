import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { buildTripFormResponsesCsv } from "@/lib/trip-registration-form/organizer";
import { buildContentDispositionAttachment } from "@/lib/http/content-disposition";

type Ctx = { params: Promise<{ formId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { formId } = await ctx.params;
  try {
    const { filename, body } = await buildTripFormResponsesCsv(formId, user.id);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": buildContentDispositionAttachment(filename),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[trip form responses export] failed", e);
    return NextResponse.json(
      { error: "failed", message: e instanceof Error ? e.message : String(e) },
      { status: statusFromError(e) },
    );
  }
}
