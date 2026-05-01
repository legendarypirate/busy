import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { reorderTripFormQuestions } from "@/lib/trip-registration-form/organizer";

type Ctx = { params: Promise<{ formId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { formId } = await ctx.params;
  let body: { orderedQuestionIds: string[] };
  try {
    body = (await req.json()) as { orderedQuestionIds: string[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!Array.isArray(body.orderedQuestionIds)) {
    return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  }

  try {
    await reorderTripFormQuestions(formId, user.id, body.orderedQuestionIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: statusFromError(e) });
  }
}
