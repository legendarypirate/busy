import type { TripFormQuestionType } from "@prisma/client";

export type DefaultQuestionSeed = {
  label: string;
  description?: string;
  type: TripFormQuestionType;
  placeholder?: string;
  isRequired: boolean;
  options?: { label: string; value: string }[];
};

/** Starter set — expand toward full Google Forms parity over iterations. */
export function defaultBusinessTripRegistrationQuestions(): DefaultQuestionSeed[] {
  return [
    { label: "Бүтэн нэр", type: "SHORT_TEXT", isRequired: true, placeholder: "Овог нэр" },
    { label: "Утасны дугаар", type: "PHONE", isRequired: true },
    { label: "Имэйл хаяг", type: "EMAIL", isRequired: true },
    { label: "Компанийн нэр", type: "SHORT_TEXT", isRequired: true },
    { label: "Албан тушаал", type: "SHORT_TEXT", isRequired: false },
    { label: "Үйл ажиллагааны чиглэл / салбар", type: "SHORT_TEXT", isRequired: false },
    {
      label: "Энэ аялалд оролцох гол зорилго",
      type: "LONG_TEXT",
      isRequired: true,
      placeholder: "Товчхон бичнэ үү",
    },
    {
      label: "Төлбөрийн баримт (хэрэв шаардлагатай бол)",
      type: "FILE_UPLOAD",
      isRequired: false,
    },
  ];
}
