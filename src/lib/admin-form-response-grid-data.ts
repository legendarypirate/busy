import type { TripFormQuestionType } from "@prisma/client";
import type { AdminGridMergedAnswer, AdminGridResponseInput } from "@/lib/admin-registration-response-grid";
import { prisma } from "@/lib/prisma";
import { answersForOrganizerApi } from "@/lib/trip-registration-form/answers-snapshot";

const responseInclude = {
  submitter: { select: { email: true } },
  participant: { select: { fullName: true, phone: true, email: true } },
  answers: {
    include: {
      question: { select: { label: true, sortOrder: true, type: true } },
    },
  },
} as const;

function whoFromRow(r: {
  participant: { fullName: string | null; email: string | null } | null;
  submitter: { email: string | null } | null;
  submittedByUserId: bigint | null;
}): string {
  return (
    r.participant?.fullName?.trim() ||
    r.participant?.email?.trim() ||
    r.submitter?.email?.trim() ||
    (r.submittedByUserId != null ? `Хэрэглэгч #${r.submittedByUserId.toString()}` : "Зочин")
  );
}

function toGridInput(r: {
  id: string;
  submittedAt: Date;
  answersSnapshot: unknown;
  answers: Array<{
    questionId: string;
    value: string | null;
    fileUrl: string | null;
    question: { label: string; type: TripFormQuestionType } | null;
  }>;
  participant: { fullName: string | null; email: string | null } | null;
  submitter: { email: string | null } | null;
  submittedByUserId: bigint | null;
}): AdminGridResponseInput {
  const merged = answersForOrganizerApi({
    answersSnapshot: r.answersSnapshot,
    answers: r.answers.map((a) => ({
      questionId: a.questionId,
      value: a.value,
      fileUrl: a.fileUrl,
      question: a.question,
    })),
  });
  const answers: AdminGridMergedAnswer[] = merged.map((m) => ({
    questionId: m.questionId,
    questionLabel: m.questionLabel,
    value: m.value,
    fileUrl: m.fileUrl,
  }));
  return {
    id: r.id,
    submittedAt: r.submittedAt.toISOString(),
    who: whoFromRow(r),
    answers,
  };
}

export async function loadTripRegistrationGridRows(tripId: number): Promise<AdminGridResponseInput[]> {
  const rows = await prisma.tripFormResponse.findMany({
    where: { tripId },
    orderBy: { submittedAt: "asc" },
    take: 500,
    include: responseInclude,
  });
  return rows.map(toGridInput);
}

export async function loadEventRegistrationGridRows(eventId: bigint): Promise<AdminGridResponseInput[]> {
  const rows = await prisma.tripFormResponse.findMany({
    where: { eventId },
    orderBy: { submittedAt: "asc" },
    take: 500,
    include: responseInclude,
  });
  return rows.map(toGridInput);
}
