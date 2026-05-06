import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import {
  getPublishedEventRegistrationDrawerSchema,
  submitPublicFormResponseByEventId,
} from "@/lib/trip-registration-form/service";
import {
  TripFormValidationError,
  type TripFormSubmitAnswer,
} from "@/lib/trip-registration-form/submit-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ eventId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

/** Same response shape as trip registration (`tripTitle` + `schema`) for shared drawer UI. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { eventId: raw } = await ctx.params;
    let eventId: bigint;
    try {
      eventId = BigInt(raw);
    } catch {
      return NextResponse.json({ success: false, message: "Буруу эвентийн дугаар." }, { status: 400 });
    }
    if (eventId < BigInt(1)) {
      return NextResponse.json({ success: false, message: "Буруу эвентийн дугаар." }, { status: 400 });
    }

    const out = await getPublishedEventRegistrationDrawerSchema(eventId);
    if (!out.ok) {
      const notFoundEvent = out.message === "Эвент олдсонгүй.";
      return NextResponse.json(
        { success: false, message: out.message },
        { status: notFoundEvent ? 404 : 200 },
      );
    }
    return NextResponse.json({
      success: true,
      tripTitle: out.eventTitle,
      schema: out.schema,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа. Дахин оролдоно уу." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { eventId: raw } = await ctx.params;
    let eventId: bigint;
    try {
      eventId = BigInt(raw);
    } catch {
      return NextResponse.json({ success: false, message: "Буруу эвентийн дугаар." }, { status: 400 });
    }
    if (eventId < BigInt(1)) {
      return NextResponse.json({ success: false, message: "Буруу эвентийн дугаар." }, { status: 400 });
    }

    let body: { answers: TripFormSubmitAnswer[] };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ success: false, message: "JSON буруу байна." }, { status: 400 });
    }
    if (!Array.isArray(body.answers)) {
      return NextResponse.json({ success: false, message: "answers массив шаардлагатай." }, { status: 400 });
    }

    const user = await getApiPlatformUser(req);

    try {
      await submitPublicFormResponseByEventId({
        eventId,
        answers: body.answers,
        submittedByUserId: user?.id ?? null,
      });
      return NextResponse.json({ success: true, message: "Таны бүртгэлийг амжилттай хүлээн авлаа." });
    } catch (e) {
      if (e instanceof TripFormValidationError) {
        return NextResponse.json(
          {
            success: false,
            message: "Заавал талбаруудыг бөглөж, зөв форматаар оруулна уу.",
            code: "validation",
            validationCode: e.code,
            questionId: e.questionId ?? null,
            questionLabel: e.questionLabel ?? null,
          },
          { status: e.status },
        );
      }
      const msg = e instanceof Error ? e.message : "Алдаа";
      const code =
        msg === "UNKNOWN_QUESTION"
          ? "unknown_question"
          : msg === "VALIDATION"
            ? "validation"
            : msg === "NOT_FOUND"
              ? "not_found"
              : "submit_failed";
      const status = statusFromError(e);
      const friendly =
        code === "validation"
          ? "Заавал талбаруудыг бөглөж, зөв форматаар оруулна уу."
          : code === "not_found"
            ? "Нийтэд нээлттэй форм олдсонгүй."
            : "Бүртгэл хадгалах үед алдаа гарлаа. Дахин оролдоно уу.";
      return NextResponse.json({ success: false, message: friendly, code }, { status });
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа. Дахин оролдоно уу." },
      { status: 500 },
    );
  }
}
