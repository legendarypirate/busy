import { prisma } from "@/lib/prisma";
import { readExtras } from "@/components/platform/trips/trip-editor-helpers";

/** Same shape `TripDetailsBookingRegisterProvider` expects (camelCase). */
export type PublicTripCheckoutTier = {
  id: string;
  label: string;
  subtitle: string;
  priceMnt: number;
};

export type PublicTripCheckoutContext = {
  tripId: number;
  tripTitle: string;
  /** Trip start date as YYYY-MM-DD (local). Empty string if trip has no start date. */
  departureIso: string;
  tiers: PublicTripCheckoutTier[];
  /** Total seats allowed for the trip (from admin extras, fallback 30). */
  maxPassengers: number;
  capacityNote: string;
};

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function parseSeatCapacity(label: string | null | undefined, fallback: number): number {
  if (!label?.trim()) return fallback;
  const compact = label.replace(/\s/g, "");
  const m = compact.match(/(\d+)/);
  if (!m) return fallback;
  return Math.min(500, Math.max(1, parseInt(m[1], 10)));
}

/**
 * Loads the checkout context (tiers, capacity, departure) for the public
 * registration drawer — identical to what `/trip-details/:id` computes
 * server-side so that the home / list-view drawer can price the order the
 * same way.
 */
export async function loadPublicTripCheckoutContext(
  tripId: number,
): Promise<PublicTripCheckoutContext | null> {
  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: {
      destination: true,
      priceMnt: true,
      seatsLabel: true,
      startDate: true,
      extrasJson: true,
    },
  });
  if (!trip) return null;

  const extras = readExtras(trip.extrasJson);
  const basePriceMnt = trip.priceMnt ? Math.round(Number(trip.priceMnt)) : 4_590_000;

  let tiers: PublicTripCheckoutTier[] = extras.booking_tiers
    .filter((t) => t.label.trim() && Number.isFinite(t.price_mnt))
    .map((t) => ({
      id: t.id,
      label: t.label.trim(),
      subtitle: t.subtitle.trim(),
      priceMnt: Math.max(0, Math.round(t.price_mnt)),
    }));
  if (tiers.length === 0) {
    tiers = [{ id: "standard", label: "1 хүн", subtitle: "", priceMnt: basePriceMnt }];
  }

  const seatCapacityFromLabel = parseSeatCapacity(trip.seatsLabel, extras.total_seats);
  const maxPassengers = Math.max(1, Math.min(500, seatCapacityFromLabel));
  const spotsHint = Math.min(20, maxPassengers);
  const capacityNote =
    extras.booking_status_note.trim() || `${spotsHint} суудал үлдсэн`;

  const departureIso = trip.startDate ? formatLocalYmd(trip.startDate) : "";
  const tripTitle = trip.destination?.trim() || "Бизнес аялал";

  return {
    tripId,
    tripTitle,
    departureIso,
    tiers,
    maxPassengers,
    capacityNote,
  };
}
