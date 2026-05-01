"use client";

import { useMemo, useState } from "react";

function durationLabel(start: string, end: string): string {
  if (!start || !end) {
    return "- өдөр";
  }
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) {
    return "- өдөр";
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((e.getTime() - s.getTime()) / dayMs) + 1;
  return `${days} өдөр`;
}

type Props = {
  startDefault: string;
  endDefault: string;
};

export default function TripDateDuration({ startDefault, endDefault }: Props) {
  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(endDefault);
  const dur = useMemo(() => durationLabel(start, end), [start, end]);

  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-6">
          <label className="pm-label">
            Эхлэх огноо <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="pm-input"
            id="tripStartDateInput"
            name="trip_start_date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="col-6">
          <label className="pm-label">
            Дуусах огноо <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="pm-input"
            id="tripEndDateInput"
            name="trip_end_date"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="pm-label">Нийт хугацаа</label>
        <div className="pm-input bg-light border-0 text-muted" id="tripDurationDisplay">
          {dur}
        </div>
      </div>
    </>
  );
}
