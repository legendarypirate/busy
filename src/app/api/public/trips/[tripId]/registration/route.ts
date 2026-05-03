import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import {
  getPublishedTripRegistrationDrawerSchema,
  submitPublicFormResponseByTripId,
} from "@/lib/trip-registration-form/service";
import {
  TripFormValidationError,
  type TripFormSubmitAnswer,
} from "@/lib/trip-registration-form/submit-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ tripId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

/** Legacy PHP shape: `{ success, schema }` for homepage trip drawer. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { tripId: raw } = await ctx.params;
    const tripId = Number.parseInt(raw, 10);
    if (!Number.isFinite(tripId) || tripId < 1) {
      return NextResponse.json({ success: false, message: "Буруу аяллын дугаар." }, { status: 400 });
    }

    const out = await getPublishedTripRegistrationDrawerSchema(tripId);
    if (!out.ok) {
      return NextResponse.json({ success: false, message: out.message }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      tripTitle: out.tripTitle,
      schema: out.schema,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа. Дахин оролдоно уу." },
      { status: 500 },
    );
  }
}

/** Submit answers for the published form on this trip (same storage as `/api/public/forms/.../responses`). */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { tripId: raw } = await ctx.params;
    const tripId = Number.parseInt(raw, 10);
    if (!Number.isFinite(tripId) || tripId < 1) {
      return NextResponse.json({ success: false, message: "Буруу аяллын дугаар." }, { status: 400 });
    }

    let body: { answers: TripFormSubmitAnswer[]; orderSummary?: unknown };
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
      await submitPublicFormResponseByTripId({
        tripId,
        answers: body.answers,
        submittedByUserId: user?.id ?? null,
        orderSummary: body.orderSummary,
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
              : msg === "INVALID_ORDER_SUMMARY" || msg === "ORDER_REQUIRES_TIERS" || msg === "INVALID_TIER"
                ? "order_summary"
                : msg === "STALE_PRICE"
                  ? "stale_price"
                  : msg === "CAPACITY_EXCEEDED"
                    ? "capacity"
                    : "submit_failed";
      const status = statusFromError(e);
      const friendly =
        code === "validation"
          ? "Заавал талбаруудыг бөглөж, зөв форматаар оруулна уу."
          : code === "not_found"
            ? "Нийтэд нээлттэй форм олдсонгүй."
            : code === "order_summary"
              ? "Захиалгын мэдээлэл буруу байна. Түвшин, тоо ширхэгийг дахин сонгоно уу."
              : code === "stale_price"
                ? "Үнэ шинэчлэгдсэн байна. Хуудсыг дахин ачаалаад сонголтоо шинэчилнэ үү."
                : code === "capacity"
                  ? "Суудлын хязгаараас хэтэрсэн тоо сонгосон байна."
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
