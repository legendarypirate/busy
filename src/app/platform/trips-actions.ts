"use server";

import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlatformSessionForAction } from "@/lib/platform-session";
import { setPlatformSessionCookies } from "@/lib/platform-session-cookies";
import { executeSaveTrip } from "@/lib/platform-trip-save-core";
import { dbBusinessTrip } from "@/lib/prisma";

async function requireTripSession(formData: FormData) {
  const resolved = await getPlatformSessionForAction(formData);
  if (!resolved) {
    redirect("/auth/login?next=/platform/trips");
  }
  if (!resolved.fromCookie) {
    await setPlatformSessionCookies(resolved.user.id, resolved.user.displayName);
  }
  return resolved.user;
}

export async function saveTripAction(formData: FormData): Promise<void> {
  await connection();
  const session = await requireTripSession(formData);

  const result = await executeSaveTrip(session.id, formData);
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  redirect("/platform/trips");
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  await connection();
  const session = await requireTripSession(formData);

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
  const session = await requireTripSession(formData);

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
