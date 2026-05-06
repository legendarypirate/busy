import Link from "next/link";
import { MarketingListingHero } from "@/components/marketing/MarketingListingHero";
import {
  buildAgendaDisplayRows,
  eventListingCardImageUrl,
  eventListingSummaryBullets,
  parseBniEventDetailEnvelope,
} from "@/lib/bni-event-detail";
import { formatMnDate } from "@/lib/format-date";
import { getMarketingListingHeroSlides } from "@/lib/marketing-listing-hero";
import { mediaUrl } from "@/lib/media-url";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TIMELINE_ICONS = ["fa-door-open", "fa-microphone", "fa-handshake", "fa-users", "fa-flag-checkered", "fa-calendar-check"] as const;

type SearchParams = {
  chapter?: string;
  status?: string;
  event_type?: string;
  q?: string;
  date_from?: string;
  date_to?: string;
};

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const chapterFilter = parseInt(searchParams.chapter || "0", 10);
  const status = ["upcoming", "past", "all"].includes(searchParams.status || "") ? searchParams.status! : "upcoming";
  const validEt = ["all", "weekly_meeting", "visitor_day", "training", "social", "event"];
  const eventType = validEt.includes(searchParams.event_type || "") ? searchParams.event_type! : "all";
  const q = searchParams.q?.trim() || "";
  const dateFrom = searchParams.date_from?.trim() || "";
  const dateTo = searchParams.date_to?.trim() || "";

  const where: any = {};

  const now = new Date();
  
  if (status === "upcoming") {
    where.endsAt = { gte: now };
  } else if (status === "past") {
    where.endsAt = { lt: now };
  }

  if (!isNaN(chapterFilter) && chapterFilter > 0) {
    where.chapterId = chapterFilter;
  }

  if (eventType !== "all") {
    where.eventType = eventType;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { chapter: { name: { contains: q, mode: 'insensitive' } } },
      { chapter: { region: { name: { contains: q, mode: 'insensitive' } } } }
    ];
  }

  if (dateFrom || dateTo) {
    if (!where.startsAt) where.startsAt = {};
    if (dateFrom) where.startsAt.gte = new Date(`${dateFrom}T00:00:00Z`);
    if (dateTo) where.startsAt.lte = new Date(`${dateTo}T23:59:59Z`);
  }

  const events = await prisma.bniEvent.findMany({
    where,
    include: {
      chapter: {
        include: {
          region: true,
        },
      },
      curriculum: { select: { agendaJson: true, name: true } },
    },
    orderBy: status === "past" 
      ? [{ startsAt: 'desc' }, { id: 'desc' }]
      : [{ startsAt: 'asc' }, { id: 'asc' }],
    take: 80
  }).catch(() => []);

  const totalUpcoming = await prisma.bniEvent.count({
    where: { endsAt: { gte: now } }
  }).catch(() => 0);

  const totalPast = await prisma.bniEvent.count({
    where: { endsAt: { lt: now } }
  }).catch(() => 0);

  // Group by distinct chapterId where event exists
  const distinctChapters = await prisma.bniEvent.groupBy({
    by: ['chapterId'],
  }).catch(() => []);
  const chaptersWithEvents = distinctChapters.length;

  const featuredEvents = events.length > 0 ? [events[0]] : [];
  const eventCards = events.length > 1 ? events.slice(1, 13) : [];
  const featuredEvent = featuredEvents[0] ?? null;
  const featuredAgendaRows =
    featuredEvent != null
      ? buildAgendaDisplayRows(
          parseBniEventDetailEnvelope(featuredEvent.curriculumOverrideJson ?? undefined),
          featuredEvent.curriculum?.agendaJson ?? null,
        )
      : [];

  const getEventTitle = (ev: any) => {
    return ev.title ? ev.title : (ev.chapter?.name ? `${ev.chapter.name}` : 'Хурал / эвент');
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "visitor_day":
        return "Visitor day";
      case "training":
        return "Сургалт";
      case "social":
        return "Social";
      case "event":
        return "Event";
      default:
        return "7 хоногийн хурал";
    }
  };

  const getEventDetailUrl = (id: bigint | number | string) =>
    `/events/${typeof id === "bigint" ? id.toString() : String(id)}`;

  const queryBase = (extra: Record<string, any>) => {
    const params = new URLSearchParams();
    if (chapterFilter > 0 && !extra.chapter) params.set('chapter', chapterFilter.toString());
    Object.entries(extra).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return `/events?${params.toString()}`;
  };

  const heroSlidesRaw = await getMarketingListingHeroSlides("events");
  const heroSlides = heroSlidesRaw.map((u) => mediaUrl(u) || u).filter(Boolean);
  const heroFallback = "/assets/img/busy-background.png";

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <MarketingListingHero slides={heroSlides} fallbackImageUrl={heroFallback}>
        <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
          Хурал / Эвент
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          BNI болон платформын хурал, уулзалт, сургалтын хуваарь
        </p>
      </MarketingListingHero>

      <div className="container trips-layout mt-5 mb-5">
        
        {/* Left Sidebar: Filter */}
        <aside className="trips-sidebar-left">
          <div className="sidebar-widget">
            <h3 className="widget-title">Хурал хайх</h3>
            <form method="get" action="/events">
              {chapterFilter > 0 && <input type="hidden" name="chapter" value={chapterFilter} />}
              <input type="hidden" name="status" value={status} />
              
              <div className="filter-group">
                <label className="filter-label">Түлхүүр үг</label>
                <input type="text" className="filter-input" name="q" defaultValue={q} placeholder="Гарчиг, бүлэг, бүс" />
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Эхлэх огноо</label>
                <div className="position-relative">
                  <input type="date" className="filter-input" name="date_from" defaultValue={dateFrom} />
                  <i className="fa-regular fa-calendar position-absolute" style={{ right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}></i>
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">Дуусах огноо</label>
                <div className="position-relative">
                  <input type="date" className="filter-input" name="date_to" defaultValue={dateTo} />
                  <i className="fa-regular fa-calendar position-absolute" style={{ right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}></i>
                </div>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Төрөл</label>
                <select className="filter-select" name="event_type" defaultValue={eventType}>
                  <option value="all">Бүгд</option>
                  <option value="weekly_meeting">7 хоногийн хурал</option>
                  <option value="visitor_day">Visitor day</option>
                  <option value="training">Сургалт</option>
                  <option value="social">Social</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <button type="submit" className="btn-brand w-100 mb-2">Хайх</button>
              <Link href={chapterFilter > 0 ? `/events?chapter=${chapterFilter}&status=upcoming` : '/events'} className="btn-brand-outline w-100 d-inline-block text-center" style={{ color: "var(--brand-primary)", borderColor: "var(--border-color)" }}>Шүүлтүүр цэвэрлэх</Link>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="trips-main-content">
          <div className="trips-tabs">
            <Link className={`trip-tab ${status === 'upcoming' ? 'active' : ''}`} href={queryBase({ status: 'upcoming', event_type: eventType })}>Ирэх арга хэмжээ</Link>
            <Link className={`trip-tab ${status === 'past' ? 'active' : ''}`} href={queryBase({ status: 'past', event_type: eventType })}>Дууссан</Link>
            <Link className={`trip-tab ${status === 'all' ? 'active' : ''}`} href={queryBase({ status: 'all', event_type: eventType })}>Бүгд</Link>
            <Link className={`trip-tab ${eventType === 'weekly_meeting' ? 'active' : ''}`} href={queryBase({ status: status, event_type: 'weekly_meeting' })}>7 хоногийн хурал</Link>
            <Link className={`trip-tab ${eventType === 'visitor_day' ? 'active' : ''}`} href={queryBase({ status: status, event_type: 'visitor_day' })}>Visitor</Link>
          </div>

          {featuredEvents.map((fe) => {
            const bullets = eventListingSummaryBullets({
              location: fe.location,
              isOnline: fe.isOnline,
              curriculumOverrideJson: fe.curriculumOverrideJson ?? undefined,
              chapterName: fe.chapter?.name ?? null,
            });
            const heroSrc = eventListingCardImageUrl(fe.curriculumOverrideJson ?? undefined);
            return (
            <div className="featured-trip-card featured-trip-card-stack" key={fe.id.toString()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroSrc} alt="" className="featured-trip-img" />
              <div className="featured-trip-content">
                <div className="featured-trip-header">
                  <div>
                    <span className="featured-badge mb-2 d-inline-block">ОНЦЛОХ ХУРАЛ</span>
                    <h2 className="featured-trip-title">{getEventTitle(fe)}</h2>
                    <div className="featured-trip-meta">
                      <span><i className="fa-regular fa-calendar me-1"></i> {formatMnDate(fe.startsAt).slice(0, 16)} — {formatMnDate(fe.endsAt).slice(11, 16)}</span>
                    </div>
                    <div className="mb-3">
                      <span className="trip-card-badge me-2" style={{ background: "#f3f4f6" }}>{fe.chapter?.name || ''}</span>
                      <span className="trip-card-badge">{getEventTypeBadge(fe.eventType)}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Товч</div>
                <ul className="featured-trip-features">
                  {bullets.map((line, bi) => (
                    <li key={bi}>
                      <i className="fa-solid fa-check"></i> {line}
                    </li>
                  ))}
                </ul>
                
                <div className="featured-trip-footer">
                  <div>
                    <div className="featured-trip-price">
                      {fe.priceMnt && Number(fe.priceMnt) > 0 ? `₮${Number(fe.priceMnt).toLocaleString()}` : 'Үнэ: төлбөргүй эсвэл тодруулна'}
                    </div>
                  </div>
                  <div className="featured-trip-actions">
                    <div className="featured-trip-cta">
                      <Link href={getEventDetailUrl(fe.id)} className="btn-brand-outline">Дэлгэрэнгүй</Link>
                      <Link href={getEventDetailUrl(fe.id)} className="btn-brand">Бүртгүүлэх</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}

          <div className="trips-grid">
            {eventCards.length > 0 ? (
              eventCards.map((evRow) => (
                <div className="trip-card-v4" key={evRow.id.toString()}>
                  <div className="trip-img-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={eventListingCardImageUrl(evRow.curriculumOverrideJson ?? undefined)} alt="" />
                    <div className="trip-date-overlay"><i className="fa-regular fa-calendar me-1"></i> {formatMnDate(evRow.startsAt).slice(0, 10)}</div>
                  </div>
                  <div className="trip-card-body">
                    <h3 className="trip-card-title">{getEventTitle(evRow)}</h3>
                    <div>
                      <span className="trip-card-badge">{evRow.chapter?.name || ''}</span>
                    </div>
                    <div className="trip-card-footer">
                      <div className="d-flex justify-content-between align-items-center">
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{getEventTypeBadge(evRow.eventType)}</div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="featured-trip-price" style={{ fontSize: "1rem" }}>
                          {evRow.priceMnt && Number(evRow.priceMnt) > 0 ? `₮${Number(evRow.priceMnt).toLocaleString()}` : 'Төлбөр'}
                        </div>
                      </div>
                      <Link href={getEventDetailUrl(evRow.id)} className="btn-brand-outline w-100 text-center py-1 mt-1" style={{ color: "var(--brand-primary)", borderColor: "#bfdbfe" }}>Дэлгэрэнгүй</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (!featuredEvent && (
              <div className="trip-card-v4">
                <div className="trip-card-body">
                  <h3 className="trip-card-title">Тохирох арга хэмжээ олдсонгүй</h3>
                  <p className="text-muted small mb-3">Шүүлтүүрээ өөрчлөн дахин оролдоно уу.</p>
                  <Link href="/events" className="btn-brand-outline w-100 text-center py-1 mt-1" style={{ color: "var(--brand-primary)", borderColor: "#bfdbfe" }}>Бүх хурал руу буцах</Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mb-5 mt-4">
            <Link href="/events" className="btn-brand-outline px-5" style={{ borderRadius: 20 }}>Хуваарийг шинэчлэх <i className="fa-solid fa-arrow-right ms-2" style={{ fontSize: "0.8rem" }}></i></Link>
          </div>
          
          {featuredAgendaRows.length > 0 ? (
            <div className="timeline-section mt-5">
              <div className="timeline-header">
                <h3 className="widget-title mb-0">Хурлын үе шат</h3>
                <Link
                  href={featuredEvent ? getEventDetailUrl(featuredEvent.id) : "/events"}
                  className="btn-brand-outline btn-sm d-inline-flex align-items-center text-decoration-none"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", borderColor: "var(--border-color)" }}
                >
                  Дэлгэрэнгүй үзэх <i className="fa-solid fa-arrow-right ms-1"></i>
                </Link>
              </div>
              <div className="timeline-track">
                {featuredAgendaRows.slice(0, 6).map((row, idx) => {
                  const icon = TIMELINE_ICONS[idx % TIMELINE_ICONS.length];
                  return (
                    <div
                      key={`${row.title}-${idx}`}
                      className={`timeline-node${idx === 0 ? " is-active" : ""}`}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="node-day">{idx + 1}</div>
                      <div className={`node-circle${idx === 0 ? " active" : ""}`}>
                        <i className={`fa-solid ${icon}`} style={{ fontSize: "1rem" }} />
                      </div>
                      <div className="node-title">{row.title}</div>
                      <div className="node-desc">
                        {row.time ? `${row.time} · ` : ""}
                        {row.note || "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="testimonials-section mt-5">
            <h3 className="widget-title mb-4">Гишүүдийн туршлага</h3>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=E&background=random" className="testimonial-avatar" alt="Энхбат" />
                    <div>
                      <div className="testimonial-name">Г. Энхбат</div>
                      <div className="testimonial-role">Гүйцэтгэх захирал</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i> 5.0
                  </div>
                  <div className="testimonial-text">&quot;Хурал бүрт шинэ боломж нээгддэг.&quot;</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=O&background=random" className="testimonial-avatar" alt="Отгонтуяа" />
                    <div>
                      <div className="testimonial-name">Б. Отгонтуяа</div>
                      <div className="testimonial-role">Маркетинг менежер</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i> 4.8
                  </div>
                  <div className="testimonial-text">&quot;Зохион байгуулалт сайн, цаг баримталдаг.&quot;</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=M&background=random" className="testimonial-avatar" alt="Мөнх-Эрдэнэ" />
                    <div>
                      <div className="testimonial-name">Ц. Мөнх-Эрдэнэ</div>
                      <div className="testimonial-role">Эзэмшлийн аж ахуй</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i> 4.9
                  </div>
                  <div className="testimonial-text">&quot;Visitor өдөр маш үр өгөөжтэй.&quot;</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <aside className="trips-sidebar-right">
          <div className="sidebar-widget">
            <h3 className="widget-title">Яагаад энэ аялал?</h3>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-solid fa-users-line"></i></div>
              <div className="reason-text">Шинэ түнш, харилцагчтай холбогдох боломж</div>
            </div>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-solid fa-building-user"></i></div>
              <div className="reason-text">Салбарын тэргүүлэх компаниудтай уулзах</div>
            </div>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-solid fa-industry"></i></div>
              <div className="reason-text">Үйлдвэр, технологитой танилцах</div>
            </div>
            <div className="reason-item">
              <div className="reason-icon"><i className="fa-regular fa-lightbulb"></i></div>
              <div className="reason-text">Бизнесээ өргөжүүлэх бодит санаа, шийдэл</div>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Хурдан статистик</h3>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Нийт хурал</span>
              <span style={{ fontWeight: 600 }}>{(totalUpcoming + totalPast).toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Ирэх арга хэмжээ</span>
              <span style={{ fontWeight: 600 }}>{totalUpcoming.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Дууссан</span>
              <span style={{ fontWeight: 600 }}>{totalPast.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Идэвхтэй бүлэг</span>
              <span style={{ fontWeight: 600 }}>{chaptersWithEvents.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Хамгийн өндөр үнэлгээ</span>
              <span style={{ fontWeight: 600 }}>4.9 / 5 <i className="fa-solid fa-star" style={{ color: "#fbbf24", fontSize: "0.75rem" }}></i></span>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Тусламж хэрэгтэй юу?</h3>
            <p className="help-text">Хурал, бүртгэлийн талаар асуух зүйл байвал бидэнтэй холбогдоорой.</p>
            <div className="help-contact">
              <i className="fa-solid fa-phone" style={{ color: "var(--brand-primary)", width: 20 }}></i> +976 9300-0022
            </div>
            <div className="help-contact">
              <i className="fa-regular fa-envelope" style={{ color: "var(--brand-primary)", width: 20 }}></i> busy.mn@busy.mn
            </div>
            <div className="help-contact mb-3">
              <i className="fa-solid fa-location-dot" style={{ color: "var(--brand-primary)", width: 20 }}></i> Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, Olympic Street 19/1
            </div>
            <button className="btn-brand-outline w-100">Холбогдох</button>
          </div>
        </aside>

      </div>
    </main>
  );
}
