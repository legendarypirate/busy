import type { Prisma } from "@prisma/client";
import { readExtras } from "@/components/platform/trips/trip-editor-helpers";
import { prisma } from "@/lib/prisma";

export type TripRegistrationOrderSummaryLine = {
  tierId: string;
  label: string;
  qty: number;
  unitPriceMnt: number;
  lineTotalMnt: number;
};

/** Normalized payload stored on `TripFormResponse.orderSummary`. */
export type TripRegistrationOrderSummaryForDb = {
  departureIso: string;
  lines: TripRegistrationOrderSummaryLine[];
  totalPax: number;
  totalMnt: number;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function tierListForTrip(extrasJson: unknown, priceMnt: unknown) {
  const extras = readExtras(extrasJson);
  if (extras.booking_tiers.length > 0) return extras.booking_tiers;
  const base = Math.max(0, Math.round(Number(priceMnt ?? 0)) || 0) || 4_590_000;
  return [{ id: "standard", label: "1 хүн", subtitle: "", price_mnt: base }];
}

/**
 * Validates client checkout against DB tier prices and capacity.
 * @returns null if `raw` is undefined/null (home-page flow without checkout).
 */
export async function parseAndValidateOrderSummaryForTrip(
  tripId: number,
  raw: unknown,
): Promise<TripRegistrationOrderSummaryForDb | null> {
  if (raw === undefined || raw === null) return null;
  if (!isRecord(raw)) {
    const e = new Error("INVALID_ORDER_SUMMARY");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }

  const departureIso = String(raw.departureIso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureIso)) {
    const e = new Error("INVALID_ORDER_SUMMARY");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }

  const linesRaw = raw.lines;
  if (!Array.isArray(linesRaw)) {
    const e = new Error("INVALID_ORDER_SUMMARY");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }

  const lines: TripRegistrationOrderSummaryLine[] = [];
  for (const row of linesRaw) {
    if (!isRecord(row)) continue;
    const tierId = String(row.tierId ?? "").trim();
    const label = String(row.label ?? "").trim();
    const qty = Math.max(0, Math.round(Number(row.qty ?? 0)) || 0);
    const unitPriceMnt = Math.max(0, Math.round(Number(row.unitPriceMnt ?? 0)) || 0);
    const lineTotalMnt = Math.max(0, Math.round(Number(row.lineTotalMnt ?? 0)) || 0);
    if (qty === 0) continue;
    if (!tierId || lineTotalMnt !== qty * unitPriceMnt) {
      const e = new Error("INVALID_ORDER_SUMMARY");
      (e as Error & { status?: number }).status = 400;
      throw e;
    }
    lines.push({ tierId, label, qty, unitPriceMnt, lineTotalMnt });
  }

  const totalPax = Math.max(0, Math.round(Number(raw.totalPax ?? 0)) || 0);
  const totalMnt = Math.max(0, Math.round(Number(raw.totalMnt ?? 0)) || 0);
  const sumPax = lines.reduce((s, l) => s + l.qty, 0);
  const sumMnt = lines.reduce((s, l) => s + l.lineTotalMnt, 0);

  if (lines.length === 0 || totalPax < 1) {
    const e = new Error("ORDER_REQUIRES_TIERS");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }
  if (totalPax !== sumPax || totalMnt !== sumMnt) {
    const e = new Error("INVALID_ORDER_SUMMARY");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }

  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: { extrasJson: true, priceMnt: true },
  });
  if (!trip) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }

  const tiers = tierListForTrip(trip.extrasJson, trip.priceMnt);
  const tierById = new Map(tiers.map((t) => [t.id, t]));
  for (const l of lines) {
    const t = tierById.get(l.tierId);
    if (!t) {
      const e = new Error("INVALID_TIER");
      (e as Error & { status?: number }).status = 400;
      throw e;
    }
    if (t.price_mnt !== l.unitPriceMnt) {
      const e = new Error("STALE_PRICE");
      (e as Error & { status?: number }).status = 409;
      throw e;
    }
  }

  const extras = readExtras(trip.extrasJson);
  const cap = Math.max(1, Math.min(500, extras.total_seats));
  if (totalPax > cap) {
    const e = new Error("CAPACITY_EXCEEDED");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }

  return { departureIso, lines, totalPax, totalMnt };
}

export function formatOrderSummaryMn(raw: unknown): string {
  if (!isRecord(raw)) return "";
  const lines = raw.lines;
  if (!Array.isArray(lines)) return "";
  const totalPax = Number(raw.totalPax ?? 0);
  const totalMnt = Number(raw.totalMnt ?? 0);
  const dep = String(raw.departureIso ?? "").trim();
  const parts: string[] = [];
  if (dep) parts.push(`Эхлэх: ${dep}`);
  parts.push(`Нийт: ${totalPax} хүн · ${Math.round(totalMnt).toLocaleString("mn-MN")} ₮`);
  for (const row of lines) {
    if (!isRecord(row)) continue;
    const label = String(row.label ?? "").trim() || String(row.tierId ?? "");
    const qty = Math.round(Number(row.qty ?? 0)) || 0;
    const unit = Math.round(Number(row.unitPriceMnt ?? 0)) || 0;
    if (qty > 0) parts.push(`  · ${label} × ${qty} — ${unit.toLocaleString("mn-MN")} ₮`);
  }
  return parts.join("\n");
}

export function orderSummaryToPrismaJson(
  s: TripRegistrationOrderSummaryForDb | null,
): Prisma.InputJsonValue | undefined {
  if (!s) return undefined;
  return s as unknown as Prisma.InputJsonValue;
}
