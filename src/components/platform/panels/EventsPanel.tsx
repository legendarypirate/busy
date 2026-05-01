import Link from "next/link";
import { redirect } from "next/navigation";
import DynamicQuestionBuilder from "@/components/platform/forms/DynamicQuestionBuilder";
import EventItineraryBuilder from "@/components/platform/forms/EventItineraryBuilder";
import { deleteEventAction, saveEventAction } from "@/app/platform/events-actions";
import { prisma } from "@/lib/prisma";
import { getPlatformSession } from "@/lib/platform-session";

const EVENT_TYPES = ["weekly_meeting", "visitor_day", "training", "social"] as const;

const EVENT_TYPE_LABELS: Record<string, string> = {
  weekly_meeting: "7 хоногийн хурал",
  visitor_day: "Visitor day",
  training: "Сургалт",
  social: "Social",
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) {
    return v[0];
  }
  return v;
}

function errorBanner(code: string | undefined): string | null {
  if (!code) {
    return null;
  }
  if (code === "missing") {
    return "Гарчиг, chapter, хугацаа зөв бөглөнө үү.";
  }
  if (code === "notfound") {
    return "Эвент олдсонгүй.";
  }
  return null;
}

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseEnvelope(raw: unknown): {
  sections: unknown[];
  intro_body: string;
  audience_text: string;
  speakers: { name: string; role: string; photo_url: string }[];
  faq: { question: string; answer: string }[];
} {
  const base = {
    sections: [] as unknown[],
    intro_body: "",
    audience_text: "",
    speakers: [] as { name: string; role: string; photo_url: string }[],
    faq: [] as { question: string; answer: string }[],
  };
  let obj: Record<string, unknown> | null = null;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const j = JSON.parse(raw) as unknown;
      if (j && typeof j === "object" && !Array.isArray(j)) {
        obj = j as Record<string, unknown>;
      }
    } catch {
      return base;
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  }
  if (!obj) {
    return base;
  }
  if (Array.isArray(obj.sections)) {
    base.sections = obj.sections;
  }
  base.intro_body = String(obj.intro_body ?? "").trim();
  base.audience_text = String(obj.audience_text ?? "").trim();
  if (Array.isArray(obj.speakers)) {
    for (const sp of obj.speakers) {
      if (!sp || typeof sp !== "object") {
        continue;
      }
      const r = sp as Record<string, unknown>;
      base.speakers.push({
        name: String(r.name ?? "").trim(),
        role: String(r.role ?? "").trim(),
        photo_url: String(r.photo_url ?? "").trim(),
      });
    }
  }
  if (Array.isArray(obj.faq)) {
    for (const f of obj.faq) {
      if (!f || typeof f !== "object") {
        continue;
      }
      const r = f as Record<string, unknown>;
      base.faq.push({
        question: String(r.question ?? r.q ?? "").trim(),
        answer: String(r.answer ?? r.a ?? "").trim(),
      });
    }
  }
  return base;
}

function padSpeakers(
  rows: { name: string; role: string; photo_url: string }[],
  n: number,
): { name: string; role: string; photo_url: string }[] {
  const out = rows.slice(0, n);
  while (out.length < n) {
    out.push({ name: "", role: "", photo_url: "" });
  }
  return out;
}

function padFaq(rows: { question: string; answer: string }[], n: number): { question: string; answer: string }[] {
  const out = rows.slice(0, n);
  while (out.length < n) {
    out.push({ question: "", answer: "" });
  }
  return out;
}

function fmtMoney(mnt: unknown): string {
  if (mnt == null || mnt === "") {
    return "₮0";
  }
  const x = Number(mnt);
  if (!Number.isFinite(x)) {
    return "₮0";
  }
  return `₮${Math.round(x).toLocaleString("mn-MN")}`;
}

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EventsPanel({ searchParams }: Props) {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/events");
  }

  const err = errorBanner(firstParam(searchParams?.error));
  const editRaw = firstParam(searchParams?.edit_event);
  let editEventId = BigInt(0);
  try {
    editEventId = BigInt(editRaw && editRaw.trim() !== "" ? editRaw : "0");
  } catch {
    editEventId = BigInt(0);
  }

  const [chapters, schedules, curriculums, managedEvents] = await Promise.all([
    prisma.chapter.findMany({ orderBy: { name: "asc" } }),
    prisma.chapterWeeklySchedule.findMany({
      take: 500,
      orderBy: { id: "desc" },
      include: { chapter: true, curriculum: true },
    }),
    prisma.curriculum.findMany({
      orderBy: { name: "asc" },
      include: { chapter: true },
    }),
    prisma.bniEvent.findMany({
      take: 100,
      orderBy: { startsAt: "desc" },
      include: { chapter: true, curriculum: true },
    }),
  ]);

  const existing =
    editEventId > BigInt(0) ? await prisma.bniEvent.findUnique({ where: { id: editEventId } }) : null;

  if (editEventId > BigInt(0) && !existing) {
    return (
      <div className="pl-panel-inner px-3 py-4">
        <div className="alert alert-warning">{errorBanner("notfound")}</div>
        <Link href="/platform/events">Жагсаалт руу</Link>
      </div>
    );
  }

  const parsed = parseEnvelope(existing?.curriculumOverrideJson ?? undefined);

  const defaultStarts = new Date();
  const defaultEnds = new Date(defaultStarts.getTime() + 2 * 60 * 60 * 1000);

  const chapterIdDefault = chapters[0]?.id ?? 0;
  const eventForm = existing
    ? {
        id: existing.id,
        title: existing.title ?? "",
        chapterId: existing.chapterId,
        eventType: EVENT_TYPES.some((t) => t === existing.eventType) ? existing.eventType : "weekly_meeting",
        startsAt: existing.startsAt,
        endsAt: existing.endsAt,
        location: existing.location ?? "",
        isOnline: existing.isOnline,
        scheduleId: existing.scheduleId ?? 0,
        curriculumId: existing.curriculumId ?? 0,
        priceMnt: existing.priceMnt != null ? String(existing.priceMnt) : "",
        advanceOrderMnt: existing.advanceOrderMnt != null ? String(existing.advanceOrderMnt) : "",
      }
    : {
        id: BigInt(0),
        title: "",
        chapterId: chapterIdDefault,
        eventType: "weekly_meeting",
        startsAt: defaultStarts,
        endsAt: defaultEnds,
        location: "",
        isOnline: false,
        scheduleId: 0,
        curriculumId: 0,
        priceMnt: "",
        advanceOrderMnt: "",
      };

  const speakersForm = padSpeakers(parsed.speakers, 5);
  const faqForm = padFaq(parsed.faq, 5);

  return (
    <div className="pl-panel-inner px-3 py-4">
      {err ? <div className="alert alert-warning py-2 small mb-3">{err}</div> : null}

      <div className="pm-card mb-4" id="managedEventsCard">
        <div className="pm-card-header d-flex justify-content-between align-items-center">
          <div>
            <div className="pm-card-title">Бүх эвентүүд</div>
            <div className="pm-card-subtitle">Системд бүртгэлтэй нийт арга хэмжээ</div>
          </div>
          <Link href="/platform/events" className="btn btn-sm btn-outline-primary">
            <i className="fa-solid fa-plus me-1" />
            Шинэ эвент
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Эвент</th>
                <th>Бүлэг / Төрөл</th>
                <th>Хугацаа</th>
                <th>Үнэ</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {managedEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    Эвент олдсонгүй.
                  </td>
                </tr>
              ) : (
                managedEvents.map((ev) => (
                  <tr key={ev.id.toString()}>
                    <td>
                      <div className="fw-semibold">{ev.title?.trim() || "Арга хэмжээ"}</div>
                      <div className="small text-muted">{ev.location?.trim() || "Байршилгүй"}</div>
                    </td>
                    <td>
                      <div className="small fw-bold">{ev.chapter.name}</div>
                      <div className="smaller text-muted">{EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}</div>
                    </td>
                    <td className="small text-muted">{toDatetimeLocal(new Date(ev.startsAt))}</td>
                    <td>{fmtMoney(ev.priceMnt)}</td>
                    <td className="text-end">
                      <div className="d-inline-flex flex-wrap gap-2 justify-content-end">
                        <Link href={`/events/${ev.id}`} target="_blank" className="btn btn-sm btn-outline-primary" title="Detail">
                          <i className="fa-solid fa-eye" />
                        </Link>
                        <Link href={`/events/${ev.id}`} target="_blank" className="btn btn-sm btn-outline-secondary" title="Бүртгэл">
                          <i className="fa-solid fa-user-plus" />
                        </Link>
                        <Link href={`/platform/events?edit_event=${ev.id}`} className="btn btn-sm btn-outline-secondary">
                          Засах
                        </Link>
                        <form action={deleteEventAction} className="d-inline">
                          <input type="hidden" name="event_id" value={ev.id.toString()} />
                          <button type="submit" className="btn btn-sm btn-outline-danger">
                            <i className="fa-solid fa-trash" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form method="post" id="eventManageForm" action={saveEventAction}>
        <input type="hidden" name="event_id" value={eventForm.id.toString()} />

        <div className="tps-header mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2" style={{ fontSize: "0.7rem" }}>
              <li className="breadcrumb-item">
                <Link href="/platform" className="text-decoration-none">
                  Үндсэн
                </Link>
              </li>
              <li className="breadcrumb-item active">Хурал / Эвент менежмент</li>
            </ol>
          </nav>
          <h1 className="tps-greeting">Арга хэмжээний менежмент</h1>
          <p className="text-muted small mb-0">Шинэ эвент үүсгэх эсвэл байгаа эвентийг засна уу.</p>
        </div>

        <div className="tps-grid">
          <div className="tps-main">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="tps-form-section">
                  <div className="tps-section-head">
                    <div className="tps-section-num">1</div>
                    <span className="tps-section-title">Үндсэн мэдээлэл</span>
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Гарчиг</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="title"
                      required
                      placeholder="Эвентийн нэр"
                      defaultValue={eventForm.title}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Бүлэг</label>
                    <select className="pm-select" name="chapter_id" required defaultValue={eventForm.chapterId}>
                      {chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="pm-label">Төрөл</label>
                    <select className="pm-select" name="event_type" defaultValue={eventForm.eventType}>
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {EVENT_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="tps-form-section">
                  <div className="tps-section-head">
                    <div className="tps-section-num">2</div>
                    <span className="tps-section-title">Хугацаа ба Байршил</span>
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Эхлэх</label>
                    <input
                      type="datetime-local"
                      className="pm-input"
                      name="starts_at"
                      required
                      defaultValue={toDatetimeLocal(new Date(eventForm.startsAt))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Дуусах</label>
                    <input
                      type="datetime-local"
                      className="pm-input"
                      name="ends_at"
                      required
                      defaultValue={toDatetimeLocal(new Date(eventForm.endsAt))}
                    />
                  </div>
                  <div>
                    <label className="pm-label">Байршил</label>
                    <input
                      type="text"
                      className="pm-input"
                      name="location"
                      placeholder="Ж: Shangri-La, UB"
                      defaultValue={eventForm.location}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="tps-form-section">
                  <div className="tps-section-head">
                    <div className="tps-section-num">3</div>
                    <span className="tps-section-title">Төлбөрийн мэдээлэл</span>
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Нийт дүн (₮)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      className="pm-input"
                      name="price_mnt"
                      placeholder="Ж: 250000"
                      defaultValue={eventForm.priceMnt}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Урьдчилгаа дүн (₮)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      className="pm-input"
                      name="advance_order_mnt"
                      placeholder="Ж: 100000"
                      defaultValue={eventForm.advanceOrderMnt}
                    />
                  </div>
                  <div className="form-check mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="ev_is_online"
                      name="is_online"
                      value="1"
                      defaultChecked={eventForm.isOnline}
                    />
                    <label className="form-check-label pm-label mb-0 ms-1" htmlFor="ev_is_online">
                      Онлайн арга хэмжээ
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="tps-form-section mt-4">
              <div className="tps-section-head">
                <div className="tps-section-num">4</div>
                <span className="tps-section-title">Нийтийн detail (hural-event.php)</span>
              </div>
              <p className="small text-muted mb-3">
                Эдгээр талбарууд нийтийн хуудасны табтай таарна: <strong>Танилцуулга</strong>, <strong>Илтгэгчид</strong>,{" "}
                <strong>FAQ</strong>.
              </p>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="pm-label">Танилцуулгын текст</label>
                  <textarea
                    className="pm-input"
                    name="event_intro_body"
                    rows={5}
                    placeholder="Оролцогчид эхэнд үзэх танилцуулга..."
                    defaultValue={parsed.intro_body}
                  />
                </div>
                <div className="col-md-6">
                  <label className="pm-label">Хэн оролцох вэ? (текст)</label>
                  <textarea
                    className="pm-input"
                    name="audience_text"
                    rows={5}
                    placeholder="Зорилтот оролцогчид..."
                    defaultValue={parsed.audience_text}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="pm-label d-block mb-2">Илтгэгчид (5 хүртэл)</label>
                {speakersForm.map((spRow, sidx) => (
                  <div key={sidx} className="row g-2 mb-2 align-items-end">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="pm-input"
                        name="speaker_name"
                        placeholder="Нэр"
                        defaultValue={spRow.name}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="pm-input"
                        name="speaker_role"
                        placeholder="Албан тушаал / үүрэг"
                        defaultValue={spRow.role}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="pm-input"
                        name="speaker_photo_url"
                        placeholder="Зургийн URL"
                        defaultValue={spRow.photo_url}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="pm-label d-block mb-2">FAQ (5 хүртэл)</label>
                {faqForm.map((fRow, fi) => (
                  <div key={fi} className="row g-2 mb-2">
                    <div className="col-md-5">
                      <input
                        type="text"
                        className="pm-input"
                        name="faq_question"
                        placeholder="Асуулт"
                        defaultValue={fRow.question}
                      />
                    </div>
                    <div className="col-md-7">
                      <textarea
                        className="pm-input"
                        name="faq_answer"
                        rows={2}
                        placeholder="Хариулт"
                        defaultValue={fRow.answer}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tps-form-section mt-4">
              <div className="tps-section-head">
                <div className="tps-section-num">5</div>
                <span className="tps-section-title">Эвентийн бүртгэлийн асуулгын форм (Dynamic)</span>
              </div>
              <div className="small text-muted mb-2">Эвент бүр дээр гарч ирэх бүртгэлийн талбарууд.</div>
              <DynamicQuestionBuilder
                hiddenName="event_registration_form_json"
                initialJson={existing?.registrationFormJson ?? undefined}
                listId="eventQuestionBuilderList"
                addBtnId="eventQuestionAddBtn"
              />
            </div>

            <div className="row g-4">
              <div className="col-md-8">
                <div className="tps-form-section">
                  <div className="tps-section-head justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="tps-section-num">6</div>
                      <span className="tps-section-title">Эвентийн хөтөлбөр</span>
                    </div>
                  </div>
                  <EventItineraryBuilder hiddenName="event_sections_json" initialSections={parsed.sections} />
                </div>
              </div>
              <div className="col-md-4">
                <div className="tps-form-section">
                  <div className="tps-section-head">
                    <div className="tps-section-num">7</div>
                    <span className="tps-section-title">Холбоос ба Тохиргоо</span>
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Хуваарь (Schedule)</label>
                    <select className="pm-select" name="schedule_id" defaultValue={eventForm.scheduleId}>
                      <option value={0}>Сонгоогүй</option>
                      {schedules.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {`${sc.chapter.name} · ${sc.curriculum.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="pm-label">Curriculum</label>
                    <select className="pm-select" name="curriculum_id" defaultValue={eventForm.curriculumId}>
                      <option value={0}>Сонгоогүй</option>
                      {curriculums.map((cu) => (
                        <option key={cu.id} value={cu.id}>
                          {cu.chapter ? `${cu.chapter.name} · ${cu.name}` : cu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button type="submit" className="pm-btn-primary flex-grow-1 border-0">
                    {existing ? "Шинэчлэх" : "Үүсгэх"}
                  </button>
                  {existing ? (
                    <Link href="/platform/events" className="pm-btn-secondary text-decoration-none">
                      Цуцлах
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="pm-card mt-4" id="eventAttendeesCard">
        <div className="pm-card-header d-flex justify-content-between align-items-center">
          <div>
            <div className="pm-card-title">Эвентийн оролцогчдын жагсаалт</div>
            <div className="pm-card-subtitle">Төлөв, төлбөрийн мэдээлэлтэй оролцогчид.</div>
          </div>
          <span className="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle">Нийт 0</span>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Оролцогч</th>
                <th>Эвент</th>
                <th>Компани</th>
                <th>Утас / Email</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  Оролцогчдын өгөгдөл энд харагдана (legacy хүснэгттэй уялдуулна).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
