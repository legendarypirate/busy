/**
 * Maps Google Forms API `forms` JSON to BUSY trip `registration_form_json` rows
 * (same shape as `PlatformTripRegistrationJsonBuilder` / legacy PHP builder).
 */

export type LegacyRegistrationQuestion = {
  name: string;
  label: string;
  type: string;
  required?: number;
  placeholder?: string;
  options?: string[];
};

function rec(x: unknown): Record<string, unknown> | null {
  return x !== null && typeof x === "object" ? (x as Record<string, unknown>) : null;
}

function str(x: unknown): string {
  return typeof x === "string" ? x : "";
}

function choiceOptions(choice: Record<string, unknown>): string[] {
  const opts = choice.options;
  if (!Array.isArray(opts)) return [];
  const out: string[] = [];
  for (const o of opts) {
    const r = rec(o);
    if (!r) continue;
    const v = str(r.value).trim();
    if (v) out.push(v);
  }
  return out;
}

function inferEmailFromLabel(label: string): boolean {
  return /e-?mail|имэйл|цахим\s*шуудан|@\s*хаяг|email/i.test(label);
}

function inferPhoneFromLabel(label: string): boolean {
  return /утас|phone|mobile|гар\s*утас|дугаар/i.test(label);
}

function mapTextQuestion(label: string, paragraph: boolean, required: number): LegacyRegistrationQuestion {
  const base: LegacyRegistrationQuestion = {
    name: "",
    label,
    type: paragraph ? "textarea" : "text",
    required,
    placeholder: "",
  };
  if (!paragraph && inferEmailFromLabel(label)) {
    base.type = "email";
  } else if (!paragraph && inferPhoneFromLabel(label)) {
    base.type = "tel";
  }
  return base;
}

function mapScaleQuestion(
  qid: string,
  title: string,
  scale: Record<string, unknown>,
  required: number,
): LegacyRegistrationQuestion {
  const low = Number(scale.low ?? 1);
  const high = Number(scale.high ?? 5);
  const lo = Number.isFinite(low) ? Math.floor(low) : 1;
  const hi = Number.isFinite(high) ? Math.floor(high) : 5;
  const options: string[] = [];
  for (let n = lo; n <= hi; n++) options.push(String(n));
  return {
    name: qid,
    label: title || "Үнэлгээ",
    type: "radio",
    required,
    options: options.length ? options : ["1", "2", "3", "4", "5"],
  };
}

/**
 * Converts `GET https://forms.googleapis.com/v1/forms/{id}` body to legacy rows.
 * Skips section headers, images, grids, and items without a question payload.
 */
export function googleFormJsonToLegacyQuestions(form: unknown): LegacyRegistrationQuestion[] {
  const root = rec(form);
  if (!root) return [];
  const items = root.items;
  if (!Array.isArray(items)) return [];

  const out: LegacyRegistrationQuestion[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = rec(items[i]);
    if (!item) continue;

    const title = str(item.title).trim();
    const qItem = rec(item.questionItem);
    if (!qItem) continue;
    const question = rec(qItem.question);
    if (!question) continue;

    const qid = str(question.questionId).trim() || `gf_${i}`;
    const required = question.required === true ? 1 : 0;

    const choice = rec(question.choiceQuestion);
    if (choice) {
      const typ = str(choice.type).toUpperCase();
      let options = choiceOptions(choice);
      if (options.length === 0) {
        const other = choice.includeOther === true;
        if (other) options = ["Бусад"];
      }
      if (typ === "CHECKBOX") {
        out.push({
          name: qid,
          label: title || "Олон сонголт",
          type: "checkbox",
          required,
          options: options.length ? options : ["Сонголт 1", "Сонголт 2"],
        });
        continue;
      }
      if (typ === "DROP_DOWN") {
        out.push({
          name: qid,
          label: title || "Жагсаалт",
          type: "select",
          required,
          options: options.length ? options : ["Сонголт 1", "Сонголт 2"],
        });
        continue;
      }
      out.push({
        name: qid,
        label: title || "Нэг сонголт",
        type: "radio",
        required,
        options: options.length ? options : ["Тийм", "Үгүй"],
      });
      continue;
    }

    const textQ = rec(question.textQuestion);
    if (textQ) {
      const paragraph = textQ.paragraph === true;
      const row = mapTextQuestion(title || (paragraph ? "Текст" : "Талбар"), paragraph, required);
      row.name = qid;
      out.push(row);
      continue;
    }

    if (rec(question.dateQuestion)) {
      out.push({ name: qid, label: title || "Огноо", type: "date", required, placeholder: "" });
      continue;
    }

    if (rec(question.timeQuestion)) {
      out.push({ name: qid, label: title || "Цаг", type: "text", required, placeholder: "HH:MM" });
      continue;
    }

    const scale = rec(question.scaleQuestion);
    if (scale) {
      out.push(mapScaleQuestion(qid, title, scale, required));
      continue;
    }

    if (rec(question.fileUploadQuestion)) {
      out.push({
        name: qid,
        label: title || "Файл",
        type: "text",
        required,
        placeholder: "Файлын холбоос (URL)",
      });
      continue;
    }
  }

  return out.filter((r) => r.label.trim() !== "" || (r.options && r.options.length > 0));
}
