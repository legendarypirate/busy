import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { listTripFormsForOrganizer } from "@/lib/trip-registration-form/organizer";
import { createTripRegistrationFormWithDefaults } from "@/lib/trip-registration-form/service";

type Ctx = { params: Promise<{ tripId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId: raw } = await ctx.params;
  const tripId = Number.parseInt(raw, 10);
  if (!Number.isFinite(tripId)) return NextResponse.json({ error: "bad_trip_id" }, { status: 400 });

  try {
    const forms = await listTripFormsForOrganizer(tripId, user.id);
    return NextResponse.json({
      forms: forms.map((f) => ({
        id: f.id,
        title: f.title,
        publicSlug: f.publicSlug,
        isPublished: f.isPublished,
        updatedAt: f.updatedAt.toISOString(),
        responseCount: f._count.responses,
        questionCount: f._count.questions,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId: raw } = await ctx.params;
  const tripId = Number.parseInt(raw, 10);
  if (!Number.isFinite(tripId)) return NextResponse.json({ error: "bad_trip_id" }, { status: 400 });

  let body: { title?: string; description?: string | null };
  try {
    body = (await req.json()) as { title?: string; description?: string | null };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const created = await createTripRegistrationFormWithDefaults({
      tripId,
      title: body.title?.trim() || "Бүртгэлийн форм",
      description: body.description ?? null,
      actorAccountId: user.id,
    });
    return NextResponse.json({ ok: true, formId: created.formId, publicSlug: created.publicSlug });
  } catch (e) {
    const code = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: code }, { status: statusFromError(e) });
  }
}
