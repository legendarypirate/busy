import type { Prisma } from "@prisma/client";
import {
  legacyStringToTripType,
  needsTripOptions,
  stableLegacyQuestionId,
  type LegacyRegistrationRow,
} from "@/lib/trip-registration-form/sync-registration-form-from-json";

/**
 * `deleteMany` биш — хуучин хариулттай асуултыг CASCADE-ээр устгахгүй.
 * Шинэ JSON-тай таарахгүй үлдсэн асуултууд: хариулттай бол `retiredFromForm`, хариултгүй бол устгана.
 */
export async function upsertTripFormQuestionsFromLegacyRows(
  tx: Prisma.TransactionClient,
  formId: string,
  rows: LegacyRegistrationRow[],
): Promise<void> {
  const desired = rows.map((row, idx) => ({
    id: stableLegacyQuestionId(row.name, idx),
    sortOrder: idx,
    row,
  }));
  const desiredIds = new Set(desired.map((d) => d.id));

  const existing = await tx.tripFormQuestion.findMany({
    where: { formId },
    select: { id: true },
  });

  const answerQuestionRows = await tx.tripFormResponseAnswer.findMany({
    where: { response: { formId } },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  const questionIdsWithAnswers = new Set(answerQuestionRows.map((r) => r.questionId));

  for (const d of desired) {
    const row = d.row;
    const type = legacyStringToTripType(row.type);
    const isRequired = row.required === 1;

    await tx.tripFormQuestion.upsert({
      where: { id: d.id },
      create: {
        id: d.id,
        formId,
        label: row.label.trim(),
        description: null,
        type,
        placeholder: row.placeholder.trim() || null,
        isRequired,
        sortOrder: d.sortOrder,
        retiredFromForm: false,
      },
      update: {
        formId,
        label: row.label.trim(),
        type,
        placeholder: row.placeholder.trim() || null,
        isRequired,
        sortOrder: d.sortOrder,
        retiredFromForm: false,
      },
    });

    await tx.tripFormQuestionOption.deleteMany({ where: { questionId: d.id } });
    if (needsTripOptions(type)) {
      const opts = row.options.length > 0 ? row.options : ["Сонголт 1", "Сонголт 2"];
      await tx.tripFormQuestionOption.createMany({
        data: opts.map((label, i) => ({
          questionId: d.id,
          label,
          value: label,
          sortOrder: i,
        })),
      });
    }
  }

  let retireSeq = 0;
  for (const ex of existing) {
    if (desiredIds.has(ex.id)) continue;
    if (questionIdsWithAnswers.has(ex.id)) {
      await tx.tripFormQuestion.update({
        where: { id: ex.id },
        data: {
          retiredFromForm: true,
          sortOrder: 900_000 + retireSeq++,
        },
      });
    } else {
      await tx.tripFormQuestionOption.deleteMany({ where: { questionId: ex.id } });
      await tx.tripFormQuestion.delete({ where: { id: ex.id } });
    }
  }
}
