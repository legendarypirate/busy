import { getSiteSetting } from "@/lib/site-settings";

/** `site_settings.setting_name` — JSON array of image URLs for `/trips` hero. */
export const MARKETING_TRIPS_HERO_SLIDES_KEY = "marketing_trips_hero_slides";
/** JSON array of image URLs for `/events` hero. */
export const MARKETING_EVENTS_HERO_SLIDES_KEY = "marketing_events_hero_slides";

export function parseSlideUrlsFromMultiline(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

export function parseHeroSlidesJson(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  try {
    const j = JSON.parse(t) as unknown;
    if (!Array.isArray(j)) return [];
    return j.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return parseSlideUrlsFromMultiline(t);
  }
}

export function serializeHeroSlidesForStorage(urls: string[]): string {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  return JSON.stringify(cleaned);
}

export function slidesToTextareaLines(urls: string[]): string {
  return urls.join("\n");
}

export async function getMarketingListingHeroSlides(which: "trips" | "events"): Promise<string[]> {
  const key = which === "trips" ? MARKETING_TRIPS_HERO_SLIDES_KEY : MARKETING_EVENTS_HERO_SLIDES_KEY;
  const raw = await getSiteSetting(key);
  return parseHeroSlidesJson(raw);
}
