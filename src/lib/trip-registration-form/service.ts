import type { Prisma, TripFormQuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { defaultBusinessTripRegistrationQuestions } from "@/lib/trip-registration-form/default-questions";
import { newTripFormPublicSlug } from "@/lib/trip-registration-form/public-slug";
import {
  parseLegacyRegistrationArray,
  stableLegacyQuestionId,
  syncTripRegistrationFormFromLegacyJson,
} from "@/lib/trip-registration-form/sync-registration-form-from-json";
import { syncEventRegistrationFormFromLegacyJson } from "@/lib/trip-registration-form/sync-event-registration-form-from-json";
import {
  orderSummaryToPrismaJson,
  parseAndValidateOrderSummaryForTrip,
} from "@/lib/trip-registration-form/order-summary";
import {
  assertTripFormSubmissionValid,
  filterAnswersToFormQuestions,
  type TripFormSubmitAnswer,
} from "@/lib/trip-registration-form/submit-validation";

export async function assertEventFormEditableByAccount(eventId: bigint, accountId: bigint): Promise<void> {
  const acc = await prisma.platformAccount.findUnique({
    where: { id: accountId },
    select: { role: true, status: true },
  });
  if (!acc || acc.status !== "active") {
    const e = new Error("FORBIDDEN");
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
  if (acc.role === "admin" || acc.role === "director") {
    return;
  }
  const e = new Error("FORBIDDEN");
  (e as Error & { status?: number }).status = 403;
  throw e;
}

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
      event: { select: { id: true, title: true, startsAt: true, endsAt: true } },
      questions: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  return form;
}

export async function submitPublicFormResponse(input: {
  publicSlug: string;
  answers: TripFormSubmitAnswer[];
  submittedByUserId?: bigint | null;
  orderSummary?: Prisma.InputJsonValue | null;
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
          options: { orderBy: { sortOrder: "asc" }, select: { value: true, label: true } },
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
    options: q.options.map((o) => ({ value: o.value, label: o.label })),
  }));

  assertTripFormSubmissionValid(snapshots, input.answers);

  const answersToStore = filterAnswersToFormQuestions(snapshots, input.answers);

  const response = await prisma.$transaction(async (tx) => {
    const r = await tx.tripFormResponse.create({
      data: {
        formId: form.id,
        tripId: form.tripId ?? null,
        eventId: form.eventId ?? null,
        submittedByUserId: input.submittedByUserId ?? null,
        status: "SUBMITTED",
        paymentStatus: "UNPAID",
        ...(input.orderSummary != null ? { orderSummary: input.orderSummary } : {}),
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

/** Public homepage drawer: JSON field types aligned with legacy PHP dynamic form renderer. */
export type HomeTripDrawerSchemaItem = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "radio" | "checkbox";
  required: boolean;
  placeholder: string;
  options?: string[];
};

function mapQuestionTypeToDrawer(
  type: TripFormQuestionType,
  options: { value: string }[],
  placeholder: string | null,
): Pick<HomeTripDrawerSchemaItem, "type" | "placeholder" | "options"> {
  const optVals = options.map((o) => o.value);
  const ph = placeholder ?? "";
  switch (type) {
    case "LONG_TEXT":
      return { type: "textarea", placeholder: ph };
    case "DROPDOWN":
      return { type: "select", placeholder: ph, options: optVals };
    case "MULTIPLE_CHOICE":
      return { type: "radio", placeholder: ph, options: optVals.length ? optVals : undefined };
    case "YES_NO":
      return { type: "radio", placeholder: ph, options: optVals.length ? optVals : ["Тийм", "Үгүй"] };
    case "CHECKBOXES":
      return { type: "checkbox", placeholder: ph, options: optVals };
    case "EMAIL":
      return { type: "email", placeholder: ph };
    case "PHONE":
      return { type: "tel", placeholder: ph };
    case "NUMBER":
      return { type: "number", placeholder: ph };
    case "FILE_UPLOAD":
      return { type: "text", placeholder: ph || "Файлын холбоос (URL) оруулна уу" };
    default:
      return { type: "text", placeholder: ph };
  }
}

/** Build drawer field list from `business_trips.registration_form_json` (legacy PHP / platform JSON builder). */
function legacyRowsToHomeDrawerSchema(rows: ReturnType<typeof parseLegacyRegistrationArray>): HomeTripDrawerSchemaItem[] {
  return rows
    .filter((r) => r.label.trim())
    .map((r, idx) => {
      const typeStr = r.type || "text";
      const required = r.required === 1;
      const placeholder = r.placeholder ?? "";
      const options = r.options;
      let type: HomeTripDrawerSchemaItem["type"];
      let opts: string[] | undefined;
      switch (typeStr) {
        case "textarea":
          type = "textarea";
          break;
        case "email":
          type = "email";
          break;
        case "tel":
          type = "tel";
          break;
        case "number":
          type = "number";
          break;
        case "select":
          type = "select";
          opts = options.length ? options : undefined;
          break;
        case "radio":
          type = "radio";
          opts = options.length ? options : undefined;
          break;
        case "checkbox":
          type = "checkbox";
          opts = options.length ? options : undefined;
          break;
        default:
          type = "text";
      }
      return {
        name: stableLegacyQuestionId(r.name, idx),
        label: r.label.trim(),
        required,
        placeholder,
        type,
        ...(opts?.length ? { options: opts } : {}),
      };
    });
}

/** Published registration form for a trip (homepage / marketing drawer). */
export async function getPublishedTripRegistrationDrawerSchema(tripId: number): Promise<
  { ok: true; tripTitle: string; schema: HomeTripDrawerSchemaItem[] } | { ok: false; message: string }
> {
  const form = await prisma.tripRegistrationForm.findFirst({
    where: { tripId, isPublished: true },
    include: {
      trip: { select: { destination: true } },
      questions: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (form) {
    const schema: HomeTripDrawerSchemaItem[] = form.questions.map((q) => {
      const mapped = mapQuestionTypeToDrawer(q.type, q.options, q.placeholder);
      return {
        name: q.id,
        label: q.label,
        required: q.isRequired,
        placeholder: mapped.placeholder ?? "",
        type: mapped.type,
        ...(mapped.options?.length ? { options: mapped.options } : {}),
      };
    });
    const tripTitle = form.trip?.destination?.trim() || "Бизнес аялал";
    return { ok: true, tripTitle, schema };
  }

  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: { destination: true, registrationFormJson: true },
  });
  if (!trip) {
    return {
      ok: false,
      message: "Энэ аялалд нийтэд нээлттэй бүртгэлийн форм байхгүй байна. Зохион байгуулагчид хандана уу.",
    };
  }
  const legacySchema = legacyRowsToHomeDrawerSchema(parseLegacyRegistrationArray(trip.registrationFormJson));
  if (legacySchema.length === 0) {
    return {
      ok: false,
      message: "Энэ аялалд нийтэд нээлттэй бүртгэлийн форм байхгүй байна. Зохион байгуулагчид хандана уу.",
    };
  }
  const tripTitle = trip.destination?.trim() || "Бизнес аялал";
  return { ok: true, tripTitle, schema: legacySchema };
}

export async function submitPublicFormResponseByTripId(input: {
  tripId: number;
  answers: TripFormSubmitAnswer[];
  submittedByUserId?: bigint | null;
  orderSummary?: unknown;
}): Promise<{ responseId: string }> {
  let form = await prisma.tripRegistrationForm.findFirst({
    where: { tripId: input.tripId, isPublished: true },
    select: { publicSlug: true },
  });
  if (!form) {
    const trip = await prisma.businessTrip.findUnique({
      where: { id: input.tripId },
      select: { registrationFormJson: true },
    });
    if (trip?.registrationFormJson) {
      await syncTripRegistrationFormFromLegacyJson(input.tripId, trip.registrationFormJson);
    }
    form = await prisma.tripRegistrationForm.findFirst({
      where: { tripId: input.tripId, isPublished: true },
      select: { publicSlug: true },
    });
  }
  if (!form) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }

  const validated = await parseAndValidateOrderSummaryForTrip(input.tripId, input.orderSummary);
  const orderJson = orderSummaryToPrismaJson(validated);

  return submitPublicFormResponse({
    publicSlug: form.publicSlug,
    answers: input.answers,
    submittedByUserId: input.submittedByUserId,
    ...(orderJson !== undefined ? { orderSummary: orderJson } : {}),
  });
}

export async function getPublishedEventRegistrationDrawerSchema(eventId: bigint): Promise<
  { ok: true; eventTitle: string; schema: HomeTripDrawerSchemaItem[] } | { ok: false; message: string }
> {
  const form = await prisma.tripRegistrationForm.findFirst({
    where: { eventId, isPublished: true },
    include: {
      event: { select: { title: true } },
      questions: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (form) {
    const schema: HomeTripDrawerSchemaItem[] = form.questions.map((q) => {
      const mapped = mapQuestionTypeToDrawer(q.type, q.options, q.placeholder);
      return {
        name: q.id,
        label: q.label,
        required: q.isRequired,
        placeholder: mapped.placeholder ?? "",
        type: mapped.type,
        ...(mapped.options?.length ? { options: mapped.options } : {}),
      };
    });
    const eventTitle = form.event?.title?.trim() || "Арга хэмжээ";
    return { ok: true, eventTitle, schema };
  }

  const ev = await prisma.bniEvent.findUnique({
    where: { id: eventId },
    select: { title: true, registrationFormJson: true },
  });
  if (!ev) {
    return {
      ok: false,
      message: "Эвент олдсонгүй.",
    };
  }
  const legacySchema = legacyRowsToHomeDrawerSchema(parseLegacyRegistrationArray(ev.registrationFormJson));
  if (legacySchema.length === 0) {
    return {
      ok: false,
      message: "Энэ арга хэмжээнд нийтэд нээлттэй бүртгэлийн форм байхгүй байна. Зохион байгуулагчид хандана уу.",
    };
  }
  const eventTitle = ev.title?.trim() || "Арга хэмжээ";
  return { ok: true, eventTitle, schema: legacySchema };
}

export async function submitPublicFormResponseByEventId(input: {
  eventId: bigint;
  answers: TripFormSubmitAnswer[];
  submittedByUserId?: bigint | null;
}): Promise<{ responseId: string }> {
  let form = await prisma.tripRegistrationForm.findFirst({
    where: { eventId: input.eventId, isPublished: true },
    select: { publicSlug: true },
  });
  if (!form) {
    const ev = await prisma.bniEvent.findUnique({
      where: { id: input.eventId },
      select: { registrationFormJson: true },
    });
    if (ev?.registrationFormJson) {
      await syncEventRegistrationFormFromLegacyJson(input.eventId, ev.registrationFormJson);
    }
    form = await prisma.tripRegistrationForm.findFirst({
      where: { eventId: input.eventId, isPublished: true },
      select: { publicSlug: true },
    });
  }
  if (!form) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }

  return submitPublicFormResponse({
    publicSlug: form.publicSlug,
    answers: input.answers,
    submittedByUserId: input.submittedByUserId,
  });
}
