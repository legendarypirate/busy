"use client";

import type { ReactNode } from "react";
import type { RefObject } from "react";
import type { HomeTripDrawerSchemaItem } from "@/lib/trip-registration-form/service";

type Feedback = { text: string; kind: "" | "loading" | "success" | "error" };

type Props = {
  open: boolean;
  onClose: () => void;
  tripTitle: string;
  /** Trip public registration (drawer posts to `/api/public/trips/:id/registration`). */
  tripId?: number | null;
  /** Event public registration (drawer posts to `/api/public/events/:id/registration`). */
  eventId?: string | null;
  loading: boolean;
  schema: HomeTripDrawerSchemaItem[];
  feedback: Feedback;
  fieldErrors?: Record<string, string>;
  formRef: RefObject<HTMLFormElement | null>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  beforeActions?: ReactNode;
};

export function TripRegistrationDrawerShell({
  open,
  onClose,
  tripTitle,
  tripId = null,
  eventId = null,
  loading,
  schema,
  feedback,
  fieldErrors = {},
  formRef,
  onSubmit,
  beforeActions,
}: Props) {
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
        onClick={onClose}
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
          <button type="button" className="trip-register-drawer__close" aria-label="Хаах" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form ref={formRef} className="trip-register-form" noValidate onSubmit={onSubmit}>
          {eventId ? (
            <input type="hidden" name="event_id" value={eventId} readOnly />
          ) : (
            <input type="hidden" name="trip_id" value={tripId ?? ""} readOnly />
          )}

          {feedback.kind === "success" && feedback.text ? (
            <div
              className="mx-3 mt-3 mb-0 alert alert-success d-flex align-items-start gap-2 shadow-sm border-0"
              role="alert"
              aria-live="assertive"
            >
              <i className="fa-solid fa-circle-check mt-1 flex-shrink-0" aria-hidden />
              <span className="fw-semibold">{feedback.text}</span>
            </div>
          ) : null}

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
                  const err = fieldErrors[q.name];
                  return (
                    <label key={q.name} className="trip-register-field">
                      {label}
                      <textarea
                        name={`answers[${q.name}]`}
                        rows={3}
                        required={q.required}
                        placeholder={q.placeholder}
                        style={err ? { borderColor: "#dc3545" } : undefined}
                      />
                      {err ? <small className="text-danger">{err}</small> : null}
                    </label>
                  );
                }
                if (q.type === "select" && q.options?.length) {
                  const err = fieldErrors[q.name];
                  return (
                    <label key={q.name} className="trip-register-field">
                      {label}
                      <select
                        name={`answers[${q.name}]`}
                        required={q.required}
                        style={err ? { borderColor: "#dc3545" } : undefined}
                      >
                        <option value="">Сонгох</option>
                        {q.options.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      {err ? <small className="text-danger">{err}</small> : null}
                    </label>
                  );
                }
                if ((q.type === "radio" || q.type === "checkbox") && q.options?.length) {
                  const isRadio = q.type === "radio";
                  const err = fieldErrors[q.name];
                  return (
                    <fieldset
                      key={q.name}
                      className="trip-register-fieldset"
                      style={err ? { border: "1px solid #dc3545", borderRadius: 8, padding: 8 } : undefined}
                    >
                      <legend>
                        {num}. {q.label}
                        {req}
                      </legend>
                      {isRadio ? (
                        <div className="trip-register-inline-options">
                          {q.options.map((op) => (
                            <label key={op}>
                              <input type="radio" name={`answers[${q.name}]`} value={op} required={q.required} /> {op}
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
                      {err ? <small className="text-danger">{err}</small> : null}
                    </fieldset>
                  );
                }
                const inputType =
                  q.type === "number" ? "number" : q.type === "email" ? "email" : q.type === "tel" ? "tel" : "text";
                const err = fieldErrors[q.name];
                return (
                  <label key={q.name} className="trip-register-field">
                    {label}
                    <input
                      type={inputType}
                      name={`answers[${q.name}]`}
                      required={q.required}
                      placeholder={q.placeholder}
                      style={err ? { borderColor: "#dc3545" } : undefined}
                    />
                    {err ? <small className="text-danger">{err}</small> : null}
                  </label>
                );
              })}
          </div>

          {beforeActions}

          <div className="trip-register-actions">
            <button type="button" className="btn-exact-outline" onClick={onClose}>
              Хаах
            </button>
            <button
              type="submit"
              className="btn-qpay"
              disabled={loading || schema.length === 0 || feedback.kind === "loading" || feedback.kind === "success"}
            >
              Бүртгүүлэх
            </button>
          </div>
          {feedback.text && feedback.kind !== "success" && (schema.length > 0 || feedback.kind !== "error") ? (
            <div className={feedbackClass} role="status" aria-live="polite">
              {feedback.text}
            </div>
          ) : null}
        </form>
      </aside>
    </>
  );
}
