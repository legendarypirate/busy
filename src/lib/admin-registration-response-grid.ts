/** Merged answer row (same shape as answersForOrganizerApi output). */
export type AdminGridMergedAnswer = {
  questionId: string;
  questionLabel: string;
  value: string | null;
  fileUrl: string | null;
};

export type AdminGridResponseInput = {
  id: string;
  submittedAt: string;
  who: string;
  answers: AdminGridMergedAnswer[];
};

export type AdminGridQuestionCol = { id: string; label: string };

export type AdminGridResponseRow = {
  id: string;
  submittedAt: string;
  who: string;
  /** Display string per question id (value + optional file URL). */
  cellByQuestionId: Record<string, string>;
};

export type AdminGridSection = {
  /** 1-based section for UI */
  sectionNo: number;
  /** Sorted question ids joined — detects form shape changes */
  signature: string;
  questionColumns: AdminGridQuestionCol[];
  responses: AdminGridResponseRow[];
};

function cellDisplay(a: AdminGridMergedAnswer): string {
  const v = (a.value ?? "").trim();
  const f = (a.fileUrl ?? "").trim();
  if (v && f) return `${v}\n${f}`;
  if (f) return f;
  if (v) return v;
  return "—";
}

function signatureOf(answers: AdminGridMergedAnswer[]): string {
  const ids = [...new Set(answers.map((a) => a.questionId))];
  ids.sort();
  return ids.join("|");
}

function columnsFromFirstRow(answers: AdminGridMergedAnswer[]): AdminGridQuestionCol[] {
  const out: AdminGridQuestionCol[] = [];
  const seen = new Set<string>();
  for (const a of answers) {
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    out.push({ id: a.questionId, label: a.questionLabel.trim() || a.questionId });
  }
  return out;
}

/**
 * Groups responses by “form era”: when the set of question IDs changes (reorder ignored),
 * a new section starts so each block is an Excel-style table with consistent columns.
 * Pass rows sorted by submittedAt ascending (oldest first).
 */
export function buildRegistrationGridSections(sortedAsc: AdminGridResponseInput[]): AdminGridSection[] {
  const sections: AdminGridSection[] = [];
  let current: AdminGridSection | null = null;

  for (const row of sortedAsc) {
    const sig = signatureOf(row.answers);
    if (!current || current.signature !== sig) {
      current = {
        sectionNo: sections.length + 1,
        signature: sig,
        questionColumns: columnsFromFirstRow(row.answers),
        responses: [],
      };
      sections.push(current);
    }

    const cellByQuestionId: Record<string, string> = {};
    for (const a of row.answers) {
      cellByQuestionId[a.questionId] = cellDisplay(a);
    }
    current.responses.push({
      id: row.id,
      submittedAt: row.submittedAt,
      who: row.who,
      cellByQuestionId,
    });
  }

  return sections;
}
