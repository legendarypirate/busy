import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import EventDetailRegisterDrawer from "@/components/events/EventDetailRegisterDrawer";
import { EventDetailRegistrationQr } from "@/components/events/EventDetailRegistrationQr";
import EventDetailTabs from "@/components/events/EventDetailTabs";
import {
  buildAgendaDisplayRows,
  eventTypeBadgeMn,
  parseBniEventDetailEnvelope,
  resolvedAudienceText,
  resolvedEventDescription,
  resolvedEventHeroImageUrl,
  speakerPortraitUrl,
} from "@/lib/bni-event-detail";
import { formatMnDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import { bniEventPublicDetailSelect } from "@/lib/prisma-event-select";
import { marketingSiteOrigin } from "@/lib/marketing-site-origin";
import { helpEmailParts, helpPhoneTelParts, normalizeHelpChatHref } from "@/lib/public-help-contact";
import { SITE_CONTACT } from "@/lib/site-contact";

export const dynamic = "force-dynamic";

const EVENT_DEFAULT_HERO = "/assets/img/meeting-hero.png";
const EVENT_MINI_IMG = "/assets/img/meeting-hero.png";

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

  const registeredTotal = await prisma.tripFormResponse
    .count({ where: { eventId: nid } })
    .catch(() => 0);

  const publishedForm = await prisma.tripRegistrationForm.findFirst({
    where: { eventId: nid, isPublished: true },
    select: { publicSlug: true },
  });

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

  const heroFromEnvelope = resolvedEventHeroImageUrl(envelope);
  const heroSrc = heroFromEnvelope !== "" ? heroFromEnvelope : EVENT_DEFAULT_HERO;
  const progressPct =
    registeredTotal > 0 ? Math.min(100, Math.max(18, 20 + Math.min(80, registeredTotal * 6))) : 14;

  const origin = marketingSiteOrigin();
  const sharePath = `/events/${nid.toString()}`;
  const registerTargetPath = publishedForm?.publicSlug
    ? `/register/${encodeURIComponent(publishedForm.publicSlug)}`
    : sharePath;
  const registerAbsUrl = `${origin}${registerTargetPath}`;
  let registrationQrDataUrl: string | null = null;
  let registrationQrCaption: string | null = null;
  try {
    registrationQrDataUrl = await QRCode.toDataURL(registerAbsUrl, {
      margin: 2,
      width: 220,
      color: { dark: "#1d4ed8", light: "#ffffff" },
    });
    registrationQrCaption = publishedForm?.publicSlug
      ? "Утасны камераар уншуулбал нийтийн бүртгэлийн хуудас нээгдэнэ."
      : "Утасны камераар уншуулбал энэ эвентийн хуудас нээгдэнэ (бүртгэлийн товчоор бөглөнө).";
  } catch {
    registrationQrDataUrl = null;
    registrationQrCaption = null;
  }

  const eventManagerCall = helpPhoneTelParts(envelope.event_manager_phone);
  const eventHelpEmail = helpEmailParts(envelope.event_help_email, SITE_CONTACT.email);
  const eventHelpChatHref = normalizeHelpChatHref(envelope.event_help_chat_url);
  const eventHelpChatExternal = eventHelpChatHref != null && /^https?:\/\//i.test(eventHelpChatHref);

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
            <img src={heroSrc} alt="" />
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
                <span>Илгээсэн бүртгэл: {registeredTotal}</span>
                <span>
                  <Link href="/events" className="text-decoration-none">
                    Бусад эвент
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
                <span className="seat-remain">Илгээсэн: {registeredTotal}</span>
              </div>

              <p className="small text-muted mb-3">
                Доорх товчоор бүртгэлийн хураангуйг бөглөнө. Зохион байгуулагч таны мэдээллийг шалгана.
              </p>

              <EventDetailRegisterDrawer eventId={ev.id.toString()} initialTitle={hTitle} />

              {registrationQrDataUrl ? (
                <div className="mt-4 pt-3 border-top border-secondary-subtle">
                  <div className="small fw-bold text-uppercase text-muted mb-2" style={{ letterSpacing: "0.04em" }}>
                    Бүртгэлийн холбоос (QR)
                  </div>
                  <EventDetailRegistrationQr
                    qrDataUrl={registrationQrDataUrl}
                    formUrl={registerAbsUrl}
                    caption={registrationQrCaption}
                  />
                </div>
              ) : null}

              <div className="hev-help-card mt-4">
                <div className="hev-help-card__title">Тусламж</div>
                <p className="hev-help-lead">Зохион байгуулагч, тусламжийн холбоос.</p>
                <div className="hev-help-grid">
                  {eventManagerCall ? (
                    <Link href={eventManagerCall.href} className="hev-help-tile">
                      <i className="fa-solid fa-phone" />
                      <span>{eventManagerCall.label}</span>
                    </Link>
                  ) : (
                    <div className="hev-help-tile opacity-50" role="status">
                      <i className="fa-solid fa-phone" />
                      <span>Утас тохируулаагүй</span>
                    </div>
                  )}
                  <Link href={eventHelpEmail.href} className="hev-help-tile">
                    <i className="fa-solid fa-envelope" />
                    <span>{eventHelpEmail.label}</span>
                  </Link>
                  {eventHelpChatHref ? (
                    <Link
                      href={eventHelpChatHref}
                      className="hev-help-tile hev-help-tile--wide"
                      {...(eventHelpChatExternal ? { target: "_blank" as const, rel: "noopener noreferrer" as const } : {})}
                    >
                      <i className="fa-solid fa-comments" />
                      <span>Онлайн чат</span>
                    </Link>
                  ) : (
                    <div className="hev-help-tile hev-help-tile--wide opacity-50" role="status">
                      <i className="fa-solid fa-comments" />
                      <span>Онлайн чатын холбоос тохируулаагүй</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="form-terms">
                Холбоо барих, нөхцөлийн талаар{" "}
                <Link href="/contact" className="text-decoration-none">
                  холбоо барих хуудас
                </Link>
                -аар хандана уу.
              </p>

              <div className="organizer-card">
                <div className="organizer-info">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/img/bsy.png" className="organizer-logo" alt="BUSY" />
                  <div className="organizer-name">BUSY.mn</div>
                </div>
                <div className="organizer-contact">
                  <a href={`tel:${SITE_CONTACT.phoneTel}`} className="contact-item">
                    <i className="fa-solid fa-phone" /> {SITE_CONTACT.phoneDisplay}
                  </a>
                  <a href={`mailto:${SITE_CONTACT.email}`} className="contact-item">
                    <i className="fa-solid fa-envelope" /> {SITE_CONTACT.email}
                  </a>
                  <a href="https://busy.mn" target="_blank" rel="noopener noreferrer" className="contact-item">
                    <i className="fa-solid fa-globe" /> busy.mn
                  </a>
                </div>
              </div>

              <div className="event-stats-footer">
                <div className="stat-box">
                  <span className="stat-num">{registeredTotal}</span>
                  <span className="stat-lab">Илгээсэн бүртгэл</span>
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
