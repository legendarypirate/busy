"use client";

import { useState } from "react";

type Props = {
  responseId: string;
  deleteApiBase: string;
};

export default function AdminResponseDeleteButton({ responseId, deleteApiBase }: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-danger"
      title="Устгах"
      aria-label="Хариулт устгах"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("Энэ хариултыг устгах уу?")) return;
        setBusy(true);
        try {
          const res = await fetch(`${deleteApiBase}/${encodeURIComponent(responseId)}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            window.alert(j.error || "Устгах үед алдаа гарлаа.");
            return;
          }
          window.location.reload();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> : <i className="fa-solid fa-trash" aria-hidden="true" />}
    </button>
  );
}
