import type { TripFormQuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { newTripFormPublicSlug } from "@/lib/trip-registration-form/public-slug";

export type LegacyRegistrationRow = {
  name: string;
  label: string;
  type: string;
  required: number;
  placeholder: string;
  options: string[];
};

/** Stable id for legacy rows with empty `name` (must match drawer + DB). */
export function stableLegacyQuestionId(name: string, index: number): string {
  const t = name.trim();
  if (t.length > 0) return t;
  return `legacy_q_${index}`;
}

const DEFAULT_THANK_YOU_MN =
  "Таны бүртгэл амжилттай илгээгдлээ. Зохион байгуулагч таны мэдээллийг шалгаж баталгаажуулна.";

export function legacyStringToTripType(typeStr: string): TripFormQuestionType {
  switch (typeStr) {
    case "textarea":
      return "LONG_TEXT";
    case "email":
      return "EMAIL";
    case "tel":
      return "PHONE";
    case "number":
      return "NUMBER";
    case "date":
      return "DATE";
    case "select":
      return "DROPDOWN";
    case "radio":
      return "MULTIPLE_CHOICE";
    case "checkbox":
      return "CHECKBOXES";
    default:
      return "SHORT_TEXT";
  }
}

export function needsTripOptions(t: TripFormQuestionType): boolean {
  return t === "MULTIPLE_CHOICE" || t === "CHECKBOXES" || t === "DROPDOWN";
}

/** Normalizes `business_trips.registration_form_json` array elements. */
export function parseLegacyRegistrationArray(registration: unknown): LegacyRegistrationRow[] {
  if (!Array.isArray(registration)) {
    return [];
  }
  return registration
    .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
    .map((x) => ({
      name: String(x.name ?? "").trim(),
      label: String(x.label ?? ""),
      type: String(x.type ?? "text"),
      required: Number(x.required ?? 0) ? 1 : 0,
      placeholder: String(x.placeholder ?? ""),
      options: Array.isArray(x.options) ? x.options.map((o) => String(o)).filter(Boolean) : [],
    }));
}

/**
 * Keeps `trip_registration_forms` + `trip_form_questions` in sync with `registration_form_json`
 * so the homepage drawer (`/api/public/trips/:id/registration`) shows the same questions after trip save.
 */
export async function syncTripRegistrationFormFromLegacyJson(tripId: number, registration: unknown): Promise<void> {
  const parsed = parseLegacyRegistrationArray(registration);
  const rows = parsed.filter((r) => r.label.trim());

  if (rows.length === 0) {
    const forms = await prisma.tripRegistrationForm.findMany({ where: { tripId }, select: { id: true } });
    for (const f of forms) {
      await prisma.tripFormQuestion.deleteMany({ where: { formId: f.id } });
      await prisma.tripRegistrationForm.update({
        where: { id: f.id },
        data: { isPublished: false },
      });
    }
    return;
  }

  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: { destination: true },
  });
  if (!trip) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    let form = await tx.tripRegistrationForm.findFirst({
      where: { tripId },
      orderBy: { createdAt: "asc" },
    });

    if (!form) {
      let publicSlug = newTripFormPublicSlug();
      for (let i = 0; i < 10; i++) {
        const clash = await tx.tripRegistrationForm.findUnique({
          where: { publicSlug },
          select: { id: true },
        });
        if (!clash) break;
        publicSlug = newTripFormPublicSlug();
      }
      form = await tx.tripRegistrationForm.create({
        data: {
          tripId,
          title: trip.destination?.trim() || "Бүртгэлийн хураангуй",
          description: null,
          publicSlug,
          isPublished: true,
          settings: { thankYouMn: DEFAULT_THANK_YOU_MN },
        },
      });
    } else {
      await tx.tripRegistrationForm.update({
        where: { id: form.id },
        data: {
          isPublished: true,
          title: trip.destination?.trim() || undefined,
        },
      });
    }

    await tx.tripRegistrationForm.updateMany({
      where: { tripId, NOT: { id: form.id } },
      data: { isPublished: false },
    });

    await tx.tripFormQuestion.deleteMany({ where: { formId: form.id } });

    let sortOrder = 0;
    for (const row of rows) {
      const type = legacyStringToTripType(row.type);
      const questionId = stableLegacyQuestionId(row.name, sortOrder);
      const isRequired = row.required === 1;

      const q = await tx.tripFormQuestion.create({
        data: {
          id: questionId,
          formId: form.id,
          label: row.label.trim(),
          description: null,
          type,
          placeholder: row.placeholder.trim() || null,
          isRequired,
          sortOrder: sortOrder++,
        },
      });

      if (needsTripOptions(type)) {
        const opts = row.options.length > 0 ? row.options : ["Сонголт 1", "Сонголт 2"];
        await tx.tripFormQuestionOption.createMany({
          data: opts.map((label, i) => ({
            questionId: q.id,
            label,
            value: label,
            sortOrder: i,
          })),
        });
      }
    }
  });
}
