import { prisma } from "@/lib/prisma";
import { defaultBusinessTripRegistrationQuestions } from "@/lib/trip-registration-form/default-questions";
import { newTripFormPublicSlug } from "@/lib/trip-registration-form/public-slug";
import {
  assertTripFormSubmissionValid,
  filterAnswersToFormQuestions,
  type TripFormSubmitAnswer,
} from "@/lib/trip-registration-form/submit-validation";

export async function assertTripEditableByAccount(tripId: number, accountId: bigint): Promise<void> {
  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: { managerAccountId: true },
  });
  if (!trip) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  if (trip.managerAccountId !== null && trip.managerAccountId !== accountId) {
    const acc = await prisma.platformAccount.findUnique({ where: { id: accountId }, select: { role: true } });
    if (!acc || (acc.role !== "admin" && acc.role !== "director")) {
      const e = new Error("FORBIDDEN");
      (e as Error & { status?: number }).status = 403;
      throw e;
    }
  }
}

export async function createTripRegistrationFormWithDefaults(input: {
  tripId: number;
  title: string;
  description?: string | null;
  actorAccountId: bigint;
}): Promise<{ formId: string; publicSlug: string }> {
  await assertTripEditableByAccount(input.tripId, input.actorAccountId);

  const seeds = defaultBusinessTripRegistrationQuestions();
  let publicSlug = newTripFormPublicSlug();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.tripRegistrationForm.findUnique({ where: { publicSlug }, select: { id: true } });
    if (!clash) break;
    publicSlug = newTripFormPublicSlug();
  }

  const form = await prisma.$transaction(async (tx) => {
    const f = await tx.tripRegistrationForm.create({
      data: {
        tripId: input.tripId,
        title: input.title.trim() || "Бүртгэлийн хураангуй",
        description: input.description?.trim() || null,
        publicSlug,
        isPublished: false,
        settings: {
          thankYouMn: "Таны бүртгэл амжилттай илгээгдлээ. Зохион байгуулагч таны мэдээллийг шалгаж баталгаажуулна.",
        },
      },
    });

    let order = 0;
    for (const q of seeds) {
      const row = await tx.tripFormQuestion.create({
        data: {
          formId: f.id,
          label: q.label,
          description: q.description ?? null,
          type: q.type,
          placeholder: q.placeholder ?? null,
          isRequired: q.isRequired,
          sortOrder: order++,
        },
      });
      if (q.options?.length) {
        let o = 0;
        await tx.tripFormQuestionOption.createMany({
          data: q.options.map((opt) => ({
            questionId: row.id,
            label: opt.label,
            value: opt.value,
            sortOrder: o++,
          })),
        });
      }
    }
    return f;
  });

  return { formId: form.id, publicSlug: form.publicSlug };
}

export async function getPublishedFormBundleBySlug(publicSlug: string) {
  const form = await prisma.tripRegistrationForm.findFirst({
    where: { publicSlug, isPublished: true },
    include: {
      trip: { select: { id: true, destination: true, startDate: true, endDate: true, coverImageUrl: true } },
      questions: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  return form;
}

export async function submitPublicFormResponse(input: {
  publicSlug: string;
  answers: TripFormSubmitAnswer[];
  submittedByUserId?: bigint | null;
}): Promise<{ responseId: string }> {
  const form = await prisma.tripRegistrationForm.findFirst({
    where: { publicSlug: input.publicSlug, isPublished: true },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          type: true,
          isRequired: true,
          options: { orderBy: { sortOrder: "asc" }, select: { value: true } },
        },
      },
    },
  });
  if (!form) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }

  const snapshots = form.questions.map((q) => ({
    id: q.id,
    label: q.label,
    type: q.type,
    isRequired: q.isRequired,
    options: q.options.map((o) => ({ value: o.value })),
  }));

  assertTripFormSubmissionValid(snapshots, input.answers);

  const answersToStore = filterAnswersToFormQuestions(snapshots, input.answers);

  const response = await prisma.$transaction(async (tx) => {
    const r = await tx.tripFormResponse.create({
      data: {
        formId: form.id,
        tripId: form.tripId,
        submittedByUserId: input.submittedByUserId ?? null,
        status: "SUBMITTED",
        paymentStatus: "UNPAID",
      },
    });
    if (answersToStore.length) {
      await tx.tripFormResponseAnswer.createMany({
        data: answersToStore.map((a) => ({
          responseId: r.id,
          questionId: a.questionId,
          value: a.value,
          fileUrl: a.fileUrl ?? null,
        })),
      });
    }
    return r;
  });

  return { responseId: response.id };
}
