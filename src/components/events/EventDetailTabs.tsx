"use client";

import { useState } from "react";

export type EventDetailTabAgendaRow = { time: string; title: string; note: string };
export type EventDetailTabSpeaker = { name: string; role: string; imageUrl: string };
export type EventDetailTabFaq = { question: string; answer: string };

type TabId = "intro" | "program" | "speakers" | "attendees" | "faq";

const TABS: { id: TabId; label: string }[] = [
  { id: "intro", label: "Танилцуулга" },
  { id: "program", label: "Хөтөлбөр" },
  { id: "speakers", label: "Илтгэгчид" },
  { id: "attendees", label: "Оролцогчид" },
  { id: "faq", label: "FAQ" },
];

export type EventDetailTabsProps = {
  description: string;
  audienceText: string;
  chapterName: string;
  regionName: string;
  typeBadge: string;
  agendaRows: EventDetailTabAgendaRow[];
  speakers: EventDetailTabSpeaker[];
  faq: EventDetailTabFaq[];
};

export default function EventDetailTabs({
  description,
  audienceText,
  chapterName,
  regionName,
  typeBadge,
  agendaRows,
  speakers,
  faq,
}: EventDetailTabsProps) {
  const [tab, setTab] = useState<TabId>("intro");

  return (
    <div className="content-section" id="huralEventTabs">
      <div className="content-tabs" role="tablist" aria-label="Эвентийн хэсгүүд">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`content-tab${tab === t.id ? " active" : ""}`}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "intro" ? (
        <div className="tab-pane" role="tabpanel">
          <p className="lead text-muted mb-3" style={{ fontSize: "1rem", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
            {description}
          </p>
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <div className="p-3 rounded border bg-white small">
                <div className="fw-bold mb-2">Товч мэдээлэл</div>
                <div>
                  <span className="text-muted">Бүлэг:</span> {chapterName || "—"}
                </div>
                <div>
                  <span className="text-muted">Бүс:</span> {regionName || "—"}
                </div>
                <div>
                  <span className="text-muted">Төрөл:</span> {typeBadge}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="section-subtitle" style={{ marginTop: 0 }}>
                Хэн оролцох вэ?
              </div>
              <p className="small text-muted mb-0" style={{ whiteSpace: "pre-wrap" }}>
                {audienceText}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "program" ? (
        <div className="tab-pane" role="tabpanel">
          {agendaRows.length > 0 ? (
            <ul className="timeline-agenda">
              {agendaRows.map((ar, i) => (
                <li className="agenda-item" key={`${ar.time}-${ar.title}-${i}`}>
                  <div className="agenda-time">{ar.time !== "" ? ar.time : "—"}</div>
                  <div className="agenda-bullet" />
                  <div className="agenda-content">
                    <div className="agenda-title">{ar.title}</div>
                    {ar.note !== "" ? (
                      <div className="agenda-desc" style={{ whiteSpace: "pre-wrap" }}>
                        {ar.note}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted small mb-0">
              Хөтөлбөр оруулаагүй байна. Платформын <strong>Хурал / Эвент</strong> хэсгээс хөтөлбөрөө нэмнэ үү.
            </p>
          )}
        </div>
      ) : null}

      {tab === "speakers" ? (
        <div className="tab-pane" role="tabpanel">
          {speakers.length > 0 ? (
            <div className="speaker-list">
              {speakers.map((sp, idx) => (
                <div className="speaker-card" key={`sp-${idx}-${sp.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sp.imageUrl} className="speaker-img" alt="" width={64} height={64} />
                  <div className="speaker-name">{sp.name}</div>
                  <div className="speaker-role">{sp.role}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted small mb-0">Илтгэгчдын мэдээлэл оруулаагүй байна. Зохион байгуулагчийн хэсгээс нэмнэ үү.</p>
          )}
        </div>
      ) : null}

      {tab === "attendees" ? (
        <div className="tab-pane" role="tabpanel">
          <p className="text-muted small mb-0">
            Одоогоор бүртгэлийн жагсаалт энд харагдахгүй байна. Бүртгэлийн системтэй холбогдсон үед оролцогчдын мэдээлэл
            автоматаар гарна.
          </p>
        </div>
      ) : null}

      {tab === "faq" ? (
        <div className="tab-pane" role="tabpanel">
          {faq.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {faq.map((fq, i) => (
                <div className="p-3 rounded border bg-white" key={`${fq.question}-${i}`}>
                  <div className="fw-bold mb-1">{fq.question}</div>
                  <div className="small text-muted mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {fq.answer}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted small mb-0">FAQ нэмээгүй байна.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
