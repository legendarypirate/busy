"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TripFormQuestionType } from "@prisma/client";
import { tripFormUi as ui } from "@/components/trip-registration/trip-form-ui";

/** YYYY.MM.DD from trip ISO — identical on server and client (avoids `toLocaleDateString` hydration mismatch). */
function formatTripDateLabel(iso: string): string {
  const head = iso.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(head);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}.${mo}.${day}`;
}

export type PublicFormQuestion = {
  id: string;
  label: string;
  description: string | null;
  type: TripFormQuestionType;
  placeholder: string | null;
  isRequired: boolean;
  sortOrder: number;
  options: { id: string; label: string; value: string }[];
};

export type PublicFormPayload = {
  title: string;
  description: string | null;
  publicSlug: string;
  settings: unknown;
  trip: { id: number; destination: string; startDate: string; endDate: string; coverImageUrl: string | null };
  questions: PublicFormQuestion[];
};

export default function PublicTripRegistrationForm({ form }: { form: PublicFormPayload }) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...form.questions].sort((a, b) => a.sortOrder - b.sortOrder),
    [form.questions],
  );

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of sorted) {
      if (q.type === "CHECKBOXES") init[q.id] = "";
      else init[q.id] = "";
    }
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function setVal(questionId: string, v: string) {
    setValues((prev) => ({ ...prev, [questionId]: v }));
  }

  function toggleCheckbox(questionId: string, optionValue: string, checked: boolean) {
    setValues((prev) => {
      const raw = prev[questionId] ?? "";
      const parts = raw ? raw.split("\u0001").filter(Boolean) : [];
      const next = new Set(parts);
      if (checked) next.add(optionValue);
      else next.delete(optionValue);
      return { ...prev, [questionId]: [...next].join("\u0001") };
    });
  }

  function stripFormText(s: string): string {
    return s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  }

  function countPhoneDigits(s: string): number {
    const m = s.match(/\p{Nd}/gu);
    return m ? m.length : 0;
  }

  function validate(): { formError: string | null; byField: Record<string, string> } {
    const byField: Record<string, string> = {};
    for (const q of sorted) {
      if (!q.isRequired) continue;
      const v = stripFormText(values[q.id] ?? "");
      if (q.type === "CHECKBOXES") {
        if (!v) {
          byField[q.id] = "Заавал бөглөнө.";
          return { formError: `"${q.label}" заавал бөглөнө үү`, byField };
        }
      } else if (q.type === "FILE_UPLOAD") {
        if (v && !/^https?:\/\//i.test(v)) {
          byField[q.id] = "Зөв URL оруулна уу (https://...).";
          return { formError: `"${q.label}" зөв файлын холбоос оруулна уу`, byField };
        }
        if (q.isRequired && !v) {
          byField[q.id] = "Заавал бөглөнө.";
          return { formError: `"${q.label}" заавал бөглөнө үү`, byField };
        }
      } else if (!v) {
        byField[q.id] = "Заавал бөглөнө.";
        return { formError: `"${q.label}" заавал бөглөнө үү`, byField };
      }
      if (q.type === "EMAIL" && v) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          byField[q.id] = "Имэйл форматаа шалгана уу.";
          return { formError: `"${q.label}" зөв имэйл оруулна уу`, byField };
        }
      }
      if (q.type === "PHONE" && v) {
        if (countPhoneDigits(v) < 8) {
          byField[q.id] = "Утасны дугаар хамгийн багадаа 8 оронтой.";
          return { formError: `"${q.label}" зөв утас оруулна уу`, byField };
        }
      }
    }
    for (const q of sorted) {
      const v = stripFormText(values[q.id] ?? "");
      if (q.type === "MULTIPLE_CHOICE" || q.type === "DROPDOWN") {
        if (v && !q.options.some((o) => o.value === v)) {
          byField[q.id] = "Жагсаалтаас зөв сонголт хийнэ үү.";
          return { formError: `"${q.label}" сонголтыг зөв сонгоно уу`, byField };
        }
      }
      if (q.type === "CHECKBOXES" && v) {
        const parts = v.includes("\u0001")
          ? v.split("\u0001").filter(Boolean)
          : v
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
        const allowed = new Set(q.options.map((o) => o.value));
        for (const p of parts) {
          if (!allowed.has(p)) {
            byField[q.id] = "Сонголтоо шалгана уу.";
            return { formError: `"${q.label}" сонголтыг зөв сонгоно уу`, byField };
          }
        }
      }
      if (q.type === "NUMBER" && v && !Number.isFinite(Number(v))) {
        byField[q.id] = "Тоо оруулна уу.";
        return { formError: `"${q.label}" тоо оруулна уу`, byField };
      }
    }
    return { formError: null, byField };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const vRes = validate();
    if (vRes.formError) {
      setFieldErrors(vRes.byField);
      setError(vRes.formError);
      return;
    }
    setBusy(true);
    try {
      const answers = sorted.map((q) => {
        const raw = values[q.id] ?? "";
        const checkboxJoined =
          q.type === "CHECKBOXES" ? raw.split("\u0001").filter(Boolean).join(", ") : raw;
        if (q.type === "FILE_UPLOAD" && /^https?:\/\//i.test(checkboxJoined.trim())) {
          return { questionId: q.id, value: null, fileUrl: checkboxJoined.trim() };
        }
        return {
          questionId: q.id,
          value: q.type === "CHECKBOXES" ? checkboxJoined : raw,
          fileUrl: null as string | null,
        };
      });
      const res = await fetch(`/api/public/forms/${encodeURIComponent(form.publicSlug)}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        responseId?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        const err = data.error;
        const vCode = data.code;
        setError(
          err === "validation"
            ? vCode === "phone"
              ? "Утасны дугаар хамгийн багадаа 8 оронтой тоо байх ёстой (улсын код оруулсан бол тохирно)."
              : vCode === "email"
                ? "Имэйл хаягаа шалгана уу."
                : vCode === "choice"
                  ? "Сонголтоо шалгана уу (хуудсыг дахин ачаалж дахин сонгоно уу)."
                  : vCode === "required"
                    ? "Заавал талбаруудыг бөглөнө үү."
                    : vCode === "number"
                      ? "Тоо талбарыг зөв бөглөнө үү."
                      : vCode === "file_url"
                        ? "Файлын холбоосыг (https…) зөв оруулна уу."
                        : "Мэдээллээ шалгана уу (заавал талбар, имэйл/утас, сонголт)."
            : err === "unknown_question"
              ? "Форм шинэчлэгдсэн байж магадгүй. Хуудсыг дахин ачаална уу."
              : err === "submit_failed"
                ? "Илгээхэд алдаа гарлаа. Мэдээллээ шалгана уу."
                : "Алдаа гарлаа.",
        );
        setFieldErrors({});
        return;
      }
      const rid = data.responseId ?? "";
      router.push(`/register/${encodeURIComponent(form.publicSlug)}/success?responseId=${encodeURIComponent(rid)}`);
    } finally {
      setBusy(false);
    }
  }

  const start = formatTripDateLabel(form.trip.startDate);
  const end = formatTripDateLabel(form.trip.endDate);

  return (
    <div className={`min-h-screen ${ui.pageBg} px-4 py-6 sm:py-10`}>
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex flex-col items-center text-center">
          <span className={ui.badge}>Бүртгэлийн форм</span>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Асуулт {sorted.length} · {form.trip.destination}
          </p>
        </div>
        <div className={`${ui.card} mb-6`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">BUSY.mn</p>
          <p className="mt-1 text-sm text-slate-500">{form.trip.destination}</p>
          <p className="text-xs text-slate-400">
            {start} — {end}
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{form.title}</h1>
          {form.description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{form.description}</p> : null}
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {sorted.map((q, idx) => (
            <div key={q.id} className={ui.cardAccent}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <label className="text-base font-semibold text-slate-900" htmlFor={`q-${q.id}`}>
                  {idx + 1}/{sorted.length}. {q.label}
                  {q.isRequired ? <span className="text-red-500"> *</span> : null}
                </label>
              </div>
              {q.description ? <p className="mb-3 text-sm text-slate-500">{q.description}</p> : null}

              {q.type === "SHORT_TEXT" || q.type === "PHONE" || q.type === "EMAIL" ? (
                <input
                  id={`q-${q.id}`}
                  type={q.type === "EMAIL" ? "email" : q.type === "PHONE" ? "tel" : "text"}
                  className={`${ui.input} mt-1 ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                placeholder={q.placeholder ?? ""}
                value={values[q.id] ?? ""}
                onChange={(e) => setVal(q.id, e.target.value)}
              />
            ) : null}

              {q.type === "LONG_TEXT" ? (
                <textarea
                  id={`q-${q.id}`}
                  className={`${ui.textarea} mt-1 min-h-[140px] ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                placeholder={q.placeholder ?? ""}
                value={values[q.id] ?? ""}
                onChange={(e) => setVal(q.id, e.target.value)}
              />
            ) : null}

              {q.type === "NUMBER" ? (
                <input
                  id={`q-${q.id}`}
                  type="number"
                  className={`${ui.input} mt-1 ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                placeholder={q.placeholder ?? ""}
                value={values[q.id] ?? ""}
                onChange={(e) => setVal(q.id, e.target.value)}
              />
            ) : null}

              {q.type === "DATE" ? (
                <input
                  id={`q-${q.id}`}
                  type="date"
                  className={`${ui.input} mt-1 ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                value={values[q.id] ?? ""}
                onChange={(e) => setVal(q.id, e.target.value)}
              />
            ) : null}

              {q.type === "MULTIPLE_CHOICE" ? (
                <div className="mt-2 space-y-2">
                  {q.options.map((o) => (
                    <label
                      key={o.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-slate-800 transition hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="h-4 w-4 text-blue-600"
                        value={o.value}
                        checked={(values[q.id] ?? "") === o.value}
                        onChange={() => setVal(q.id, o.value)}
                      />
                      <span className="text-sm font-medium">{o.label}</span>
                    </label>
                  ))}
                </div>
              ) : null}

              {q.type === "CHECKBOXES" ? (
                <div className="mt-2 space-y-2">
                  {q.options.map((o) => {
                    const selected = new Set((values[q.id] ?? "").split("\u0001").filter(Boolean));
                    return (
                      <label
                        key={o.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-slate-800 transition hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          checked={selected.has(o.value)}
                          onChange={(e) => toggleCheckbox(q.id, o.value, e.target.checked)}
                        />
                        <span className="text-sm font-medium">{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}

              {q.type === "DROPDOWN" ? (
                <select
                  id={`q-${q.id}`}
                  className={`${ui.select} mt-1 ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                value={values[q.id] ?? ""}
                onChange={(e) => setVal(q.id, e.target.value)}
              >
                <option value="">Сонгоно уу</option>
                {q.options.map((o) => (
                  <option key={o.id} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : null}

              {q.type === "FILE_UPLOAD" ? (
                <input
                  id={`q-${q.id}`}
                  type="url"
                  className={`${ui.input} mt-1 ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                placeholder="Файлын холбоос (URL)"
                value={values[q.id] ?? ""}
                onChange={(e) => setVal(q.id, e.target.value)}
              />
            ) : null}

              {q.type === "TIME" ? (
                <input
                  id={`q-${q.id}`}
                  type="time"
                  className={`${ui.input} mt-1 ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                value={values[q.id] ?? ""}
                onChange={(e) => setVal(q.id, e.target.value)}
              />
            ) : null}

              {![
                "SHORT_TEXT",
                "LONG_TEXT",
                "MULTIPLE_CHOICE",
                "CHECKBOXES",
                "DROPDOWN",
                "DATE",
                "TIME",
                "PHONE",
                "EMAIL",
                "FILE_UPLOAD",
                "NUMBER",
              ].includes(q.type) ? (
                <input
                  id={`q-${q.id}`}
                  type="text"
                  className={`${ui.input} mt-1 ${fieldErrors[q.id] ? "border-red-400 focus:border-red-500 focus:ring-red-500/15" : ""}`}
                  placeholder={q.placeholder ?? ""}
                  value={values[q.id] ?? ""}
                  onChange={(e) => setVal(q.id, e.target.value)}
                />
              ) : null}
              {fieldErrors[q.id] ? <p className="mt-2 text-xs font-medium text-red-600">{fieldErrors[q.id]}</p> : null}
            </div>
          ))}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          ) : null}

          <button type="submit" disabled={busy} className={ui.btnPrimary + " w-full py-4 text-base"}>
            {busy ? "Илгээж байна…" : "Илгээх"}
          </button>
        </form>
      </div>
    </div>
  );
}
