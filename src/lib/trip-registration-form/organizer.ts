import type {
  TripFormMoneyStatus,
  TripFormQuestion,
  TripFormQuestionType,
  TripFormResponseWorkflowStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { answersForOrganizerApi, parseAnswersSnapshot } from "@/lib/trip-registration-form/answers-snapshot";
import { formatOrderSummaryMn } from "@/lib/trip-registration-form/order-summary-format";
import { assertEventFormEditableByAccount, assertTripEditableByAccount } from "@/lib/trip-registration-form/service";
import { MVP_TRIP_FORM_QUESTION_TYPES } from "@/lib/trip-registration-form/types";

export async function assertFormEditableByAccount(
  formId: string,
  accountId: bigint,
): Promise<{ tripId: number | null; eventId: bigint | null }> {
  const form = await prisma.tripRegistrationForm.findUnique({
    where: { id: formId },
    select: { tripId: true, eventId: true },
  });
  if (!form) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  if (form.tripId != null) {
    await assertTripEditableByAccount(form.tripId, accountId);
    return { tripId: form.tripId, eventId: null };
  }
  if (form.eventId != null) {
    await assertEventFormEditableByAccount(form.eventId, accountId);
    return { tripId: null, eventId: form.eventId };
  }
  const e = new Error("INVALID_FORM");
  (e as Error & { status?: number }).status = 400;
  throw e;
}

export async function listTripFormsForOrganizer(tripId: number, accountId: bigint) {
  await assertTripEditableByAccount(tripId, accountId);
  return prisma.tripRegistrationForm.findMany({
    where: { tripId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      publicSlug: true,
      isPublished: true,
      updatedAt: true,
      _count: { select: { responses: true, questions: true } },
    },
  });
}

export async function getTripFormForOrganizer(formId: string, accountId: bigint) {
  await assertFormEditableByAccount(formId, accountId);
  return prisma.tripRegistrationForm.findUnique({
    where: { id: formId },
    include: {
      trip: { select: { id: true, destination: true, startDate: true, endDate: true, coverImageUrl: true } },
      event: { select: { id: true, title: true, startsAt: true, endsAt: true } },
      questions: {
        where: { retiredFromForm: false },
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

export async function patchTripRegistrationForm(
  formId: string,
  accountId: bigint,
  data: { title?: string; description?: string | null },
) {
  await assertFormEditableByAccount(formId, accountId);
  return prisma.tripRegistrationForm.update({
    where: { id: formId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() || "Бүртгэлийн хураангуй" } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
    },
  });
}

export async function setTripFormPublished(formId: string, accountId: bigint, isPublished: boolean) {
  await assertFormEditableByAccount(formId, accountId);
  return prisma.tripRegistrationForm.update({
    where: { id: formId },
    data: { isPublished },
  });
}

function assertMvpQuestionType(type: TripFormQuestionType) {
  if (!MVP_TRIP_FORM_QUESTION_TYPES.includes(type)) {
    const e = new Error("UNSUPPORTED_TYPE");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }
}

export async function addTripFormQuestion(
  formId: string,
  accountId: bigint,
  input: {
    type: TripFormQuestionType;
    label: string;
    description?: string | null;
    placeholder?: string | null;
    isRequired?: boolean;
    options?: { label: string; value: string }[];
  },
) {
  await assertFormEditableByAccount(formId, accountId);
  assertMvpQuestionType(input.type);

  const needsOptions =
    input.type === "MULTIPLE_CHOICE" || input.type === "CHECKBOXES" || input.type === "DROPDOWN";
  if (needsOptions && (!input.options || input.options.length < 1)) {
    const e = new Error("OPTIONS_REQUIRED");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }

  const last = await prisma.tripFormQuestion.findFirst({
    where: { formId, retiredFromForm: false },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  return prisma.$transaction(async (tx) => {
    const q = await tx.tripFormQuestion.create({
      data: {
        formId,
        label: input.label.trim() || "Асуулт",
        description: input.description?.trim() || null,
        type: input.type,
        placeholder: input.placeholder?.trim() || null,
        isRequired: input.isRequired ?? false,
        sortOrder,
      },
    });
    if (input.options?.length) {
      let o = 0;
      await tx.tripFormQuestionOption.createMany({
        data: input.options.map((opt) => ({
          questionId: q.id,
          label: opt.label.trim() || opt.value.trim(),
          value: opt.value.trim() || opt.label.trim(),
          sortOrder: o++,
        })),
      });
    }
    return q;
  });
}

export async function patchTripFormQuestion(
  questionId: string,
  accountId: bigint,
  input: {
    label?: string;
    description?: string | null;
    placeholder?: string | null;
    isRequired?: boolean;
    type?: TripFormQuestionType;
    options?: { label: string; value: string }[] | null;
  },
) {
  const q = await prisma.tripFormQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, formId: true },
  });
  if (!q) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  await assertFormEditableByAccount(q.formId, accountId);

  const nextType = input.type;
  if (nextType) assertMvpQuestionType(nextType);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.tripFormQuestion.update({
      where: { id: questionId },
      data: {
        ...(input.label !== undefined ? { label: input.label.trim() || "Асуулт" } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
        ...(input.placeholder !== undefined ? { placeholder: input.placeholder?.trim() || null } : {}),
        ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
        ...(nextType ? { type: nextType } : {}),
      },
    });

    const finalType = nextType ?? updated.type;
    const usesOptions = finalType === "MULTIPLE_CHOICE" || finalType === "CHECKBOXES" || finalType === "DROPDOWN";
    if (nextType && !usesOptions) {
      await tx.tripFormQuestionOption.deleteMany({ where: { questionId } });
    }

    if (input.options !== undefined && input.options !== null) {
      const t = finalType;
      const needsOptions = t === "MULTIPLE_CHOICE" || t === "CHECKBOXES" || t === "DROPDOWN";
      if (needsOptions && input.options.length < 1) {
        const e = new Error("OPTIONS_REQUIRED");
        (e as Error & { status?: number }).status = 400;
        throw e;
      }
      await tx.tripFormQuestionOption.deleteMany({ where: { questionId } });
      if (input.options.length) {
        let o = 0;
        await tx.tripFormQuestionOption.createMany({
          data: input.options.map((opt) => ({
            questionId,
            label: opt.label.trim() || opt.value.trim(),
            value: opt.value.trim() || opt.label.trim(),
            sortOrder: o++,
          })),
        });
      }
    }

    return updated;
  });
}

export async function deleteTripFormQuestion(questionId: string, accountId: bigint) {
  const q = await prisma.tripFormQuestion.findUnique({
    where: { id: questionId },
    select: { formId: true },
  });
  if (!q) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  await assertFormEditableByAccount(q.formId, accountId);
  const cnt = await prisma.tripFormResponseAnswer.count({ where: { questionId } });
  if (cnt > 0) {
    await prisma.tripFormQuestion.update({
      where: { id: questionId },
      data: { retiredFromForm: true, sortOrder: 999_000 },
    });
    return;
  }
  await prisma.tripFormQuestion.delete({ where: { id: questionId } });
}

export async function reorderTripFormQuestions(formId: string, accountId: bigint, orderedQuestionIds: string[]) {
  await assertFormEditableByAccount(formId, accountId);
  const existing = await prisma.tripFormQuestion.findMany({
    where: { formId, retiredFromForm: false },
    select: { id: true },
  });
  const set = new Set(existing.map((x) => x.id));
  if (orderedQuestionIds.length !== set.size || orderedQuestionIds.some((id) => !set.has(id))) {
    const e = new Error("INVALID_ORDER");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }
  let i = 0;
  await prisma.$transaction(
    orderedQuestionIds.map((id) =>
      prisma.tripFormQuestion.update({
        where: { id },
        data: { sortOrder: i++ },
      }),
    ),
  );
}

export async function deleteTripRegistrationForm(formId: string, accountId: bigint) {
  await assertFormEditableByAccount(formId, accountId);
  await prisma.tripRegistrationForm.delete({ where: { id: formId } });
}

export async function listTripFormResponses(formId: string, accountId: bigint) {
  await assertFormEditableByAccount(formId, accountId);
  return prisma.tripFormResponse.findMany({
    where: { formId },
    orderBy: { submittedAt: "desc" },
    include: {
      answers: {
        include: { question: { select: { id: true, label: true, type: true, sortOrder: true, retiredFromForm: true } } },
      },
      participant: { select: { id: true } },
    },
  });
}

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

/** Loads form + live questions for CSV (no permission check). */
async function loadTripRegistrationFormForCsvExport(formId: string) {
  return prisma.tripRegistrationForm.findUnique({
    where: { id: formId },
    include: {
      trip: { select: { id: true, destination: true, startDate: true, endDate: true, coverImageUrl: true } },
      event: { select: { id: true, title: true, startsAt: true, endsAt: true } },
      questions: {
        where: { retiredFromForm: false },
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

/**
 * One UTF-8 CSV (Excel opens it) for all responses on this form.
 * Includes snapshot-only columns for retired / re-imported questions.
 */
export async function buildTripFormResponsesCsvFromFormId(formId: string): Promise<{ filename: string; body: string }> {
  const form = await loadTripRegistrationFormForCsvExport(formId);
  if (!form) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }

  const questions = [...form.questions].sort((a, b) => a.sortOrder - b.sortOrder);
  const responses = await prisma.tripFormResponse.findMany({
    where: { formId },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      submittedAt: true,
      status: true,
      paymentStatus: true,
      orderSummary: true,
      answersSnapshot: true,
      answers: true,
    },
  });

  type Col = { key: string; header: string };
  const cols: Col[] = questions.map((q) => ({ key: `q:${q.id}`, header: q.label }));
  const seenCol = new Set(cols.map((c) => c.key));
  for (const r of responses) {
    const snap = parseAnswersSnapshot(r.answersSnapshot);
    if (!snap) continue;
    for (const s of snap) {
      const key = `q:${s.questionId}`;
      if (!seenCol.has(key)) {
        seenCol.add(key);
        cols.push({ key, header: s.label });
      }
    }
  }

  const headers = [
    "response_id",
    "submitted_at",
    "workflow_status",
    "payment_status",
    "order_summary",
    ...cols.map((c) => c.header),
  ];
  const lines = [headers.map(csvEscape).join(",")];

  for (const r of responses) {
    const byQ = new Map(r.answers.map((a) => [a.questionId, (a.value ?? "").replace(/\r\n/g, "\n")]));
    const fileByQ = new Map(r.answers.map((a) => [a.questionId, a.fileUrl ?? ""]));
    const snap = parseAnswersSnapshot(r.answersSnapshot);
    const snapById = new Map((snap ?? []).map((s) => [s.questionId, s]));
    const cells = [
      r.id,
      r.submittedAt.toISOString(),
      r.status,
      r.paymentStatus,
      formatOrderSummaryMn(r.orderSummary).replace(/\n/g, " | "),
      ...cols.map(({ key }) => {
        const qid = key.slice(2);
        const t = (byQ.get(qid) ?? (snapById.get(qid)?.value ?? "")).trim();
        const f = (fileByQ.get(qid) ?? (snapById.get(qid)?.fileUrl ?? "")).trim();
        if (f) return t ? `${t} | ${f}` : f;
        return t;
      }),
    ];
    lines.push(cells.map((c) => csvEscape(String(c))).join(","));
  }

  const safeTitle = form.title.replace(/[^\w\u0400-\u04FF]+/g, "_").slice(0, 60) || "responses";
  return { filename: `${safeTitle}_hariultuud.csv`, body: "\uFEFF" + lines.join("\n") };
}

export async function buildTripFormResponsesCsv(formId: string, accountId: bigint): Promise<{ filename: string; body: string }> {
  await assertFormEditableByAccount(formId, accountId);
  return buildTripFormResponsesCsvFromFormId(formId);
}

/** Admin: one CSV for the trip’s registration form (published form preferred). */
export async function buildAdminTripRegistrationExportCsv(tripId: number): Promise<{ filename: string; body: string }> {
  const published = await prisma.tripRegistrationForm.findFirst({
    where: { tripId, isPublished: true },
    select: { id: true },
  });
  const fallback = await prisma.tripRegistrationForm.findFirst({
    where: { tripId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  const formRef = published ?? fallback;
  if (!formRef) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  const { body } = await buildTripFormResponsesCsvFromFormId(formRef.id);
  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: { destination: true },
  });
  const slug = (trip?.destination?.trim() || `trip_${tripId}`).replace(/[^\w\u0400-\u04FF]+/g, "_").slice(0, 50);
  return { filename: `${slug}_trip${tripId}_hariultuud.csv`, body };
}

/** Admin: one CSV for the event’s registration form (published form preferred). */
export async function buildAdminEventRegistrationExportCsv(eventId: bigint): Promise<{ filename: string; body: string }> {
  const published = await prisma.tripRegistrationForm.findFirst({
    where: { eventId, isPublished: true },
    select: { id: true },
  });
  const fallback = await prisma.tripRegistrationForm.findFirst({
    where: { eventId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  const formRef = published ?? fallback;
  if (!formRef) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  const { body } = await buildTripFormResponsesCsvFromFormId(formRef.id);
  const ev = await prisma.bniEvent.findUnique({
    where: { id: eventId },
    select: { title: true },
  });
  const idStr = eventId.toString();
  const slug = (ev?.title?.trim() || `event_${idStr}`).replace(/[^\w\u0400-\u04FF]+/g, "_").slice(0, 50);
  return { filename: `${slug}_event${idStr}_hariultuud.csv`, body };
}

export function extractParticipantSnapshotFromAnswers(
  questions: Pick<TripFormQuestion, "id" | "label" | "type" | "isRequired">[],
  answers: { questionId: string; value: string | null }[],
): { fullName: string; phone: string | null; email: string | null; companyName: string | null; position: string | null } {
  const val = (qid: string) => {
    const a = answers.find((x) => x.questionId === qid);
    return (a?.value ?? "").trim();
  };
  const L = (s: string) => s.toLowerCase();

  let fullName = "";
  for (const q of questions) {
    if (L(q.label).includes("бүтэн") && L(q.label).includes("нэр")) {
      fullName = val(q.id);
      if (fullName) break;
    }
  }
  if (!fullName) {
    const firstReqShort = questions.find((q) => q.type === "SHORT_TEXT" && q.isRequired);
    if (firstReqShort) fullName = val(firstReqShort.id);
  }
  if (!fullName) {
    const anyShort = questions.find((q) => q.type === "SHORT_TEXT");
    if (anyShort) fullName = val(anyShort.id);
  }

  const phoneQ = questions.find((q) => q.type === "PHONE");
  const emailQ = questions.find((q) => q.type === "EMAIL");
  let companyName: string | null = null;
  for (const q of questions) {
    if (L(q.label).includes("компани")) {
      companyName = val(q.id) || null;
      break;
    }
  }
  let position: string | null = null;
  for (const q of questions) {
    if (L(q.label).includes("албан") || L(q.label).includes("түшээ") || L(q.label).includes("албан тушаал")) {
      position = val(q.id) || null;
      break;
    }
  }

  return {
    fullName: fullName || "Зочин",
    phone: phoneQ ? val(phoneQ.id) || null : null,
    email: emailQ ? val(emailQ.id) || null : null,
    companyName,
    position,
  };
}

export async function patchTripFormResponse(
  responseId: string,
  accountId: bigint,
  data: {
    status?: TripFormResponseWorkflowStatus;
    paymentStatus?: TripFormMoneyStatus;
    internalNote?: string | null;
  },
) {
  const r = await prisma.tripFormResponse.findUnique({
    where: { id: responseId },
    select: { formId: true },
  });
  if (!r) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  await assertFormEditableByAccount(r.formId, accountId);
  return prisma.tripFormResponse.update({
    where: { id: responseId },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.paymentStatus !== undefined ? { paymentStatus: data.paymentStatus } : {}),
      ...(data.internalNote !== undefined ? { internalNote: data.internalNote?.trim() || null } : {}),
    },
  });
}

export async function convertTripFormResponseToParticipant(responseId: string, accountId: bigint) {
  const response = await prisma.tripFormResponse.findUnique({
    where: { id: responseId },
    include: {
      answers: true,
      form: {
        include: {
          questions: { orderBy: { sortOrder: "asc" } },
        },
      },
      participant: { select: { id: true } },
    },
  });
  if (!response) {
    const e = new Error("NOT_FOUND");
    (e as Error & { status?: number }).status = 404;
    throw e;
  }
  await assertFormEditableByAccount(response.formId, accountId);

  if (response.participant) {
    const e = new Error("ALREADY_CONVERTED");
    (e as Error & { status?: number }).status = 409;
    throw e;
  }

  if (response.tripId == null) {
    const e = new Error("NOT_TRIP_RESPONSE");
    (e as Error & { status?: number }).status = 400;
    throw e;
  }

  const mergedFlat = answersForOrganizerApi({
    answersSnapshot: response.answersSnapshot,
    answers: response.answers.map((a) => ({
      questionId: a.questionId,
      value: a.value,
      fileUrl: a.fileUrl,
      question:
        response.form.questions.find((q) => q.id === a.questionId) ??
        null,
    })),
  });
  const questionsForExtract = mergedFlat.map((a) => ({
    id: a.questionId,
    label: a.questionLabel,
    type: a.questionType,
    isRequired: false,
  }));
  const answersForExtract = mergedFlat.map((a) => ({ questionId: a.questionId, value: a.value }));
  const snap = extractParticipantSnapshotFromAnswers(questionsForExtract, answersForExtract);

  await prisma.$transaction(async (tx) => {
    await tx.tripParticipant.create({
      data: {
        tripId: response.tripId!,
        responseId: response.id,
        userId: response.submittedByUserId,
        fullName: snap.fullName,
        phone: snap.phone,
        email: snap.email,
        companyName: snap.companyName,
        position: snap.position,
        status: "REGISTERED",
        paymentStatus: response.paymentStatus,
      },
    });
    await tx.tripFormResponse.update({
      where: { id: response.id },
      data: { status: "CONFIRMED" },
    });
  });

  return { ok: true as const };
}
