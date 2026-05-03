import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

/** Event admin wire format is wall time in Mongolia (same as public-facing copy). */
export const EVENT_ADMIN_DATETIME_TZ = "Asia/Ulaanbaatar" as const;

const WIRE_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * Parse `YYYY-MM-DDTHH:mm` as wall clock in {@link EVENT_ADMIN_DATETIME_TZ} → UTC `Date` for Prisma.
 */
export function parseEventDatetimeWireUb(raw: string): Date | null {
  const t = raw.trim();
  if (!t) return null;
  const m = WIRE_RE.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const min = Number(m[5]);
  if (![y, mo, d, h, min].every(Number.isFinite)) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || min > 59) return null;
  // Pass an ISO-like string (no Z) so fromZonedTime → toDate uses `timeZone`, not the host's local TZ.
  // `new Date(y, mo, …)` + fromZonedTime breaks SSR (UTC) vs browser hydration and can yield Invalid Date → UI falls back to "now".
  const isoLocal = `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
  const out = fromZonedTime(isoLocal, EVENT_ADMIN_DATETIME_TZ);
  return Number.isNaN(out.getTime()) ? null : out;
}

/** Format instant as `YYYY-MM-DDTHH:mm` wall clock in {@link EVENT_ADMIN_DATETIME_TZ}. */
export function formatEventDatetimeWireUb(d: Date): string {
  return formatInTimeZone(d, EVENT_ADMIN_DATETIME_TZ, "yyyy-MM-dd'T'HH:mm");
}

/** Human-readable UB wall time for tables and labels. */
export function formatEventDisplayUb(d: Date): string {
  return formatInTimeZone(d, EVENT_ADMIN_DATETIME_TZ, "yyyy.MM.dd HH:mm");
}

/** `Date` suitable for `react-datepicker` so the clock matches UB wall time. */
export function eventInstantToPickerDate(instant: Date): Date {
  return toZonedTime(instant, EVENT_ADMIN_DATETIME_TZ);
}

/** Interpret picker output as UB wall time → true instant. */
export function pickerDateToEventInstant(pickerDate: Date): Date {
  return fromZonedTime(pickerDate, EVENT_ADMIN_DATETIME_TZ);
}
