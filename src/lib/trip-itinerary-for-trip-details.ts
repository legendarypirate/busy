import type { TripItineraryDay, TripItineraryItem } from "@/components/trip-details/TripItineraryAccordion";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";

type BuilderSlot = { time: string; title: string; description: string; category: string };
type BuilderDay = { day: number; title: string; banner: string; slots: BuilderSlot[] };

function parseItineraryJson(raw: unknown): BuilderDay[] | null {
  let v: unknown = raw;
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    try {
      v = JSON.parse(t) as unknown;
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== "object") return null;
  const days = (v as { days?: unknown }).days;
  if (!Array.isArray(days) || days.length === 0) return null;

  const out: BuilderDay[] = [];
  for (const row of days) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const day = Math.max(1, Number(r.day ?? out.length + 1) || 1);
    const title = String(r.title ?? `${day}-р өдөр`).trim() || `${day}-р өдөр`;
    const banner = String(r.banner ?? "").trim();
    const slotsRaw = Array.isArray(r.slots) ? r.slots : [];
    const slots: BuilderSlot[] = slotsRaw
      .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
      .map((s) => ({
        time: String(s.time ?? "").trim(),
        title: String(s.title ?? "").trim(),
        description: String(s.description ?? "").trim(),
        category: String(s.category ?? "").trim(),
      }));
    out.push({
      day,
      title,
      banner,
      slots: slots.length > 0 ? slots : [{ time: "", title: "", description: "", category: "" }],
    });
  }
  return out.length > 0 ? out.sort((a, b) => a.day - b.day) : null;
}

function slotToAccordionItem(s: BuilderSlot, destination: string): TripItineraryItem | null {
  const time = (s.time || "").trim();
  const rawTitle = (s.title || "").trim();
  const rawDesc = (s.description || "").trim();
  const cat = (s.category || "").trim();
  const title = rawTitle || cat;
  let description = rawDesc;
  if (cat && rawTitle && rawDesc && !rawDesc.includes(cat)) {
    description = `${cat}\n${rawDesc}`;
  } else if (cat && !rawTitle) {
    description = rawDesc || cat;
  }
  if (!title && !description) {
    if (time) {
      return { time, end_time: "", title: "—", description: destination || "Хөтөлбөр", highlight: "" };
    }
    return null;
  }
  return {
    time: time || "—",
    end_time: "",
    title: title || "—",
    description,
    highlight: "",
  };
}

/**
 * Maps admin `TripItineraryBuilder` JSON (`{ days: [{ day, title, banner, slots }] }`)
 * to `TripItineraryAccordion` props. Returns `null` when there is nothing to show.
 */
export function buildTripItineraryAccordionDays(
  itineraryJson: unknown,
  tripStart: Date,
  destination: string,
): TripItineraryDay[] | null {
  const builderDays = parseItineraryJson(itineraryJson);
  if (!builderDays) return null;

  return builderDays.map((d) => {
    const dDt = new Date(tripStart);
    dDt.setDate(dDt.getDate() + (d.day - 1));
    const dateStr = dDt.toISOString().split("T")[0];
    const dateDisplay = formatMnDate(dDt).replace(/-/g, ".");
    const bannerRel = d.banner.trim();
    const banner_image = bannerRel ? (mediaUrl(bannerRel) || bannerRel) : "";

    const items: TripItineraryItem[] = [];
    for (const slot of d.slots) {
      const it = slotToAccordionItem(slot, destination);
      if (it) items.push(it);
    }
    if (items.length === 0) {
      items.push({
        time: "",
        end_time: "",
        title: "Хөтөлбөр",
        description: (destination ? `${destination} · ` : "") + dateDisplay,
        highlight: "",
      });
    }

    return {
      id: `trd-it-${d.day}`,
      label: d.title,
      date: dateStr,
      dateDisplay,
      heading: "",
      banner_image,
      items,
    };
  });
}
