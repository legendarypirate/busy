"use client";

import { useEffect, useState } from "react";

/** Full-page overlay while the trip multipart form is posting (cover / hero uploads). */
export default function TripFormUploadPendingOverlay({ formId }: { formId: string }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = document.getElementById(formId);
    if (!el || !(el instanceof HTMLFormElement)) return;
    const onSubmit = () => setBusy(true);
    el.addEventListener("submit", onSubmit);
    return () => el.removeEventListener("submit", onSubmit);
  }, [formId]);

  if (!busy) return null;

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
