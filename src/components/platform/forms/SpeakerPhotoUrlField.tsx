"use client";

import { useCallback, useState } from "react";

/**
 * Speaker row: Cloudinary (or local) upload + optional manual URL.
 * Submits `speaker_photo_url` via a hidden input (same name/order as other rows).
 */
export default function SpeakerPhotoUrlField({ defaultUrl }: { defaultUrl: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/platform/event-speaker-photo", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setMsg(data.error ?? "Алдаа");
        return;
      }
      setUrl(data.url);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="d-flex flex-column gap-1">
      <input type="hidden" name="speaker_photo_url" value={url} />
      <div className="d-flex flex-wrap align-items-center gap-2">
        <label
          className={`btn btn-sm btn-outline-secondary mb-0 ${busy ? "disabled" : ""}`}
          style={{ cursor: busy ? "wait" : "pointer" }}
        >
          {busy ? "Илгээж…" : "Зураг оруулах"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="d-none"
            disabled={busy}
            onChange={(e) => void onFile(e)}
          />
        </label>
        <input
          type="url"
          className="pm-input flex-grow-1"
          style={{ minWidth: "7rem" }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Эсвэл URL"
          aria-label="Зургийн холбоос"
        />
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- user/organizer-provided URL preview
        <img
          src={url}
          alt=""
          className="rounded border mt-1"
          style={{ maxHeight: 72, maxWidth: "100%", objectFit: "cover" }}
        />
      ) : null}
      {msg ? <span className="small text-danger">{msg}</span> : null}
    </div>
  );
}
