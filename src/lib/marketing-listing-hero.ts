import { getSiteSetting } from "@/lib/site-settings";
import {
  MARKETING_EVENTS_HERO_SLIDES_KEY,
  MARKETING_TRIPS_HERO_SLIDES_KEY,
  parseHeroSlidesJson,
} from "@/lib/marketing-listing-hero-shared";

export {
  MARKETING_EVENTS_HERO_SLIDES_KEY,
  MARKETING_TRIPS_HERO_SLIDES_KEY,
  parseHeroSlidesJson,
  parseSlideUrlsFromMultiline,
  serializeHeroSlidesForStorage,
  slidesToTextareaLines,
} from "@/lib/marketing-listing-hero-shared";

export async function getMarketingListingHeroSlides(which: "trips" | "events"): Promise<string[]> {
  const key = which === "trips" ? MARKETING_TRIPS_HERO_SLIDES_KEY : MARKETING_EVENTS_HERO_SLIDES_KEY;
  const raw = await getSiteSetting(key);
  return parseHeroSlidesJson(raw);
}
