"use client";

import { useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { mn } from "date-fns/locale/mn";
import "react-datepicker/dist/react-datepicker.css";
import {
  eventInstantToPickerDate,
  formatEventDatetimeWireUb,
  parseEventDatetimeWireUb,
  pickerDateToEventInstant,
} from "@/lib/event-datetime-ub";

registerLocale("mn", mn);

type Props = {
  /** `YYYY-MM-DDTHH:mm` wall clock in Asia/Ulaanbaatar (matches server + hidden fields). */
  initialStartsLocal: string;
  initialEndsLocal: string;
};

export default function EventDateTimeFields({ initialStartsLocal, initialEndsLocal }: Props) {
  const [start, setStart] = useState(() => parseEventDatetimeWireUb(initialStartsLocal) ?? new Date());
  const [end, setEnd] = useState(() => {
    const s = parseEventDatetimeWireUb(initialStartsLocal) ?? new Date();
    let e = parseEventDatetimeWireUb(initialEndsLocal) ?? s;
    if (e.getTime() < s.getTime()) {
      e = new Date(s.getTime() + 2 * 60 * 60 * 1000);
    }
    return e;
  });

  const onStartChange = (d: Date | null) => {
    if (!d) return;
    const instant = pickerDateToEventInstant(d);
    setStart(instant);
    setEnd((prev) => (prev.getTime() < instant.getTime() ? new Date(instant.getTime() + 2 * 60 * 60 * 1000) : prev));
  };

  const startsAtValue = useMemo(() => formatEventDatetimeWireUb(start), [start]);
  const endsAtValue = useMemo(() => formatEventDatetimeWireUb(end), [end]);

  const startPicker = useMemo(() => eventInstantToPickerDate(start), [start]);
  const endPicker = useMemo(() => eventInstantToPickerDate(end), [end]);

  const pickerClass = "pm-input event-dtp-input";

  return (
    <div className="event-datetime-fields">
      <input type="hidden" name="starts_at" value={startsAtValue} readOnly />
      <input type="hidden" name="ends_at" value={endsAtValue} readOnly />

      <div className="mb-3">
        <label className="pm-label">Эхлэх</label>
        <DatePicker
          selected={startPicker}
          onChange={(d: Date | null) => onStartChange(d)}
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
          selected={endPicker}
          onChange={(d: Date | null) => d && setEnd(pickerDateToEventInstant(d))}
          showTimeSelect
          timeIntervals={15}
          timeCaption="Цаг"
          dateFormat="yyyy.MM.dd HH:mm"
          locale="mn"
          minDate={startPicker}
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
