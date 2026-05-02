import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { assertTripEditableByAccount } from "@/lib/trip-registration-form/service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ tripId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

/**
 * Primary `TripRegistrationForm` for a trip (same ordering as sync: oldest first).
 * Used by trip editor QR / publish UI. Requires platform session + trip edit access.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(_req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { tripId: raw } = await ctx.params;
  const tripId = Number.parseInt(raw, 10);
  if (!Number.isFinite(tripId) || tripId < 1) {
    return NextResponse.json({ error: "invalid_trip" }, { status: 400 });
  }

  try {
    await assertTripEditableByAccount(tripId, user.id);
  } catch (e) {
    const st = statusFromError(e);
    if (st === 404) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      destination: true,
      startDate: true,
      endDate: true,
      statusLabel: true,
    },
  });
  if (!trip) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const form = await prisma.tripRegistrationForm.findFirst({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      publicSlug: true,
      isPublished: true,
      title: true,
    },
  });

  return NextResponse.json({
    trip: {
      id: trip.id,
      destination: trip.destination,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      statusLabel: trip.statusLabel,
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
