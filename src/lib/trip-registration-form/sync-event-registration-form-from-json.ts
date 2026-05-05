import { prisma } from "@/lib/prisma";
import { newTripFormPublicSlug } from "@/lib/trip-registration-form/public-slug";
import { parseLegacyRegistrationArray } from "@/lib/trip-registration-form/sync-registration-form-from-json";
import { upsertTripFormQuestionsFromLegacyRows } from "@/lib/trip-registration-form/sync-form-questions-upsert";

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
      const qs = await prisma.tripFormQuestion.findMany({ where: { formId: f.id }, select: { id: true } });
      for (const q of qs) {
        const cnt = await prisma.tripFormResponseAnswer.count({ where: { questionId: q.id } });
        if (cnt > 0) {
          await prisma.tripFormQuestion.update({
            where: { id: q.id },
            data: { retiredFromForm: true, sortOrder: 999_000 },
          });
        } else {
          await prisma.tripFormQuestionOption.deleteMany({ where: { questionId: q.id } });
          await prisma.tripFormQuestion.delete({ where: { id: q.id } });
        }
      }
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

  await prisma.$transaction(
    async (tx) => {
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

    await upsertTripFormQuestionsFromLegacyRows(tx, form.id, rows);
    },
    { maxWait: 15_000, timeout: 60_000 },
  );
}
