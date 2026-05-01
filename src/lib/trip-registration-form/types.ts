import type { TripFormQuestionType } from "@prisma/client";

export type { TripFormQuestionType };

/** MVP question types shown in builder (matches Prisma enum subset). */
export const MVP_TRIP_FORM_QUESTION_TYPES: TripFormQuestionType[] = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "MULTIPLE_CHOICE",
  "CHECKBOXES",
  "DROPDOWN",
  "DATE",
  "PHONE",
  "EMAIL",
  "FILE_UPLOAD",
  "NUMBER",
];

export const TRIP_FORM_QUESTION_LABELS_MN: Record<TripFormQuestionType, string> = {
  SHORT_TEXT: "Богино хариулт",
  LONG_TEXT: "Урт текст",
  MULTIPLE_CHOICE: "Олон сонголт (нэг)",
  CHECKBOXES: "Чекбокс",
  DROPDOWN: "Доошоо жагсаалт",
  DATE: "Огноо",
  TIME: "Цаг",
  PHONE: "Утас",
  EMAIL: "Имэйл",
  FILE_UPLOAD: "Файл хавсаргах",
  NUMBER: "Тоо",
  YES_NO: "Тийм / Үгүй",
  COUNTRY: "Улс",
  COMPANY_BLOCK: "Компанийн мэдээлэл (блок)",
  EMERGENCY_CONTACT_BLOCK: "Яаралтай холбоо (блок)",
  PAYMENT_CONFIRMATION_BLOCK: "Төлбөр баталгаа (блок)",
};
