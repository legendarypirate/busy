"use server";

import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type BusinessTrip } from "@prisma/client";
import { getPlatformSession } from "@/lib/platform-session";
import { writePlatformUploadImage } from "@/lib/platform-write-image";
import { dbBusinessTrip, prisma } from "@/lib/prisma";

/**
 * Stale Prisma bundles may omit Json fields on `businessTrip.create`/`update`.
 * Write JSON columns with SQL so Postgres still gets full payloads.
 */
async function persistBusinessTripJsonColumns(
  tripId: number,
  extras: Prisma.InputJsonValue,
  registration: Prisma.InputJsonValue | null,
  itinerary: Prisma.InputJsonValue | null,
): Promise<void> {
  const ex = JSON.stringify(extras);
  await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET extras_json = ${ex}::jsonb WHERE id = ${tripId}`);

  if (registration !== null) {
    const r = JSON.stringify(registration);
    await prisma.$executeRaw(
      Prisma.sql`UPDATE business_trips SET registration_form_json = ${r}::jsonb WHERE id = ${tripId}`,
    );
  } else {
    await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET registration_form_json = NULL WHERE id = ${tripId}`);
  }

  if (itinerary !== null) {
    const i = JSON.stringify(itinerary);
    await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET itinerary_json = ${i}::jsonb WHERE id = ${tripId}`);
  } else {
    await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET itinerary_json = NULL WHERE id = ${tripId}`);
  }
}

function parseDateOnly(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const d = new Date(`${t}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDecimal(raw: string): Prisma.Decimal | null {
  const t = raw.trim();
  if (t === "" || !Number.isFinite(Number(t))) {
    return null;
  }
  return new Prisma.Decimal(t);
}

function parseHeroUrls(existingRaw: string | null | undefined): string[] {
  if (!existingRaw?.trim()) {
    return [];
  }
  try {
    const j = JSON.parse(existingRaw) as unknown;
    if (!Array.isArray(j)) {
      return [];
    }
    return j.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseJsonRegistration(raw: string): Prisma.InputJsonValue | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v) && v.length > 0) {
      return v as Prisma.InputJsonValue;
    }
    return null;
  } catch {
    return null;
  }
}

function parseItinerary(raw: string): Prisma.InputJsonValue | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object" && Array.isArray((v as { days?: unknown }).days)) {
      return v as Prisma.InputJsonValue;
    }
    return null;
  } catch {
    return null;
  }
}

function buildExtrasPayload(
  shortDesc: string,
  tripLoc: string,
  totalSeats: number,
  advancePercent: number,
): Prisma.InputJsonValue {
  return {
    short_description: shortDesc.trim() || null,
    location: tripLoc.trim() || null,
    total_seats: Number.isFinite(totalSeats) ? totalSeats : 30,
    advance_percent: Number.isFinite(advancePercent) ? advancePercent : 20,
  };
}

export async function saveTripAction(formData: FormData): Promise<void> {
  await connection();
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/trips");
  }

  const tripId = Math.max(0, Number(String(formData.get("trip_id") ?? "0")));

  const destination = String(formData.get("trip_destination") ?? "").trim();
  const start = parseDateOnly(String(formData.get("trip_start_date") ?? ""));
  const end = parseDateOnly(String(formData.get("trip_end_date") ?? ""));
  const focus = String(formData.get("trip_focus") ?? "").trim() || null;
  const description = String(formData.get("trip_description") ?? "").trim() || null;
  const statusLabel = String(formData.get("trip_status_label") ?? "").trim() || null;

  const shortDesc = String(formData.get("trip_short_description") ?? "").trim();
  const tripLoc = String(formData.get("trip_location") ?? "").trim();
  const totalSeats = Math.max(0, Number(String(formData.get("trip_total_seats") ?? "30")) || 30);
  const advancePct = Math.max(0, Number(String(formData.get("trip_advance_percent") ?? "20")) || 20);

  const priceMnt = parseDecimal(String(formData.get("trip_price_mnt") ?? ""));
  const advanceOrderMnt = parseDecimal(String(formData.get("trip_advance_order_mnt") ?? ""));

  const seatsLabel = `${totalSeats} суудал`;

  const regRaw = String(formData.get("trip_registration_form_json") ?? "");
  const itineraryRaw = String(formData.get("trip_itinerary_json") ?? "");

  if (destination === "" || !start || !end) {
    redirect("/platform/trips?error=missing");
  }
  if (end < start) {
    redirect("/platform/trips?error=dates");
  }

  let existing: BusinessTrip | null = null;
  const trips = dbBusinessTrip();
  if (tripId > 0) {
    existing = await trips.findUnique({ where: { id: tripId } });
    if (!existing) {
      redirect("/platform/trips?error=notfound");
    }
  }

  let coverImageUrl = existing?.coverImageUrl?.trim() || null;
  const coverFile = formData.get("trip_cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const up = await writePlatformUploadImage(session.id, coverFile, 10 * 1024 * 1024);
    if (up.ok) {
      coverImageUrl = up.url;
    }
  }

  const keptSlides = formData
    .getAll("trip_existing_slides")
    .map((x) => String(x).trim())
    .filter(Boolean);

  let slides = [...keptSlides];

  const heroParts = formData.getAll("trip_hero_files");
  for (const part of heroParts) {
    if (part instanceof File && part.size > 0) {
      const up = await writePlatformUploadImage(session.id, part, 10 * 1024 * 1024);
      if (up.ok) {
        slides.push(up.url);
      }
    }
  }

  if (slides.length === 0 && existing?.heroSliderJson) {
    slides = parseHeroUrls(existing.heroSliderJson);
  }

  const heroSliderJson = slides.length > 0 ? JSON.stringify(slides) : null;

  const registrationParsed = parseJsonRegistration(regRaw);
  const itineraryParsed = parseItinerary(itineraryRaw);
  const tripExtras = buildExtrasPayload(shortDesc, tripLoc, totalSeats, advancePct);

  const common = {
    destination,
    startDate: start,
    endDate: end,
    focus,
    description,
    statusLabel,
    seatsLabel,
    priceMnt,
    advanceOrderMnt,
    coverImageUrl,
    heroSliderJson,
  };

  if (tripId > 0) {
    await trips.update({
      where: { id: tripId },
      data: {
        ...common,
        isFeatured: existing!.isFeatured,
      },
    });
    await persistBusinessTripJsonColumns(tripId, tripExtras, registrationParsed, itineraryParsed);
  } else {
    const created = await trips.create({
      data: {
        ...common,
        managerAccountId: null,
        isFeatured: 0,
      },
    });
    await persistBusinessTripJsonColumns(created.id, tripExtras, registrationParsed, itineraryParsed);
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  await connection();
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/trips");
  }

  const tripId = Math.max(0, Number(String(formData.get("trip_id") ?? "0")));
  if (tripId < 1) {
    redirect("/platform/trips");
  }

  const trips = dbBusinessTrip();
  await trips.delete({ where: { id: tripId } }).catch(() => null);

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}

export async function toggleTripFeaturedAction(formData: FormData): Promise<void> {
  await connection();
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/trips");
  }

  const tripId = Math.max(0, Number(String(formData.get("trip_id") ?? "0")));
  const makeFeatured = Number(String(formData.get("is_featured") ?? "0")) === 1;
  if (tripId < 1) {
    redirect("/platform/trips");
  }

  const trips = dbBusinessTrip();
  if (makeFeatured) {
    const featuredCount = await trips.count({
      where: { isFeatured: 1, NOT: { id: tripId } },
    });
    const row = await trips.findUnique({ where: { id: tripId } });
    if (row && row.isFeatured !== 1 && featuredCount >= 3) {
      redirect("/platform/trips?error=featured_limit");
    }
  }

  await trips.update({
    where: { id: tripId },
    data: { isFeatured: makeFeatured ? 1 : 0 },
  });

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}
