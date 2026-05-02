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

export function readExtras(raw: unknown): {
  short_description: string;
  location: string;
  total_seats: number;
  advance_percent: number;
} {
  const d = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    short_description: String(d.short_description ?? ""),
    location: String(d.location ?? ""),
    total_seats: Math.max(1, Number(d.total_seats ?? 30) || 30),
    advance_percent: Math.max(0, Number(d.advance_percent ?? 20) || 20),
  };
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
