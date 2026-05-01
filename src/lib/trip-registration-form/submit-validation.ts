import type { TripFormQuestionType } from "@prisma/client";

/** Incoming row from public POST (before persistence). */
export type TripFormSubmitAnswer = {
  questionId: string;
  value: string | null;
  fileUrl?: string | null;
};

/** Minimal question shape for server-side validation. */
export type TripFormQuestionSnapshot = {
  id: string;
  label: string;
  type: TripFormQuestionType;
  isRequired: boolean;
  options: { value: string }[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function norm(s: string | null | undefined): string {
  return (s ?? "").trim();
}

export function dedupeAnswersByQuestionId(answers: TripFormSubmitAnswer[]): TripFormSubmitAnswer[] {
  const map = new Map<string, TripFormSubmitAnswer>();
  for (const a of answers) {
    map.set(a.questionId, a);
  }
  return [...map.values()];
}

function allowedOptionValues(q: TripFormQuestionSnapshot): Set<string> {
  return new Set(q.options.map((o) => o.value));
}

/**
 * Validates answers against the published form. Throws `Error` with `.status = 400` on failure.
 * Required fields, formats (email/phone/number/url), and option membership only (no per-field conditional logic).
 */
export function assertTripFormSubmissionValid(questions: TripFormQuestionSnapshot[], answers: TripFormSubmitAnswer[]): void {
  const deduped = dedupeAnswersByQuestionId(answers);
  const byQ = new Map(deduped.map((a) => [a.questionId, a]));
  const qById = new Map(questions.map((q) => [q.id, q]));

  for (const a of deduped) {
    if (!qById.has(a.questionId)) {
      const e = new Error("UNKNOWN_QUESTION");
      (e as Error & { status?: number }).status = 400;
      throw e;
    }
  }

  const throwValidation = () => {
    const e = new Error("VALIDATION");
    (e as Error & { status?: number }).status = 400;
    throw e;
  };

  for (const q of questions) {
    const a = byQ.get(q.id);
    const val = norm(a?.value);
    const file = norm(a?.fileUrl);
    const textOrFile = val || file;

    if (q.isRequired) {
      if (q.type === "FILE_UPLOAD") {
        if (!file || !/^https?:\/\//i.test(file)) throwValidation();
      } else if (q.type === "CHECKBOXES") {
        const parts = val
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        if (parts.length === 0) throwValidation();
        const allowed = allowedOptionValues(q);
        for (const p of parts) {
          if (!allowed.has(p)) throwValidation();
        }
      } else if (q.type === "MULTIPLE_CHOICE" || q.type === "DROPDOWN") {
        if (!val) throwValidation();
        if (!allowedOptionValues(q).has(val)) throwValidation();
      } else if (!textOrFile) {
        throwValidation();
      }
    }

    if (q.type === "EMAIL" && val && !EMAIL_RE.test(val)) throwValidation();
    if (q.type === "PHONE" && val) {
      const digits = val.replace(/\D/g, "");
      if (digits.length < 8) throwValidation();
    }
    if (q.type === "NUMBER" && val) {
      if (!Number.isFinite(Number(val))) throwValidation();
    }
    if ((q.type === "MULTIPLE_CHOICE" || q.type === "DROPDOWN") && val && !q.isRequired) {
      if (!allowedOptionValues(q).has(val)) throwValidation();
    }
    if (q.type === "CHECKBOXES" && val && !q.isRequired) {
      const parts = val
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const allowed = allowedOptionValues(q);
      for (const p of parts) {
        if (!allowed.has(p)) throwValidation();
      }
    }
    if (q.type === "FILE_UPLOAD" && file && !/^https?:\/\//i.test(file)) throwValidation();
  }
}

export function filterAnswersToFormQuestions(
  questions: TripFormQuestionSnapshot[],
  answers: TripFormSubmitAnswer[],
): TripFormSubmitAnswer[] {
  const ids = new Set(questions.map((q) => q.id));
  return dedupeAnswersByQuestionId(answers).filter((a) => ids.has(a.questionId));
}
