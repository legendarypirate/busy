"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

/** Must be rendered inside a `<form>` (e.g. with `useActionState`). */
export function FormPendingBackdrop() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 2000, background: "rgba(15, 23, 42, 0.45)" }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="bg-white rounded-3 px-4 py-3 shadow d-flex align-items-center gap-3">
        <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden />
        <span className="fw-semibold text-dark">Зураг илгээж байна…</span>
      </div>
    </div>
  );
}

type SubmitProps = ComponentProps<"button"> & {
  labelPending?: string;
};

/** Submit button that reflects multipart / server-action pending state. */
export function PendingSubmitButton({ className, children, labelPending, disabled, ...rest }: SubmitProps) {
  const { pending } = useFormStatus();
  const busy = Boolean(pending || disabled);
  return (
    <button type="submit" disabled={busy} className={className} {...rest}>
      {pending ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
          {labelPending ?? "Илгээж байна…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
