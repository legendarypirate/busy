"use client";

import { useId, useState } from "react";

export type TripItineraryItem = {
  time: string;
  end_time: string;
  title: string;
  description: string;
  highlight: string;
};

export type TripItineraryDay = {
  id: string;
  label: string;
  date: string;
  /** Set on the server (`formatMnDate`); do not recompute in the client. */
  dateDisplay: string;
  heading: string;
  banner_image: string;
  items: TripItineraryItem[];
};

type Props = {
  days: TripItineraryDay[];
  fallbackCover: string;
};

export function TripItineraryAccordion({ days, fallbackCover }: Props) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="trd-itinerary-accordion">
      <div className="trd-itinerary-accordion__head mb-3 mb-md-4">
        <h2 className="h5 fw-bold text-dark mb-1">Өдрийн хөтөлбөр</h2>
        <p className="text-muted small mb-0">Өдөр бүрийг дарж дэлгэрэнгүйг үзнэ үү.</p>
      </div>

      <div className="trd-acc-list" role="presentation">
        {days.map((dayRow, pi) => {
          const isOpen = openIndex !== null && openIndex === pi;
          const panelId = `${baseId}-panel-${pi}`;
          const headerId = `${baseId}-header-${pi}`;
          const banner = dayRow.banner_image || fallbackCover;
          const dayHeading = dayRow.heading || "";
          const dayLabel = dayRow.label || `Өдөр ${pi + 1}`;
          const dayDateFmt = dayRow.dateDisplay;
          const items = dayRow.items || [];

          return (
            <div key={dayRow.id || pi} className={`trd-acc-item${isOpen ? " is-open" : ""}`}>
              <button
                type="button"
                id={headerId}
                className="trd-acc-header"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex((cur) => (cur === pi ? null : pi))}
              >
                <span className="trd-acc-num" aria-hidden="true">
                  {pi + 1}
                </span>
                <span className="trd-acc-head-text">
                  <span className="trd-acc-day-title">{dayLabel}</span>
                  <span className="trd-acc-day-sub">
                    {dayDateFmt}
                    {dayHeading ? ` · ${dayHeading}` : ""}
                  </span>
                </span>
                <span className="trd-acc-chev" aria-hidden="true">
                  <i className="fa-solid fa-chevron-down" />
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className="trd-acc-panel"
                hidden={!isOpen}
              >
                <div className="trd-day-detail trd-day-detail--accordion">
                  <div className="trd-day-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner} alt={dayLabel} />
                    <div className="trd-day-label">
                      <div className="fw-bold h5 mb-0">{dayLabel}</div>
                      {dayHeading ? <div className="small opacity-75">{dayHeading}</div> : null}
                    </div>
                  </div>
                  <div className="trd-day-events">
                    {items.map((it, idx) => {
                      const tTime = it.time || "";
                      const tTitle = it.title || "";
                      const tDesc = it.description || "";
                      if (!tTitle && !tDesc) return null;
                      return (
                        <div key={idx} className="trd-event">
                          <div className="trd-event-time">{tTime || "—"}</div>
                          <div className="trd-event-content">
                            {tTitle ? <div className="trd-event-title">{tTitle}</div> : null}
                            {tDesc ? (
                              <div
                                className="trd-event-desc"
                                dangerouslySetInnerHTML={{ __html: tDesc.replace(/\n/g, "<br/>") }}
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
