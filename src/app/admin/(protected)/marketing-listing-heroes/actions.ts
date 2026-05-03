"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-session";
import {
  MARKETING_EVENTS_HERO_SLIDES_KEY,
  MARKETING_TRIPS_HERO_SLIDES_KEY,
  parseSlideUrlsFromMultiline,
  serializeHeroSlidesForStorage,
} from "@/lib/marketing-listing-hero";
import { prisma } from "@/lib/prisma";

async function upsertSetting(name: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { settingName: name },
    create: { settingName: name, settingValue: value },
    update: { settingValue: value },
  });
}

export async function saveMarketingListingHeroSlidesAction(formData: FormData) {
  await requireAdminUser("/admin/marketing-listing-heroes");

  const tripsRaw = String(formData.get("trips_slides") ?? "");
  const eventsRaw = String(formData.get("events_slides") ?? "");
  const trips = parseSlideUrlsFromMultiline(tripsRaw);
  const events = parseSlideUrlsFromMultiline(eventsRaw);

  await upsertSetting(MARKETING_TRIPS_HERO_SLIDES_KEY, serializeHeroSlidesForStorage(trips));
  await upsertSetting(MARKETING_EVENTS_HERO_SLIDES_KEY, serializeHeroSlidesForStorage(events));

  revalidatePath("/trips");
  revalidatePath("/events");
  redirect("/admin/marketing-listing-heroes?saved=1");
}
