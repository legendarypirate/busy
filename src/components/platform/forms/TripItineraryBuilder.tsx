"use client";

import { useMemo, useState } from "react";

export type TripItinerarySlot = {
  time: string;
  title: string;
  description: string;
  category: string;
};

export type TripItineraryDay = {
  day: number;
  title: string;
  banner: string;
  slots: TripItinerarySlot[];
};

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1517511620798-cec17d428bc0?q=80&w=2070&auto=format&fit=crop";

const CATEGORIES = ["Тээвэр", "Уулзалт", "Хоол", "Аялал / Үзвэр", "Чөлөөт цаг"] as const;

const ICON_MAP: Record<string, string> = {
  Тээвэр: "fa-bus",
  Уулзалт: "fa-users",
  Хоол: "fa-utensils",
  "Аялал / Үзвэр": "fa-camera",
  "Чөлөөт цаг": "fa-mug-hot",
};

function iconClass(cat: string): string {
  return ICON_MAP[cat] ?? "fa-bus";
}

function normalizeDays(raw: unknown): TripItineraryDay[] {
  const arr =
    Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && Array.isArray((raw as { days?: unknown }).days)
        ? ((raw as { days?: unknown }).days as unknown[])
        : [];

  if (arr.length === 0) {
    return [
      {
        day: 1,
        title: "1-р өдөр",
        banner: "",
        slots: [{ time: "08:30", title: "", description: "", category: "Тээвэр" }],
      },
    ];
  }
  return arr
    .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
    .map((d, idx) => {
      const day = Math.max(1, Number(d.day ?? idx + 1));
      const slotsRaw = Array.isArray(d.slots) ? d.slots : [];
      const slots: TripItinerarySlot[] =
        slotsRaw.length === 0
          ? [{ time: "08:30", title: "", description: "", category: "Тээвэр" }]
          : slotsRaw
              .filter((s): s is Record<string, unknown> => s !== null && typeof s === "object")
              .map((s) => ({
                time: String(s.time ?? "09:00"),
                title: String(s.title ?? ""),
                description: String(s.description ?? ""),
                category: String(s.category ?? "Тээвэр"),
              }));
      return {
        day,
        title: String(d.title ?? `${day}-р өдөр`),
        banner: String(d.banner ?? ""),
        slots,
      };
    })
    .sort((a, b) => a.day - b.day);
}

type Props = {
  hiddenName: string;
  initialJson?: unknown;
};

export default function TripItineraryBuilder({ hiddenName, initialJson }: Props) {
  const [days, setDays] = useState<TripItineraryDay[]>(() => normalizeDays(initialJson));
  const [activeDay, setActiveDay] = useState(() => normalizeDays(initialJson)[0]?.day ?? 1);
  const [bannerBusy, setBannerBusy] = useState<Record<number, boolean>>({});
  const [bannerMsg, setBannerMsg] = useState<Record<number, string | null>>({});

  const payload = useMemo(() => JSON.stringify({ days }), [days]);

  const upsertDay = (dayNum: number, patch: Partial<TripItineraryDay>) => {
    setDays((prev) =>
      prev.map((d) => (d.day === dayNum ? { ...d, ...patch } : d)).sort((a, b) => a.day - b.day),
    );
  };

  const updateSlot = (dayNum: number, si: number, patch: Partial<TripItinerarySlot>) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day !== dayNum) {
          return d;
        }
        const slots = d.slots.map((s, j) => (j === si ? { ...s, ...patch } : s));
        return { ...d, slots };
      }),
    );
  };

  const addSlot = (dayNum: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.day === dayNum
          ? {
              ...d,
              slots: [...d.slots, { time: "09:00", title: "", description: "", category: "Тээвэр" }],
            }
          : d,
      ),
    );
  };

  const removeSlot = (dayNum: number, si: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.day === dayNum ? { ...d, slots: d.slots.filter((_, j) => j !== si) } : d,
      ),
    );
  };

  const addDay = () => {
    setDays((prev) => {
      const maxD = prev.reduce((m, d) => Math.max(m, d.day), 0);
      const next = maxD + 1;
      const neu: TripItineraryDay = {
        day: next,
        title: `${next}-р өдөр`,
        banner: "",
        slots: [{ time: "09:00", title: "", description: "", category: "Тээвэр" }],
      };
      setActiveDay(next);
      return [...prev, neu].sort((a, b) => a.day - b.day);
    });
  };

  const removeDay = (dayNum: number) => {
    if (!confirm(`${dayNum}-р өдрийг устгах уу?`)) {
      return;
    }
    setDays((prev) => {
      const next = prev.filter((d) => d.day !== dayNum);
      const fallback = next[0]?.day ?? 1;
      setActiveDay(fallback);
      return next.length ? next : normalizeDays(undefined);
    });
  };

  async function onDayBannerFile(dayNum: number, file: File) {
    setBannerBusy((prev) => ({ ...prev, [dayNum]: true }));
    setBannerMsg((prev) => ({ ...prev, [dayNum]: null }));
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/platform/trip-itinerary-day-banner-upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setBannerMsg((prev) => ({
          ...prev,
          [dayNum]: data.error ?? `Алдаа (${res.status})`,
        }));
        return;
      }
      upsertDay(dayNum, { banner: data.url });
    } finally {
      setBannerBusy((prev) => ({ ...prev, [dayNum]: false }));
    }
  }

  return (
    <>
      <input type="hidden" name={hiddenName} value={payload} readOnly aria-hidden />

      <div className="tps-itinerary-builder">
        <div className="tps-days-nav" id="itineraryDaysNav">
          {days.map((d) => (
            <div
              key={d.day}
              className={`tps-day-tab ${d.day === activeDay ? "active" : ""}`}
              data-day={d.day}
              onClick={() => setActiveDay(d.day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveDay(d.day);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div>
                <span className="tps-day-num">{d.day}-р өдөр</span>
                <span className="tps-day-label">Хөтөлбөр</span>
              </div>
              <i
                className="fa-solid fa-trash-can small text-muted opacity-50 cursor-pointer"
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  removeDay(d.day);
                }}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label="Өдөр устгах"
              />
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary w-100 mt-2" onClick={addDay}>
            + Шинэ өдөр нэмэх
          </button>
        </div>

        <div className="tps-days-content" id="itineraryContents">
          {days.map((d) => (
            <div
              key={d.day}
              className={`tps-day-content ${d.day === activeDay ? "active" : ""}`}
              id={`tripContent_${d.day}`}
              hidden={d.day !== activeDay}
            >
              <div className="tps-day-banner-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.banner?.trim() ? d.banner : DEFAULT_BANNER}
                  alt=""
                  className="tps-day-banner-img"
                />
              </div>
              <div className="mb-3">
                <label className="pm-label">Өдрийн гарчиг</label>
                <input
                  type="text"
                  className="pm-input"
                  value={d.title}
                  onChange={(e) => upsertDay(d.day, { title: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="pm-label small">Өдрийн баннер</label>
                <p className="small text-muted mb-2">
                  Зураг сонгоод Cloudinary руу ачаална (тохиргоогүй бол серверт локал). Дараа нь шинэ файл эсвэл доорх
                  холбоосоор солино.
                </p>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <label
                    className={`btn btn-sm btn-outline-secondary mb-0 ${bannerBusy[d.day] ? "disabled" : ""}`}
                    style={{ cursor: bannerBusy[d.day] ? "wait" : "pointer" }}
                  >
                    {bannerBusy[d.day] ? "Илгээж…" : "Зураг оруулах"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="d-none"
                      disabled={Boolean(bannerBusy[d.day])}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void onDayBannerFile(d.day, f);
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    className="pm-input flex-grow-1"
                    style={{ minWidth: "12rem" }}
                    placeholder="Зургийн URL (заавал биш)"
                    value={d.banner}
                    onChange={(e) => upsertDay(d.day, { banner: e.target.value })}
                    aria-label="Өдрийн баннерын холбоос"
                  />
                </div>
                {bannerMsg[d.day] ? <div className="small text-danger">{bannerMsg[d.day]}</div> : null}
              </div>

              <div className="tps-timeline" id={`timeline_${d.day}`}>
                {d.slots.map((s, si) => (
                  <div key={si} className="tps-slot itinerary-row">
                    <div className="tps-slot-dot">
                      <i className={`fa-solid ${iconClass(s.category)}`} />
                    </div>
                    <div className="tps-slot-card">
                      <input
                        type="time"
                        className="pm-input py-1"
                        value={s.time}
                        onChange={(e) => updateSlot(d.day, si, { time: e.target.value })}
                      />
                      <div>
                        <input
                          type="text"
                          className="pm-input py-1 fw-bold mb-1"
                          placeholder="Гарчиг"
                          value={s.title}
                          onChange={(e) => updateSlot(d.day, si, { title: e.target.value })}
                        />
                        <input
                          type="text"
                          className="pm-input py-1 small text-muted"
                          placeholder="Тайлбар"
                          value={s.description}
                          onChange={(e) => updateSlot(d.day, si, { description: e.target.value })}
                        />
                      </div>
                      <select
                        className="pm-select py-1"
                        value={s.category}
                        onChange={(e) => updateSlot(d.day, si, { category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger border-0"
                        onClick={() => removeSlot(d.day, si)}
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <button
                  type="button"
                  className="pm-btn-secondary py-1 px-4 d-inline-flex align-items-center gap-2"
                  onClick={() => addSlot(d.day)}
                >
                  <i className="fa-solid fa-plus-circle" />
                  Шилж нэмэх
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
