import { prisma } from "@/lib/prisma";
import { newTripFormPublicSlug } from "@/lib/trip-registration-form/public-slug";
import {
  legacyStringToTripType,
  needsTripOptions,
  parseLegacyRegistrationArray,
  stableLegacyQuestionId,
} from "@/lib/trip-registration-form/sync-registration-form-from-json";

const DEFAULT_THANK_YOU_MN =
  "Таны бүртгэл амжилттай илгээгдлээ. Зохион байгуулагч таны мэдээллийг шалгаж баталгаажуулна.";

/**
 * Keeps `trip_registration_forms` + questions in sync with `bni_events.registration_form_json`
 * (same legacy array shape as trips / `PlatformTripRegistrationJsonBuilder`).
 */
export async function syncEventRegistrationFormFromLegacyJson(
  eventId: bigint,
  registration: unknown,
): Promise<void> {
  const parsed = parseLegacyRegistrationArray(registration);
  const rows = parsed.filter((r) => r.label.trim());

  if (rows.length === 0) {
    const forms = await prisma.tripRegistrationForm.findMany({ where: { eventId }, select: { id: true } });
    for (const f of forms) {
      await prisma.tripFormQuestion.deleteMany({ where: { formId: f.id } });
      await prisma.tripRegistrationForm.update({
        where: { id: f.id },
        data: { isPublished: false },
      });
    }
    return;
  }

  const ev = await prisma.bniEvent.findUnique({
    where: { id: eventId },
    select: { title: true },
  });
  if (!ev) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    let form = await tx.tripRegistrationForm.findFirst({
      where: { eventId },
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
          eventId,
          tripId: null,
          title: ev.title?.trim() || "Эвентийн бүртгэл",
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
          title: ev.title?.trim() || undefined,
        },
      });
    }

    await tx.tripRegistrationForm.updateMany({
      where: { eventId, NOT: { id: form.id } },
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
