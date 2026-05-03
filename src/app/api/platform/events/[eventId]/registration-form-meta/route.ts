import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { assertEventFormEditableByAccount } from "@/lib/trip-registration-form/service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ eventId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

/** Primary `TripRegistrationForm` for an event (same ordering as sync: oldest first). */
export async function GET(request: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { eventId: raw } = await ctx.params;
  let eventId: bigint;
  try {
    eventId = BigInt(raw.trim() === "" ? "0" : raw);
  } catch {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }
  if (eventId < BigInt(1)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  const ev = await prisma.bniEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true },
  });
  if (!ev) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    await assertEventFormEditableByAccount(eventId, user.id);
  } catch (e) {
    const st = statusFromError(e);
    if (st === 404) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await prisma.tripRegistrationForm.findFirst({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      publicSlug: true,
      isPublished: true,
      title: true,
    },
  });

  return NextResponse.json({
    event: {
      id: ev.id.toString(),
      title: ev.title?.trim() ?? "",
    },
    form: form
      ? {
          id: form.id,
          publicSlug: form.publicSlug,
          isPublished: form.isPublished,
          title: form.title,
        }
      : null,
  });
}
