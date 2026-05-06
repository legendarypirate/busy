import type { BusinessTrip } from "@prisma/client";

export const DEFAULT_TRIP_COVER =
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop";

export function fmtMoney(mnt: unknown): string {
  if (mnt == null || mnt === "") {
    return "₮0";
  }
  const n = Number(mnt);
  if (!Number.isFinite(n)) {
    return "₮0";
  }
  return `₮${Math.round(n).toLocaleString("mn-MN")}`;
}

export function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) {
    return v[0];
  }
  return v;
}

export function parseHeroSlides(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) {
      return [];
    }
    return j.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/** Stored in `business_trips.extras_json` → `booking_tiers` (admin-configurable). */
export type TripExtrasBookingTier = {
  id: string;
  label: string;
  subtitle: string;
  price_mnt: number;
};

export type TripExtrasFaq = {
  question: string;
  answer: string;
};

export type TripExtrasPaymentStep = {
  title: string;
  note: string;
};

function readBookingTiers(raw: unknown): TripExtrasBookingTier[] {
  if (!Array.isArray(raw)) return [];
  const out: TripExtrasBookingTier[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const label = String(r.label ?? "").trim();
    const priceRaw = r.price_mnt ?? r.priceMnt;
    const price_mnt = Math.max(0, Math.round(Number(priceRaw ?? 0)) || 0);
    if (!label) continue;
    const idRaw = String(r.id ?? "").trim();
    const id = idRaw || `tier_${i}`;
    out.push({
      id,
      label,
      subtitle: String(r.subtitle ?? "").trim(),
      price_mnt,
    });
  }
  return out;
}

function readStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const row of raw) {
    const line = String(row ?? "").trim();
    if (line) out.push(line);
  }
  return out;
}

function readFaqList(raw: unknown): TripExtrasFaq[] {
  if (!Array.isArray(raw)) return [];
  const out: TripExtrasFaq[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const question = String(r.question ?? "").trim();
    const answer = String(r.answer ?? "").trim();
    if (!question || !answer) continue;
    out.push({ question, answer });
  }
  return out;
}

function readPaymentStepList(raw: unknown): TripExtrasPaymentStep[] {
  if (!Array.isArray(raw)) return [];
  const out: TripExtrasPaymentStep[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? "").trim();
    const note = String(r.note ?? "").trim();
    if (!title) continue;
    out.push({ title, note });
  }
  return out;
}

export function readExtras(raw: unknown): {
  short_description: string;
  location: string;
  total_seats: number;
  advance_percent: number;
  booking_tiers: TripExtrasBookingTier[];
  booking_status_note: string;
  /** Full-width hero on `/trip-details/:id` (Cloudinary URL). */
  trip_details_hero_url: string;
  /** Shown on `/trip-details/:id` help card; callable trip manager (admin). */
  trip_manager_phone: string;
  /** Help card email; empty → site default on public page. */
  trip_help_email: string;
  /** Help card «Онлайн чат» href (https…, /path, #anchor); empty → tile disabled. */
  trip_help_chat_url: string;
  /** YYYY-MM-DD; shown on public trip-details; empty → hidden. */
  trip_registration_close_date: string;
  /** Included list for `/trip-details/:id` comparison section. */
  trip_included_items: string[];
  /** Excluded list for `/trip-details/:id` comparison section. */
  trip_excluded_items: string[];
  /** Reminder lines shown in trip details page. */
  trip_notes: string[];
  /** Rich reminder content shown in trip details page. */
  trip_notes_html: string;
  /** FAQ rows shown in trip details page. */
  trip_faqs: TripExtrasFaq[];
  /** Payment steps shown in trip details page. */
  trip_payment_steps: TripExtrasPaymentStep[];
} {
  const d = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    short_description: String(d.short_description ?? ""),
    location: String(d.location ?? ""),
    total_seats: Math.max(1, Number(d.total_seats ?? 30) || 30),
    advance_percent: Math.max(0, Number(d.advance_percent ?? 20) || 20),
    booking_tiers: readBookingTiers(d.booking_tiers),
    booking_status_note: String(d.booking_status_note ?? "").trim(),
    trip_details_hero_url: String(d.trip_details_hero_url ?? "").trim(),
    trip_manager_phone: String(d.trip_manager_phone ?? "").trim(),
    trip_help_email: String(d.trip_help_email ?? "").trim(),
    trip_help_chat_url: String(d.trip_help_chat_url ?? "").trim(),
    trip_registration_close_date: String(d.trip_registration_close_date ?? "").trim(),
    trip_included_items: readStringList(d.trip_included_items),
    trip_excluded_items: readStringList(d.trip_excluded_items),
    trip_notes: readStringList(d.trip_notes),
    trip_notes_html: String(d.trip_notes_html ?? "").trim(),
    trip_faqs: readFaqList(d.trip_faqs),
    trip_payment_steps: readPaymentStepList(d.trip_payment_steps),
  };
}

/** Default rows in admin when `booking_tiers` is still empty (BNI-style). */
export function defaultEditorBookingTiers(basePriceMnt: number): TripExtrasBookingTier[] {
  const base = Math.max(0, Math.round(basePriceMnt)) || 4_590_000;
  return [
    { id: "bni_member", label: "BNI гишүүн", subtitle: "", price_mnt: base },
    { id: "non_member", label: "Гишүүн биш", subtitle: "", price_mnt: base + 300_000 },
  ];
}

export function tripDaySpan(start: Date, end: Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) {
    return 0;
  }
  return Math.floor((e - s) / (24 * 60 * 60 * 1000)) + 1;
}

export function toInputDate(d: Date): string {
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function errorBanner(code: string | undefined): string | null {
  if (!code) {
    return null;
  }
  if (code === "missing") {
    return "Чиглэл болон огноогоор бөглөнө үү.";
  }
  if (code === "dates") {
    return "Дуусах огноо эхлэхээс өмнө байж болохгүй.";
  }
  if (code === "notfound") {
    return "Аялал олдсонгүй.";
  }
  if (code === "featured_limit") {
    return "Онцлох аялал дээд тал нь 3 байна. Нэгийг нь буулгаад дахин оролдоно уу.";
  }
  return null;
}

export function extrasFromTrip(editTrip: BusinessTrip | null) {
  return readExtras(editTrip?.extrasJson ?? undefined);
}
