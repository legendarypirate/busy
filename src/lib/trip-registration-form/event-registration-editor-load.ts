import type { TripFormQuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  needsTripOptions,
  parseLegacyRegistrationArray,
  tripTypeToLegacyString,
  type LegacyRegistrationRow,
} from "@/lib/trip-registration-form/sync-registration-form-from-json";

async function legacyRowsFromEventTripForm(eventId: bigint): Promise<LegacyRegistrationRow[]> {
  const form = await prisma.tripRegistrationForm.findFirst({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: {
      questions: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          type: true,
          placeholder: true,
          isRequired: true,
          options: { orderBy: { sortOrder: "asc" }, select: { label: true } },
        },
      },
    },
  });
  const qs = form?.questions ?? [];
  if (qs.length === 0) return [];

  return qs.map((q) => ({
    name: q.id,
    label: q.label,
    type: tripTypeToLegacyString(q.type as TripFormQuestionType),
    required: q.isRequired ? 1 : 0,
    placeholder: q.placeholder?.trim() ?? "",
    options: needsTripOptions(q.type as TripFormQuestionType) ? q.options.map((o) => o.label) : [],
  }));
}

/**
 * Legacy array for `PlatformTripRegistrationJsonBuilder` when editing an event.
 * Prefers `bni_events.registration_form_json`; if missing/empty but synced questions exist, rebuilds from DB.
 */
export async function registrationLegacyJsonForEventEditor(
  eventId: bigint,
  columnJson: unknown,
): Promise<unknown | undefined> {
  const fromColumn = parseLegacyRegistrationArray(columnJson).filter((r) => r.label.trim());
  if (fromColumn.length > 0) {
    return fromColumn;
  }
  const fromDb = await legacyRowsFromEventTripForm(eventId);
  return fromDb.length > 0 ? fromDb : undefined;
}
