import { type NextRequest, NextResponse } from "next/server";
import type { TripFormQuestionType } from "@prisma/client";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { deleteTripFormQuestion, patchTripFormQuestion } from "@/lib/trip-registration-form/organizer";

type Ctx = { params: Promise<{ questionId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { questionId } = await ctx.params;
  let body: {
    label?: string;
    description?: string | null;
    placeholder?: string | null;
    isRequired?: boolean;
    type?: TripFormQuestionType;
    options?: { label: string; value: string }[] | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    await patchTripFormQuestion(questionId, user.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: statusFromError(e) });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { questionId } = await ctx.params;
  try {
    await deleteTripFormQuestion(questionId, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}
