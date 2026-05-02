import type { TripFormQuestionType } from "@prisma/client";

/** Sub-reason for 400 validation (safe to expose to clients). */
export type TripFormValidationCode =
  | "required"
  | "email"
  | "phone"
  | "number"
  | "choice"
  | "file_url";

export class TripFormValidationError extends Error {
  readonly status = 400;
  constructor(public readonly code: TripFormValidationCode) {
    super("VALIDATION");
    this.name = "TripFormValidationError";
  }
}

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
  options: { value: string; label: string }[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim, strip ZWSP/BOM (common in pasted labels/phones), then trim again. */
function norm(s: string | null | undefined): string {
  const raw = s == null ? "" : typeof s === "string" ? s : String(s);
  return raw.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function countDecimalDigits(s: string): number {
  const m = s.match(/\p{Nd}/gu);
  return m ? m.length : 0;
}

function throwV(code: TripFormValidationCode): never {
  throw new TripFormValidationError(code);
}

/** Normalize for option membership (trim + Unicode NFC so Cyrillic/Mongolian matches DB vs browser). */
function normKey(s: string): string {
  return norm(s).normalize("NFC");
}

function checkboxParts(val: string): string[] {
  const t = norm(val);
  if (!t) return [];
  if (t.includes("\u0001")) {
    return t.split("\u0001").map((x) => x.trim()).filter(Boolean);
  }
  return t.split(",").map((x) => x.trim()).filter(Boolean);
}

/** True if token equals some option's value or label (after normKey). */
function isAllowedOptionToken(q: TripFormQuestionSnapshot, token: string): boolean {
  const k = normKey(token);
  if (!k) return false;
  if (!q.options.length) return false;
  for (const o of q.options) {
    if (normKey(o.value) === k) return true;
    if (normKey(o.label) === k) return true;
  }
  return false;
}

export function dedupeAnswersByQuestionId(answers: TripFormSubmitAnswer[]): TripFormSubmitAnswer[] {
  const map = new Map<string, TripFormSubmitAnswer>();
  for (const a of answers) {
    map.set(a.questionId, a);
  }
  return [...map.values()];
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

  for (const q of questions) {
    const a = byQ.get(q.id);
    const val = norm(a?.value);
    const file = norm(a?.fileUrl);
    const textOrFile = val || file;

    if (q.isRequired) {
      if (q.type === "FILE_UPLOAD") {
        if (!file || !/^https?:\/\//i.test(file)) throwV("file_url");
      } else if (q.type === "CHECKBOXES") {
        const parts = checkboxParts(val);
        if (parts.length === 0) throwV("required");
        for (const p of parts) {
          if (!isAllowedOptionToken(q, p)) throwV("choice");
        }
      } else if (q.type === "MULTIPLE_CHOICE" || q.type === "DROPDOWN") {
        if (!val) throwV("required");
        if (!isAllowedOptionToken(q, val)) throwV("choice");
      } else if (!textOrFile) {
        throwV("required");
      }
    }

    if (q.type === "EMAIL" && val && !EMAIL_RE.test(val)) throwV("email");
    if (q.type === "PHONE" && val) {
      if (countDecimalDigits(val) < 8) throwV("phone");
    }
    if (q.type === "NUMBER" && val) {
      if (!Number.isFinite(Number(val))) throwV("number");
    }
    if ((q.type === "MULTIPLE_CHOICE" || q.type === "DROPDOWN") && val && !q.isRequired) {
      if (!isAllowedOptionToken(q, val)) throwV("choice");
    }
    if (q.type === "CHECKBOXES" && val && !q.isRequired) {
      const parts = checkboxParts(val);
      for (const p of parts) {
        if (!isAllowedOptionToken(q, p)) throwV("choice");
      }
    }
    if (q.type === "FILE_UPLOAD" && file && !/^https?:\/\//i.test(file)) throwV("file_url");
  }
}

export function filterAnswersToFormQuestions(
  questions: TripFormQuestionSnapshot[],
  answers: TripFormSubmitAnswer[],
): TripFormSubmitAnswer[] {
  const ids = new Set(questions.map((q) => q.id));
  return dedupeAnswersByQuestionId(answers).filter((a) => ids.has(a.questionId));
}
