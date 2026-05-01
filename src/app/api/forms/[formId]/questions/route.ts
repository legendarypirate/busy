import { type NextRequest, NextResponse } from "next/server";
import type { TripFormQuestionType } from "@prisma/client";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { addTripFormQuestion } from "@/lib/trip-registration-form/organizer";

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
  let body: {
    type: TripFormQuestionType;
    label: string;
    description?: string | null;
    placeholder?: string | null;
    isRequired?: boolean;
    options?: { label: string; value: string }[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const q = await addTripFormQuestion(formId, user.id, body);
    return NextResponse.json({ ok: true, questionId: q.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: statusFromError(e) });
  }
}
