"use client";

import { useCallback, useState } from "react";

/**
 * Admin event form: uploads hero to Cloudinary (or local fallback), stores URL in `hero_image_url`.
 * Optional URL field for paste / `/assets/...` after upload.
 */
export default function EventHeroImageField({ defaultUrl }: { defaultUrl: string }) {
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
      const res = await fetch("/api/admin/event-detail-hero-upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
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
    <div className="col-12">
      <label className="pm-label">Hero зураг</label>
      <p className="small text-muted mb-2">
        Файл сонгоод Cloudinary руу ачаална (эсвэл тохиргоогүй бол серверт локал хадгална). Хүссэн бол доорх
        талбарт URL гараар оруулж болно.
      </p>
      <input type="hidden" name="hero_image_url" value={url} readOnly />
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
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
          type="text"
          className="pm-input flex-grow-1"
          style={{ minWidth: "12rem" }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/assets/img/meeting-hero.png эсвэл https://…"
          aria-label="Hero зургийн холбоос"
        />
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- organizer preview
        <img
          src={url}
          alt=""
          className="rounded border mt-1"
          style={{ maxHeight: 120, maxWidth: "100%", objectFit: "cover" }}
        />
      ) : null}
      {msg ? <span className="small text-danger d-block mt-1">{msg}</span> : null}
    </div>
  );
}
