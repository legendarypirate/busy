"use client";

import { useMemo, useState } from "react";

export type EventSlot = {
  time: string;
  title: string;
  note: string;
  category: string;
};

export type EventDay = {
  day: number;
  title: string;
  slots: EventSlot[];
};

const CATEGORIES = ["Уулзалт", "Танилцуулга", "Networking", "Сургалт"] as const;

function sectionsToDays(sections: unknown[]): EventDay[] {
  const map = new Map<number, EventDay>();
  for (const raw of sections) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const sec = raw as Record<string, unknown>;
    const day = Math.max(1, Number(sec.day ?? 1));
    const dayTitle = String(sec.day_title ?? `${day}-р өдөр`).trim() || `${day}-р өдөр`;
    if (!map.has(day)) {
      map.set(day, { day, title: dayTitle, slots: [] });
    }
    const entry = map.get(day)!;
    const slotTitle = String(sec.title ?? "").trim();
    const slotTime = String(sec.time ?? "09:00").trim() || "09:00";
    const slotNote = String(sec.note ?? sec.description ?? "").trim();
    const slotCat = String(sec.category ?? "Уулзалт").trim() || "Уулзалт";
    if (slotTitle === "" && slotNote === "") {
      continue;
    }
    entry.slots.push({
      time: slotTime,
      title: slotTitle,
      note: slotNote,
      category: slotCat,
    });
  }
  if (map.size === 0) {
    return [{ day: 1, title: "1-р өдөр", slots: [{ time: "09:00", title: "", note: "", category: "Уулзалт" }] }];
  }
  return [...map.values()].sort((a, b) => a.day - b.day);
}

function serialize(days: EventDay[]): unknown[] {
  const sections: Record<string, unknown>[] = [];
  for (const d of days) {
    const dayTitle = d.title.trim() || `${d.day}-р өдөр`;
    for (const s of d.slots) {
      if (!s.title.trim() && !s.note.trim() && !s.time.trim()) {
        continue;
      }
      sections.push({
        day: d.day,
        day_title: dayTitle,
        time: s.time || "09:00",
        title: s.title,
        note: s.note,
        category: s.category || "Уулзалт",
      });
    }
  }
  return sections;
}

type Props = {
  hiddenName: string;
  initialSections?: unknown;
};

export default function EventItineraryBuilder({ hiddenName, initialSections }: Props) {
  const initialDays = useMemo(() => {
    const arr = Array.isArray(initialSections) ? initialSections : [];
    const days = sectionsToDays(arr);
    return days.map((d) =>
      d.slots.length === 0 ? { ...d, slots: [{ time: "09:00", title: "", note: "", category: "Уулзалт" }] } : d,
    );
  }, [initialSections]);

  const [days, setDays] = useState<EventDay[]>(() => initialDays);
  const [activeDay, setActiveDay] = useState(initialDays[0]?.day ?? 1);

  const payload = useMemo(() => JSON.stringify(serialize(days)), [days]);

  const upsertDayTitle = (dayNum: number, title: string) => {
    setDays((prev) =>
      prev.map((d) => (d.day === dayNum ? { ...d, title } : d)).sort((a, b) => a.day - b.day),
    );
  };

  const updateSlot = (dayNum: number, si: number, patch: Partial<EventSlot>) => {
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
              slots: [...d.slots, { time: "09:00", title: "", note: "", category: "Уулзалт" }],
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
      setActiveDay(next);
      return [
        ...prev,
        {
          day: next,
          title: `${next}-р өдөр`,
          slots: [{ time: "09:00", title: "", note: "", category: "Уулзалт" }],
        },
      ].sort((a, b) => a.day - b.day);
    });
  };

  const removeDay = (dayNum: number, evt?: React.MouseEvent) => {
    evt?.stopPropagation();
    if (days.length <= 1) {
      return;
    }
    setDays((prev) => {
      const next = prev.filter((d) => d.day !== dayNum);
      const fb = next[0]?.day ?? 1;
      setActiveDay(fb);
      return next;
    });
  };

  return (
    <>
      <input type="hidden" name={hiddenName} value={payload} readOnly aria-hidden />

      <div className="tps-itinerary-builder">
        <div className="tps-days-nav" id="eventDaysNav">
          {days.map((d) => (
            <div
              key={d.day}
              className={`tps-day-tab ${d.day === activeDay ? "active" : ""}`}
              data-day={d.day}
              onClick={() => setActiveDay(d.day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveDay(d.day);
                }
              }}
            >
              <div>
                <span className="tps-day-num">{d.day}-р өдөр</span>
                <span className="tps-day-label">{d.title}</span>
              </div>
              <i
                className="fa-solid fa-trash-can small text-muted opacity-50"
                role="button"
                tabIndex={-1}
                onClick={(e) => removeDay(d.day, e)}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label="Өдөр устгах"
              />
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary w-100 mt-2" onClick={addDay}>
            + Шинэ өдөр нэмэх
          </button>
        </div>

        <div className="tps-days-content" id="eventItineraryContents">
          {days.map((d) => (
            <div
              key={d.day}
              className={`tps-day-content ${d.day === activeDay ? "active" : ""}`}
              id={`eventDayContent_${d.day}`}
              hidden={d.day !== activeDay}
            >
              <div className="mb-3">
                <label className="pm-label">Өдрийн гарчиг</label>
                <input
                  type="text"
                  className="pm-input event-day-title-input"
                  value={d.title}
                  onChange={(e) => upsertDayTitle(d.day, e.target.value)}
                />
              </div>
              <div className="tps-timeline" id={`eventTimeline_${d.day}`}>
                {d.slots.map((s, si) => (
                  <div key={si} className="tps-slot event-itinerary-row">
                    <div className="tps-slot-dot">
                      <i className="fa-solid fa-clock" />
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
                          value={s.note}
                          onChange={(e) => updateSlot(d.day, si, { note: e.target.value })}
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
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="pm-btn-secondary py-1 px-4 d-inline-flex align-items-center gap-2"
                  onClick={() => addSlot(d.day)}
                >
                  <i className="fa-solid fa-plus-circle" />
                  Шинэ мөр нэмэх
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
