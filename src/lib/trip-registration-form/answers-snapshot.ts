import type { TripFormQuestionType } from "@prisma/client";
import type { TripFormQuestionSnapshot, TripFormSubmitAnswer } from "@/lib/trip-registration-form/submit-validation";

/** Илгээх үед `trip_form_responses.answers_snapshot` дээр хадгалах элемент. */
export type TripFormAnswerSnapshotItem = {
  questionId: string;
  label: string;
  type: TripFormQuestionType;
  value: string | null;
  fileUrl: string | null;
};

export function buildAnswersSnapshot(
  snapshots: TripFormQuestionSnapshot[],
  answers: TripFormSubmitAnswer[],
): TripFormAnswerSnapshotItem[] {
  const byQ = new Map(snapshots.map((q) => [q.id, q]));
  const out: TripFormAnswerSnapshotItem[] = [];
  for (const a of answers) {
    const q = byQ.get(a.questionId);
    if (!q) continue;
    out.push({
      questionId: a.questionId,
      label: q.label,
      type: q.type,
      value: a.value ?? null,
      fileUrl: a.fileUrl ?? null,
    });
  }
  return out;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object";
}

export function parseAnswersSnapshot(raw: unknown): TripFormAnswerSnapshotItem[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const out: TripFormAnswerSnapshotItem[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const questionId = typeof item.questionId === "string" ? item.questionId.trim() : "";
    const label = typeof item.label === "string" ? item.label : "";
    const type = typeof item.type === "string" ? (item.type as TripFormQuestionType) : "SHORT_TEXT";
    if (!questionId) continue;
    out.push({
      questionId,
      label,
      type,
      value: typeof item.value === "string" || item.value === null ? (item.value as string | null) : null,
      fileUrl:
        typeof item.fileUrl === "string" || item.fileUrl === null ? (item.fileUrl as string | null) : null,
    });
  }
  return out.length > 0 ? out : null;
}

/** API / UI-д буцаах нэгдсэн хариултын мөр (snapshot эсвэл DB join). */
export function answersForOrganizerApi(r: {
  answersSnapshot: unknown;
  answers: Array<{
    questionId: string;
    value: string | null;
    fileUrl: string | null;
    question: { label: string; type: TripFormQuestionType } | null;
  }>;
}): Array<{
  questionId: string;
  questionLabel: string;
  questionType: TripFormQuestionType;
  value: string | null;
  fileUrl: string | null;
}> {
  const snap = parseAnswersSnapshot(r.answersSnapshot);
  if (snap && snap.length > 0) {
    return snap.map((s) => ({
      questionId: s.questionId,
      questionLabel: s.label,
      questionType: s.type,
      value: s.value,
      fileUrl: s.fileUrl,
    }));
  }
  return r.answers.map((a) => ({
    questionId: a.questionId,
    questionLabel: a.question?.label ?? a.questionId,
    questionType: a.question?.type ?? "SHORT_TEXT",
    value: a.value,
    fileUrl: a.fileUrl,
  }));
}
