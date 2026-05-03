"use client";

import { useMemo, useRef, useState } from "react";
import { saveMarketingListingHeroSlidesAction } from "@/app/admin/(protected)/marketing-listing-heroes/actions";
import { slidesToTextareaLines } from "@/lib/marketing-listing-hero-shared";

type Props = {
  initialTrips: string[];
  initialEvents: string[];
  showSaved: boolean;
};

async function readJson<T>(res: Response): Promise<T> {
  const t = await res.text();
  const trimmed = t.trim();
  if (!trimmed) throw new Error(`Хоосон хариу (HTTP ${res.status})`);
  return JSON.parse(trimmed) as T;
}

export default function MarketingListingHeroesForm({ initialTrips, initialEvents, showSaved }: Props) {
  const [tripsText, setTripsText] = useState(() => slidesToTextareaLines(initialTrips));
  const [eventsText, setEventsText] = useState(() => slidesToTextareaLines(initialEvents));
  const [tripsUploadMsg, setTripsUploadMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [eventsUploadMsg, setEventsUploadMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [tripsBusy, setTripsBusy] = useState(false);
  const [eventsBusy, setEventsBusy] = useState(false);
  const tripsInputRef = useRef<HTMLInputElement>(null);
  const eventsInputRef = useRef<HTMLInputElement>(null);

  const tripLines = useMemo(
    () =>
      tripsText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    [tripsText],
  );
  const eventLines = useMemo(
    () =>
      eventsText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    [eventsText],
  );

  async function uploadBatch(files: FileList | null, which: "trips" | "events") {
    if (!files || files.length === 0) return;
    const setBusy = which === "trips" ? setTripsBusy : setEventsBusy;
    const setMsg = which === "trips" ? setTripsUploadMsg : setEventsUploadMsg;
    const append = which === "trips" ? setTripsText : setEventsText;
    const inputRef = which === "trips" ? tripsInputRef : eventsInputRef;

    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) {
        fd.append("files", f);
      }
      const res = await fetch("/api/admin/marketing-listing-hero-upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await readJson<{ ok?: boolean; urls?: string[]; error?: string; partialErrors?: string[] }>(res);
      if (!res.ok || !data.ok || !Array.isArray(data.urls) || data.urls.length === 0) {
        throw new Error(data.error || "Илгээлт амжилтгүй.");
      }
      append((prev) => {
        const base = prev.trim();
        const next = [...(base ? base.split(/\r?\n/) : []), ...data.urls!]
          .map((l) => l.trim())
          .filter(Boolean);
        return next.join("\n");
      });
      const extra =
        data.partialErrors?.length ? ` Зарим файл: ${data.partialErrors.join("; ")}` : "";
      setMsg({ kind: "ok", text: `${data.urls.length} зураг нэмэгдлээ.${extra}` });
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Алдаа гарлаа.",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form action={saveMarketingListingHeroSlidesAction} className="card shadow-sm">
      <div className="card-body">
        {showSaved ? (
          <div className="alert alert-success py-2 small mb-4">Хадгалагдлаа.</div>
        ) : null}

        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="trips_slides">
            Бизнес аялал (<code>/trips</code>)
          </label>
          <p className="text-muted small mb-2">
            Олон зураг сонгоод нэмнэ үү — Cloudinary (эсвэл орчинд тохируулсан локал) руу хадгалагдаад URL энд
            нэмэгдэнэ.
          </p>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <input
              ref={tripsInputRef}
              type="file"
              className="form-control form-control-sm"
              style={{ maxWidth: "min(100%, 28rem)" }}
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={tripsBusy}
              onChange={(e) => void uploadBatch(e.target.files, "trips")}
            />
            {tripsBusy ? <span className="small text-muted">Илгээж байна…</span> : null}
          </div>
          {tripsUploadMsg ? (
            <div
              className={`small mb-2 ${tripsUploadMsg.kind === "ok" ? "text-success" : "text-danger"}`}
              role="status"
            >
              {tripsUploadMsg.text}
            </div>
          ) : null}
          {tripLines.length > 0 ? (
            <div className="d-flex flex-wrap gap-2 mb-2">
              {tripLines.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded overflow-hidden bg-light"
                  style={{ width: 72, height: 48 }}
                  title={url}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                </a>
              ))}
            </div>
          ) : null}
          <textarea
            id="trips_slides"
            name="trips_slides"
            className="form-control font-monospace small"
            rows={8}
            placeholder={"https://example.com/banner1.jpg\n/assets/img/trip-hero.png"}
            value={tripsText}
            onChange={(e) => setTripsText(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="events_slides">
            Хурал / эвент (<code>/events</code>)
          </label>
          <p className="text-muted small mb-2">Олон зураг сонгоод нэмнэ үү.</p>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <input
              ref={eventsInputRef}
              type="file"
              className="form-control form-control-sm"
              style={{ maxWidth: "min(100%, 28rem)" }}
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={eventsBusy}
              onChange={(e) => void uploadBatch(e.target.files, "events")}
            />
            {eventsBusy ? <span className="small text-muted">Илгээж байна…</span> : null}
          </div>
          {eventsUploadMsg ? (
            <div
              className={`small mb-2 ${eventsUploadMsg.kind === "ok" ? "text-success" : "text-danger"}`}
              role="status"
            >
              {eventsUploadMsg.text}
            </div>
          ) : null}
          {eventLines.length > 0 ? (
            <div className="d-flex flex-wrap gap-2 mb-2">
              {eventLines.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded overflow-hidden bg-light"
                  style={{ width: 72, height: 48 }}
                  title={url}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                </a>
              ))}
            </div>
          ) : null}
          <textarea
            id="events_slides"
            name="events_slides"
            className="form-control font-monospace small"
            rows={8}
            placeholder={"https://example.com/event-hero.jpg\n/assets/img/meeting-hero.png"}
            value={eventsText}
            onChange={(e) => setEventsText(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Хадгалах
        </button>
      </div>
    </form>
  );
}
