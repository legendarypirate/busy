import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import {
  deleteTripRegistrationForm,
  getTripFormForOrganizer,
  patchTripRegistrationForm,
} from "@/lib/trip-registration-form/organizer";

type Ctx = { params: Promise<{ formId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

function serializeForm(form: NonNullable<Awaited<ReturnType<typeof getTripFormForOrganizer>>>) {
  return {
    id: form.id,
    tripId: form.tripId,
    eventId: form.eventId != null ? form.eventId.toString() : null,
    title: form.title,
    description: form.description,
    publicSlug: form.publicSlug,
    isPublished: form.isPublished,
    settings: form.settings,
    updatedAt: form.updatedAt.toISOString(),
    trip: form.trip,
    questions: form.questions.map((q) => ({
      id: q.id,
      label: q.label,
      description: q.description,
      type: q.type,
      placeholder: q.placeholder,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      options: q.options.map((o) => ({ id: o.id, label: o.label, value: o.value, sortOrder: o.sortOrder })),
    })),
  };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { formId } = await ctx.params;
  try {
    const form = await getTripFormForOrganizer(formId, user.id);
    if (!form) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ form: serializeForm(form) });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { formId } = await ctx.params;
  let body: { title?: string; description?: string | null };
  try {
    body = (await req.json()) as { title?: string; description?: string | null };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    await patchTripRegistrationForm(formId, user.id, {
      title: body.title,
      description: body.description,
    });
    const form = await getTripFormForOrganizer(formId, user.id);
    if (!form) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, form: serializeForm(form) });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { formId } = await ctx.params;
  try {
    await deleteTripRegistrationForm(formId, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}
