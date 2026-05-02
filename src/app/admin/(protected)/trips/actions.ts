"use server";

import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-session";
import { dbBusinessTrip } from "@/lib/prisma";

export async function adminDeleteTripAction(formData: FormData): Promise<void> {
  await connection();
  await requireAdminUser("/admin/trips");

  const tripId = Math.max(0, Number(String(formData.get("trip_id") ?? "0")));
  if (tripId < 1) {
    redirect("/admin/trips");
  }

  const trips = dbBusinessTrip();
  await trips.delete({ where: { id: tripId } }).catch(() => null);

  revalidatePath("/admin/trips");
  revalidatePath("/trips");
  revalidatePath("/platform/trips");
  redirect("/admin/trips");
}
