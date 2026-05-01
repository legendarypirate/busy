import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { setTripFormPublished } from "@/lib/trip-registration-form/organizer";

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
  let body: { isPublished?: boolean };
  try {
    body = (await req.json()) as { isPublished?: boolean };
  } catch {
    body = {};
  }
  const isPublished = typeof body.isPublished === "boolean" ? body.isPublished : true;

  try {
    const form = await setTripFormPublished(formId, user.id, isPublished);
    return NextResponse.json({ ok: true, isPublished: form.isPublished });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}
