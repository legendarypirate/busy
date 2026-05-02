import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventDetailTabs from "@/components/events/EventDetailTabs";
import {
  buildAgendaDisplayRows,
  eventTypeBadgeMn,
  parseBniEventDetailEnvelope,
  resolvedAudienceText,
  resolvedEventDescription,
  speakerPortraitUrl,
} from "@/lib/bni-event-detail";
import { formatMnDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import { bniEventPublicDetailSelect } from "@/lib/prisma-event-select";

export const dynamic = "force-dynamic";

const EVENT_HERO_IMG =
  "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80";
const EVENT_MINI_IMG =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let nid: bigint;
  try {
    nid = BigInt(id);
  } catch {
    return { title: "Арга хэмжээ" };
  }
  const ev = await prisma.bniEvent
    .findUnique({
      where: { id: nid },
      select: { title: true, curriculumOverrideJson: true, chapter: { select: { name: true } } },
    })
    .catch(() => null);
  if (!ev) {
    return { title: "Арга хэмжээ олдсонгүй" };
  }
  const env = parseBniEventDetailEnvelope(ev.curriculumOverrideJson ?? undefined);
  const title = ev.title?.trim() || ev.chapter?.name?.trim() || "Хурал / эвент";
  const desc = resolvedEventDescription(env).slice(0, 160);
  return { title, description: desc };
}

function ubTime(d: Date): string {
  return d.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  });
}

function ubWeekday(d: Date): string {
  return d.toLocaleDateString("mn-MN", { weekday: "long", timeZone: "Asia/Ulaanbaatar" });
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  let nid: bigint;
  try {
    nid = BigInt(id);
  } catch {
    notFound();
  }

  const ev = await prisma.bniEvent
    .findUnique({
      where: { id: nid },
      select: bniEventPublicDetailSelect,
    })
    .catch(() => null);

  if (!ev) {
    notFound();
  }

  const envelope = parseBniEventDetailEnvelope(ev.curriculumOverrideJson ?? undefined);
  const description = resolvedEventDescription(envelope);
  const audienceText = resolvedAudienceText(envelope);
  const agendaRows = buildAgendaDisplayRows(envelope, ev.curriculum?.agendaJson ?? null);
  const typeBadge = eventTypeBadgeMn(ev.eventType);
  const chapterName = ev.chapter?.name?.trim() ?? "";
  const regionName = ev.chapter?.region?.name?.trim() ?? "";
  const hTitle = ev.title?.trim() || chapterName || "Хурал / эвент";

  const dateLabelFull = `${formatMnDate(ev.startsAt)} ${ubWeekday(ev.startsAt)}`;
  const timeLabel = `${ubTime(ev.startsAt)} - ${ubTime(ev.endsAt)}`;
  const locRaw = ev.location?.trim() ?? "";

  const speakers = envelope.speakers.map((s) => ({
    name: s.name,
    role: s.role,
    imageUrl: speakerPortraitUrl(s.name, s.photo_url),
  }));

  const faq = envelope.faq.map((f) => ({ question: f.question, answer: f.answer }));

  const registeredTotal = 0;
  const progressPct = registeredTotal > 0 ? Math.min(92, Math.max(12, 18 + Math.min(74, registeredTotal * 4))) : 28;

  const similar =
    ev.chapterId != null
      ? await prisma.bniEvent
          .findMany({
            where: {
              chapterId: ev.chapterId,
              id: { not: ev.id },
              endsAt: { gte: new Date() },
            },
            orderBy: [{ startsAt: "asc" }, { id: "asc" }],
            take: 8,
            select: {
              id: true,
              title: true,
              startsAt: true,
              priceMnt: true,
              chapter: { select: { name: true } },
            },
          })
          .catch(() => [])
      : [];

  return (
    <div className="hural-event-page">
      <div className="container">
        <nav className="breadcrumb-container" aria-label="breadcrumb">
          <ul className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link href="/">Нүүр</Link>
            </li>
            <li className="breadcrumb-separator">
              <i className="fa-solid fa-chevron-right small" />
            </li>
            <li className="breadcrumb-item">
              <Link href="/events">Хурал эвент</Link>
            </li>
            <li className="breadcrumb-separator">
              <i className="fa-solid fa-chevron-right small" />
            </li>
            <li className="breadcrumb-item active">{hTitle}</li>
          </ul>
        </nav>

        <div className="event-type-tabs">
          <Link
            href="/events?event_type=weekly_meeting&status=upcoming"
            className={`event-type-btn${ev.eventType === "weekly_meeting" ? " active" : ""}`}
          >
            <div className="event-type-icon">
              <i className="fa-solid fa-users" />
            </div>
            BNI 7 хоногийн хурал
          </Link>
          <Link
            href="/events?event_type=visitor_day&status=upcoming"
            className={`event-type-btn${ev.eventType === "visitor_day" ? " active" : ""}`}
          >
            <div className="event-type-icon">
              <i className="fa-solid fa-user-plus" />
            </div>
            MEGA Visitor хурал
          </Link>
          <Link
            href="/events?status=upcoming"
            className={`event-type-btn${!["weekly_meeting", "visitor_day"].includes(ev.eventType) ? " active" : ""}`}
          >
            <div className="event-type-icon">
              <i className="fa-solid fa-globe" />
            </div>
            Бусад арга хэмжээ
          </Link>
        </div>

        <section className="event-hero-card">
          <div className="event-hero-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EVENT_HERO_IMG} alt="" />
            <div className="event-hero-badge">{typeBadge}</div>
          </div>
          <div className="event-hero-content">
            <div className="event-hero-header">
              <h1 className="event-title-main">{hTitle}</h1>
              <div className="event-action-btns">
                <button type="button" className="btn-icon-circle" title="Bookmark" aria-label="Bookmark">
                  <i className="fa-regular fa-bookmark" />
                </button>
              </div>
            </div>
            <p className="event-description">{description}</p>

            <div className="event-meta-info">
              <div className="meta-item">
                <div className="meta-icon">
                  <i className="fa-solid fa-calendar-days" />
                </div>
                <div>
                  <span className="meta-label">Огноо</span>
                  <span className="meta-value">{dateLabelFull}</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon">
                  <i className="fa-solid fa-clock" />
                </div>
                <div>
                  <span className="meta-label">Цаг</span>
                  <span className="meta-value">{timeLabel}</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon">
                  <i className="fa-solid fa-location-dot" />
                </div>
                <div>
                  <span className="meta-label">Байршил</span>
                  <span className="meta-value" style={{ whiteSpace: "pre-wrap" }}>
                    {locRaw !== "" ? locRaw : "Тодруулна"}
                  </span>
                </div>
              </div>
            </div>

            <div className="event-capacity-info">
              <div className="capacity-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/img/bsy.png" alt="" width={32} height={32} style={{ borderRadius: 4 }} />
                <div className="capacity-text">
                  <span className="label">Бүлэг / зохион байгуулагч</span>
                  <span className="value">{chapterName || "—"}</span>
                </div>
              </div>
              <div className="capacity-item">
                <div className="capacity-icon">
                  <i className="fa-solid fa-map-location-dot" />
                </div>
                <div className="capacity-text">
                  <span className="label">Бүс</span>
                  <span className="value">{regionName || "—"}</span>
                </div>
              </div>
              <div className="capacity-item">
                <div className="capacity-icon">
                  <i className="fa-solid fa-briefcase" />
                </div>
                <div className="capacity-text">
                  <span className="label">Төрөл</span>
                  <span className="value">{typeBadge}</span>
                </div>
              </div>
            </div>

            <div className="registration-progress mt-4">
              <div className="progress-label">
                <span>Бүртгүүлсэн: {registeredTotal}</span>
                <span>
                  <Link href="/events" className="text-decoration-none">
                    Бүртгэлийн төлөв
                  </Link>
                </span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </section>

        <div className="event-grid">
          <div className="main-column">
            <EventDetailTabs
              description={description}
              audienceText={audienceText}
              chapterName={chapterName}
              regionName={regionName}
              typeBadge={typeBadge}
              agendaRows={agendaRows}
              speakers={speakers}
              faq={faq}
            />

            <div className="similar-events mt-4">
              <div className="section-header-v2">
                <h2 className="section-title-v2">Төстэй хурал, эвент</h2>
                {ev.chapterId != null ? (
                  <Link
                    href={`/events?chapter=${ev.chapterId}&status=upcoming`}
                    className="small text-muted text-decoration-none"
                  >
                    Энэ бүлгийн хуваарь <i className="fa-solid fa-chevron-right ms-1" />
                  </Link>
                ) : (
                  <Link href="/events?status=upcoming" className="small text-muted text-decoration-none">
                    Бүх ирэх эвент <i className="fa-solid fa-chevron-right ms-1" />
                  </Link>
                )}
              </div>
              <div className="event-scroll-container">
                {similar.length === 0 ? (
                  <p className="small text-muted mb-0 px-2">Төстэй ирээдүйн арга хэмжээ байхгүй байна.</p>
                ) : (
                  similar.map((sim) => {
                    const simTitle = sim.title?.trim() || sim.chapter?.name?.trim() || "Хурал";
                    const simDate = formatMnDate(sim.startsAt);
                    const simPrice = sim.priceMnt != null && Number(sim.priceMnt) > 0;
                    return (
                      <Link key={sim.id.toString()} href={`/events/${sim.id}`} className="mini-event-card text-decoration-none text-reset">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={EVENT_MINI_IMG} className="mini-card-img" alt="" />
                        <div className="mini-card-body">
                          <h3 className="mini-card-title">{simTitle}</h3>
                          <div className="mini-card-meta">
                            <span>{simDate}</span>
                            <span className="text-primary fw-bold">
                              {simPrice ? `₮${Number(sim.priceMnt).toLocaleString("mn-MN")}` : "Төлбөр"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <aside className="sidebar-column">
            <div className="registration-card">
              <div className="registration-title">
                Бүртгэл
                <span className="seat-remain">Бүртгэл: {registeredTotal}</span>
              </div>

              <label className="form-label-custom">Тасалбарын төрөл</label>
              <select className="form-input-custom" defaultValue="std" disabled aria-readonly>
                <option value="std">Ердийн оролцоо</option>
                <option value="vip">VIP оролцоо</option>
              </select>

              <label className="form-label-custom">Оролцогчийн төрөл</label>
              <div className="segmented-control" aria-hidden>
                <button type="button" className="segment-btn active" disabled>
                  Гишүүн
                </button>
                <button type="button" className="segment-btn" disabled>
                  Зочин
                </button>
                <button type="button" className="segment-btn" disabled>
                  Үзэсгэлэн
                </button>
              </div>

              <p className="small text-muted mb-3">
                Бүртгэлийг платформоор идэвхжүүлсэн үед энд бөглөх хэлбэр гарна. Одоогоор дэлгэрэнгүй мэдээллийг доорх холбоосоор
                үзнэ үү.
              </p>

              <Link href={`/events/${ev.id}`} className="btn-register-submit text-center text-decoration-none d-block">
                Дэлгэрэнгүй хуудас
              </Link>

              <p className="form-terms">
                Нөхцөл, нууцлалын талаар{" "}
                <Link href="#" className="text-decoration-none">
                  нууцлалын бодлого
                </Link>
                ,{" "}
                <Link href="#" className="text-decoration-none">
                  нөхцөл, болзол
                </Link>
                -ыг хүндэтгэнэ үү.
              </p>

              <div className="organizer-card">
                <div className="organizer-info">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/img/bsy.png" className="organizer-logo" alt="BUSY" />
                  <div className="organizer-name">BUSY.mn</div>
                </div>
                <div className="organizer-contact">
                  <a href="tel:+97670001010" className="contact-item">
                    <i className="fa-solid fa-phone" /> +976 7000 1010
                  </a>
                  <a href="mailto:info@busy.mn" className="contact-item">
                    <i className="fa-solid fa-envelope" /> info@busy.mn
                  </a>
                  <a href="https://busy.mn" target="_blank" rel="noopener noreferrer" className="contact-item">
                    <i className="fa-solid fa-globe" /> busy.mn
                  </a>
                </div>
              </div>

              <div className="event-stats-footer">
                <div className="stat-box">
                  <span className="stat-num">{registeredTotal}</span>
                  <span className="stat-lab">Нийт бүртгэл</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">0</span>
                  <span className="stat-lab">Нээлттэй</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">0</span>
                  <span className="stat-lab">Дотоод</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{faq.length}</span>
                  <span className="stat-lab">FAQ</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
