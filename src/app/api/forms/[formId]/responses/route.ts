import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { answersForOrganizerApi } from "@/lib/trip-registration-form/answers-snapshot";
import { listTripFormResponses } from "@/lib/trip-registration-form/organizer";

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
    const rows = await listTripFormResponses(formId, user.id);
    return NextResponse.json({
      responses: rows.map((r) => ({
        id: r.id,
        submittedAt: r.submittedAt.toISOString(),
        status: r.status,
        paymentStatus: r.paymentStatus,
        internalNote: r.internalNote,
        orderSummary: r.orderSummary,
        hasParticipant: Boolean(r.participant),
        answers: answersForOrganizerApi({
          answersSnapshot: r.answersSnapshot,
          answers: r.answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
            fileUrl: a.fileUrl,
            question: a.question,
          })),
        }),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}
