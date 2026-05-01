import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { submitPublicFormResponse } from "@/lib/trip-registration-form/service";

type Ctx = { params: Promise<{ publicSlug: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { publicSlug } = await ctx.params;
  let body: { answers: { questionId: string; value: string | null; fileUrl?: string | null }[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!Array.isArray(body.answers)) {
    return NextResponse.json({ error: "invalid_answers" }, { status: 400 });
  }

  const user = await getApiPlatformUser(req);

  try {
    const out = await submitPublicFormResponse({
      publicSlug,
      answers: body.answers,
      submittedByUserId: user?.id ?? null,
    });
    return NextResponse.json({ ok: true, responseId: out.responseId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const code =
      msg === "UNKNOWN_QUESTION" ? "unknown_question" : msg === "VALIDATION" ? "validation" : "submit_failed";
    return NextResponse.json({ error: code }, { status: statusFromError(e) });
  }
}
