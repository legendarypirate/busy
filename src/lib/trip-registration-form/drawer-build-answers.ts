import type { HomeTripDrawerSchemaItem } from "@/lib/trip-registration-form/service";
import type { TripFormSubmitAnswer } from "@/lib/trip-registration-form/submit-validation";

export function buildTripDrawerAnswersFromForm(
  schema: HomeTripDrawerSchemaItem[],
  form: HTMLFormElement,
): TripFormSubmitAnswer[] {
  const out: TripFormSubmitAnswer[] = [];
  for (const q of schema) {
    if (q.type === "checkbox") {
      const sel = form.querySelectorAll<HTMLInputElement>(`input[name="answers[${q.name}][]"]:checked`);
      const parts = [...sel].map((i) => i.value.trim()).filter(Boolean);
      out.push({ questionId: q.name, value: parts.length ? parts.join(",") : null });
      continue;
    }
    const named = form.elements.namedItem(`answers[${q.name}]`);
    let value: string | null = null;
    if (named instanceof RadioNodeList) {
      value = named.value ? String(named.value) : null;
    } else if (named instanceof HTMLInputElement || named instanceof HTMLTextAreaElement || named instanceof HTMLSelectElement) {
      const v = named.value?.trim() ?? "";
      value = v === "" ? null : v;
    }
    out.push({ questionId: q.name, value });
  }
  return out;
}
