"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeTripDrawerSchemaItem } from "@/lib/trip-registration-form/service";
import type { TripFormSubmitAnswer } from "@/lib/trip-registration-form/submit-validation";

async function readResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`Сервер хоосон хариу илгээсэн (HTTP ${res.status}). API / nginx тохиргоо шалгана уу.`);
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`JSON биш хариу (HTTP ${res.status}).`);
  }
}

function buildAnswersFromForm(
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

export default function HomeTripRegisterDrawer() {
  const [open, setOpen] = useState(false);
  const [tripId, setTripId] = useState<number | null>(null);
  const [tripTitle, setTripTitle] = useState("Олон улсын бизнес аялал");
  const [schema, setSchema] = useState<HomeTripDrawerSchemaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; kind: "" | "loading" | "success" | "error" }>({
    text: "",
    kind: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    document.body.classList.remove("trip-register-open");
    setFeedback({ text: "", kind: "" });
  }, []);

  const loadSchema = useCallback(async (id: number) => {
    setLoading(true);
    setSchema([]);
    setFeedback({ text: "", kind: "" });
    try {
      const res = await fetch(`/api/public/trips/${id}/registration`, { cache: "no-store" });
      const data = await readResponseJson<{
        success?: boolean;
        tripTitle?: string;
        schema?: HomeTripDrawerSchemaItem[];
        message?: string;
      }>(res);
      if (!res.ok || !data.success || !Array.isArray(data.schema)) {
        throw new Error(data.message || "Формын асуулга ачаалж чадсангүй.");
      }
      if (data.tripTitle) setTripTitle(data.tripTitle);
      setSchema(data.schema);
      setFeedback({ text: "", kind: "" });
    } catch (e) {
      setFeedback({
        text: e instanceof Error ? e.message : "Форм ачаалах үед алдаа гарлаа.",
        kind: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const openDrawer = useCallback(
    (id: number, title: string) => {
      setTripId(id);
      if (title) setTripTitle(title);
      setOpen(true);
      document.body.classList.add("trip-register-open");
      void loadSchema(id);
    },
    [loadSchema],
  );

  useEffect(() => {
    return () => {
      document.body.classList.remove("trip-register-open");
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const btn = t?.closest(".js-trip-register-btn") as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      const idRaw = btn.getAttribute("data-trip-id")?.trim();
      const id = idRaw ? Number.parseInt(idRaw, 10) : NaN;
      if (!Number.isFinite(id) || id < 1) return;
      const title = btn.getAttribute("data-trip-title")?.trim() || "";
      openDrawer(id, title);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openDrawer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tripId || !formRef.current) {
      setFeedback({ text: "Аяллын ID олдсонгүй. Хуудсыг дахин ачаална уу.", kind: "error" });
      return;
    }
    const answers = buildAnswersFromForm(schema, formRef.current);
    setFeedback({ text: "Илгээж байна...", kind: "loading" });
    try {
      const res = await fetch(`/api/public/trips/${tripId}/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await readResponseJson<{ success?: boolean; message?: string }>(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Бүртгэл хадгалах үед алдаа гарлаа.");
      }
      setFeedback({ text: data.message || "Таны бүртгэлийг амжилттай хүлээн авлаа.", kind: "success" });
      formRef.current.reset();
      window.setTimeout(() => closeDrawer(), 600);
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Серверийн алдаа гарлаа. Дахин оролдоно уу.",
        kind: "error",
      });
    }
  }

  const feedbackClass =
    feedback.kind === ""
      ? "trip-register-feedback"
      : `trip-register-feedback is-${feedback.kind}`;

  return (
    <>
      <div
        className="trip-register-overlay"
        id="tripRegisterOverlay"
        hidden={!open}
        onClick={closeDrawer}
        aria-hidden={!open}
      />
      <aside
        className={`trip-register-drawer${open ? " is-open" : ""}`}
        id="tripRegisterDrawer"
        aria-hidden={!open}
        aria-labelledby="tripRegisterTitle"
      >
        <div className="trip-register-drawer__header">
          <div>
            <h3 id="tripRegisterTitle" className="trip-register-drawer__title">
              Эвэнт / Аяллын бүртгэл
            </h3>
            <p className="trip-register-drawer__subtitle mb-0" id="tripRegisterTripName">
              {tripTitle}
            </p>
          </div>
          <button type="button" className="trip-register-drawer__close" aria-label="Хаах" onClick={closeDrawer}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form ref={formRef} className="trip-register-form" noValidate onSubmit={onSubmit}>
          <input type="hidden" name="trip_id" value={tripId ?? ""} readOnly />

          <div id="tripRegisterDynamicFields">
            {loading ? <div className="small text-muted">Форм ачаалж байна...</div> : null}
            {!loading && feedback.kind === "error" && schema.length === 0 ? (
              <div className="small text-danger">{feedback.text}</div>
            ) : null}
            {!loading &&
              schema.map((q, idx) => {
                const num = idx + 1;
                const req = q.required ? " *" : "";
                const label = (
                  <span>
                    {num}. {q.label}
                    {req}
                  </span>
                );

                if (q.type === "textarea") {
                  return (
                    <label key={q.name} className="trip-register-field">
                      {label}
                      <textarea
                        name={`answers[${q.name}]`}
                        rows={3}
                        required={q.required}
                        placeholder={q.placeholder}
                      />
                    </label>
                  );
                }
                if (q.type === "select" && q.options?.length) {
                  return (
                    <label key={q.name} className="trip-register-field">
                      {label}
                      <select name={`answers[${q.name}]`} required={q.required}>
                        <option value="">Сонгох</option>
                        {q.options.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                if ((q.type === "radio" || q.type === "checkbox") && q.options?.length) {
                  const isRadio = q.type === "radio";
                  return (
                    <fieldset key={q.name} className="trip-register-fieldset">
                      <legend>
                        {num}. {q.label}
                        {req}
                      </legend>
                      {isRadio ? (
                        <div className="trip-register-inline-options">
                          {q.options.map((op) => (
                            <label key={op}>
                              <input
                                type="radio"
                                name={`answers[${q.name}]`}
                                value={op}
                                required={q.required}
                              />{" "}
                              {op}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="trip-register-checkboxes">
                          {q.options.map((op) => (
                            <label key={op}>
                              <input type="checkbox" name={`answers[${q.name}][]`} value={op} /> {op}
                            </label>
                          ))}
                        </div>
                      )}
                    </fieldset>
                  );
                }
                const inputType = q.type === "number" ? "number" : q.type === "email" ? "email" : q.type === "tel" ? "tel" : "text";
                return (
                  <label key={q.name} className="trip-register-field">
                    {label}
                    <input
                      type={inputType}
                      name={`answers[${q.name}]`}
                      required={q.required}
                      placeholder={q.placeholder}
                    />
                  </label>
                );
              })}
          </div>

          <div className="trip-register-actions">
            <button type="button" className="btn-exact-outline" onClick={closeDrawer}>
              Хаах
            </button>
            <button
              type="submit"
              className="btn-qpay"
              disabled={loading || schema.length === 0 || feedback.kind === "loading"}
            >
              Бүртгүүлэх
            </button>
          </div>
          {feedback.text && (schema.length > 0 || feedback.kind !== "error") ? (
            <div className={feedbackClass} role="status" aria-live="polite">
              {feedback.text}
            </div>
          ) : null}
        </form>
      </aside>
    </>
  );
}
