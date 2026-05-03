"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { mn } from "date-fns/locale/mn";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("mn", mn);

/** Same wire format as native `datetime-local` + `parseDatetimeLocal` on the server. */
function toFormDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalDatetimeInput(s: string): Date {
  const t = s.trim();
  if (!t) return new Date();
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

type Props = {
  /** `YYYY-MM-DDTHH:mm` in browser-local interpretation (matches previous `datetime-local` default). */
  initialStartsLocal: string;
  initialEndsLocal: string;
};

export default function EventDateTimeFields({ initialStartsLocal, initialEndsLocal }: Props) {
  const [start, setStart] = useState(() => parseLocalDatetimeInput(initialStartsLocal));
  const [end, setEnd] = useState(() => parseLocalDatetimeInput(initialEndsLocal));

  useEffect(() => {
    setEnd((prev) => (prev.getTime() < start.getTime() ? new Date(start.getTime() + 2 * 60 * 60 * 1000) : prev));
  }, [start]);

  const startsAtValue = useMemo(() => toFormDatetimeValue(start), [start]);
  const endsAtValue = useMemo(() => toFormDatetimeValue(end), [end]);

  const pickerClass = "pm-input event-dtp-input";

  return (
    <div className="event-datetime-fields">
      <input type="hidden" name="starts_at" value={startsAtValue} readOnly />
      <input type="hidden" name="ends_at" value={endsAtValue} readOnly />

      <div className="mb-3">
        <label className="pm-label">Эхлэх</label>
        <DatePicker
          selected={start}
          onChange={(d: Date | null) => d && setStart(d)}
          showTimeSelect
          timeIntervals={15}
          timeCaption="Цаг"
          dateFormat="yyyy.MM.dd HH:mm"
          locale="mn"
          className={pickerClass}
          wrapperClassName="w-100"
          calendarClassName="event-dtp-calendar"
          popperClassName="event-dtp-popper"
          showPopperArrow={false}
          autoComplete="off"
          required
        />
      </div>

      <div className="mb-3">
        <label className="pm-label">Дуусах</label>
        <DatePicker
          selected={end}
          onChange={(d: Date | null) => d && setEnd(d)}
          showTimeSelect
          timeIntervals={15}
          timeCaption="Цаг"
          dateFormat="yyyy.MM.dd HH:mm"
          locale="mn"
          minDate={start}
          className={pickerClass}
          wrapperClassName="w-100"
          calendarClassName="event-dtp-calendar"
          popperClassName="event-dtp-popper"
          showPopperArrow={false}
          autoComplete="off"
          required
        />
      </div>
    </div>
  );
}
