import Image from "next/image";
import Link from "next/link";
import HomeTripRegisterDrawer from "@/components/home/HomeTripRegisterDrawer";
import type { HomePayload } from "@/lib/home-data";
import { loadHomeData } from "@/lib/home-data";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";
import {
  SHOW_HOME_HERO_CREATE_TRIP_AND_EVENT_BUTTONS,
  SHOW_HOME_HERO_LEFT_MARKETING_SECTION,
  SHOW_HOME_HERO_V3_SECTION,
} from "@/lib/public-marketing-flags";

export const dynamic = "force-dynamic";

const PLACEHOLDER_TRIP = "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80";
const PLACEHOLDER_EVENT = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80";
const PLACEHOLDER_NEWS = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80";

/** Top hero + dashboard mockup (hidden when `SHOW_HOME_HERO_V3_SECTION` is false). */
function HomeHeroV3Section({ data }: { data: HomePayload }) {
  const hero = data.heroTrip;
  const heroTitle = (hero?.destination ?? "Ирэх аялал").trim() || "Ирэх аялал";
  const heroTitlePreview = heroTitle.length > 56 ? heroTitle.slice(0, 56) + "..." : heroTitle;
  const heroImg =
    mediaUrl(hero?.coverImageUrl ?? "") ||
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=100&q=80";
  const heroPeriod =
    hero && `${formatMnDate(hero.startDate)}${hero.endDate ? ` - ${formatMnDate(hero.endDate).slice(5)}` : ""}`;

  const tripTotal = data.stats.tripTotal || 0;
  const tripActive = data.stats.tripActive || 0;
  const eventTotal = data.stats.eventTotal || 0;
  const eventActive = data.stats.eventActive || 0;
  const registrationTotal = data.stats.registrationTotal || 0;
  const registrationNew = data.stats.registrationNew || 0;
  const revenueMonth = data.stats.revenueMonth || 0;

  return (
    <section className="hero-v3">
      <div className="container">
        <div className="row align-items-center">
          {SHOW_HOME_HERO_LEFT_MARKETING_SECTION ? (
            <div className="col-lg-6">
              <div className="hero-content-left">
                <h1 className="hero-headline">
                  Бүртгүүлээд өөрийн бизнес аялал, хурал эвентээ хялбар үүсгээрэй
                </h1>
                <p className="hero-subheadline">
                  Аялал, хурал, эвентээ үүсгээд бүртгэл, төлбөр, хуваарь, үр дүнгээ нэг дор удирдаарай. Илүү хялбар, илүү үр дүнтэй.
                </p>
                {SHOW_HOME_HERO_CREATE_TRIP_AND_EVENT_BUTTONS ? (
                  <div className="hero-btns">
                    <Link href="/dashboard/trips" className="btn-hero-primary">
                      <i className="fa-solid fa-paper-plane"></i>
                      Аялал үүсгэх
                    </Link>
                    <Link href="/dashboard/events/create" className="btn-hero-outline">
                      Хурал эвент үүсгэх
                    </Link>
                  </div>
                ) : null}
                <p className="hero-weekly-lead small text-muted mt-3 mb-0" style={{ maxWidth: 520 }}>
                  7 хоногийн бизнес хурлаа 5 минутанд үүсгэ. QR бүртгэлээр оролцогчдыг хялбар бүртгэж, уулзалтын таксийн төлбөрөө хянаж, roster sheet-ээ нэг товчоор хэвлээрэй.
                </p>
                <div className="mt-2">
                  <Link
                    href="/dashboard/weekly-meetings/new"
                    className="small fw-semibold text-primary text-decoration-none"
                  >
                    7 хоногийн хурал үүсгэх →
                  </Link>
                </div>
                <Link href="#" className="hero-how-it-works">
                  <i className="fa-solid fa-circle-play"></i>
                  Хэрхэн ажилладаг вэ?
                </Link>
              </div>
            </div>
          ) : null}
          <div
            className={SHOW_HOME_HERO_LEFT_MARKETING_SECTION ? "col-lg-6 mt-5 mt-lg-0" : "col-12 mt-4 mt-lg-0"}
          >
            <div className="dashboard-mockup">
              <div className="mockup-sidebar d-none d-md-flex">
                <div className="mockup-logo">BUSY.mn</div>
                <div className="sidebar-nav-item active">
                  <i className="fa-solid fa-house"></i> Нүүр
                </div>
                <div className="sidebar-nav-item">
                  <i className="fa-solid fa-paper-plane"></i> Аялалууд
                </div>
                <div className="sidebar-nav-item">
                  <i className="fa-solid fa-calendar-days"></i> Хурал, эвентүүд
                </div>
                <div className="sidebar-nav-item">
                  <i className="fa-solid fa-user-check"></i> Бүртгэлүүд
                </div>
                <div className="sidebar-nav-item">
                  <i className="fa-solid fa-credit-card"></i> Төлбөрүүд
                </div>
                <div className="sidebar-nav-item">
                  <i className="fa-solid fa-clock"></i> Хуваарь
                </div>
                <div className="sidebar-nav-item">
                  <i className="fa-solid fa-chart-pie"></i> Тайлан, үр дүн
                </div>
              </div>
              <div className="mockup-main">
                <div className="mockup-header">
                  <div className="mockup-title">Тойм</div>
                  <div className="d-flex gap-2 align-items-center">
                    <i className="fa-regular fa-bell text-muted"></i>
                    <div className="rounded-circle bg-secondary" style={{ width: 24, height: 24 }}></div>
                  </div>
                </div>
                <div className="mockup-stats-grid">
                  <div className="mockup-stat-card">
                    <span className="stat-card-label">Аялалууд</span>
                    <span className="stat-card-val">{tripTotal}</span>
                    <span className="stat-card-sub">Идэвхтэй {tripActive}</span>
                  </div>
                  <div className="mockup-stat-card">
                    <span className="stat-card-label">Хурал, эвент</span>
                    <span className="stat-card-val">{eventTotal}</span>
                    <span className="stat-card-sub">Идэвхтэй {eventActive}</span>
                  </div>
                  <div className="mockup-stat-card">
                    <span className="stat-card-label">Нийт бүртгэл</span>
                    <span className="stat-card-val">{registrationTotal}</span>
                    <span className="stat-card-sub">Шинэ {registrationNew}</span>
                  </div>
                  <div className="mockup-stat-card">
                    <span className="stat-card-label">Орлого (₮)</span>
                    <span className="stat-card-val">{(revenueMonth / 1000000).toFixed(1)}М</span>
                    <span className="stat-card-sub">Энэ сар</span>
                  </div>
                </div>
                <div className="mockup-activity-section">
                  <div className="activity-card">
                    <div className="activity-card-header">
                      <span className="activity-card-title">Ирэх үйл ажиллагаа</span>
                      <span className="activity-card-tag">Идэвхтэй</span>
                    </div>
                    <div className="activity-item-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImg} className="item-preview-img" alt={heroTitle} />
                      <div className="item-preview-info">
                        <span className="name">{heroTitlePreview}</span>
                        <span className="meta">{heroPeriod || "Огноо тун удахгүй"}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Нийт аялал: {tripTotal}</span>
                        <span className="text-muted">
                          {tripTotal > 0 ? Math.round((tripActive / tripTotal) * 100) : 0}%
                        </span>
                      </div>
                      <div className="progress" style={{ height: 4 }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${tripTotal > 0 ? Math.round((tripActive / tripTotal) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="registrations-card">
                    <div className="reg-list-title">Сүүлийн бүртгэлүүд</div>
                    {data.recentOrders && data.recentOrders.length > 0 ? (
                      data.recentOrders.slice(0, 3).map((order, idx) => (
                        <div className="reg-item" key={order.orderRef}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://i.pravatar.cc/50?u=order-${idx}`} className="reg-avatar" alt="User" />
                          <span className="reg-ref">#{order.orderRef}</span>
                          <span className="reg-date ms-auto text-muted">{formatMnDate(order.createdAt)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="reg-item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://i.pravatar.cc/50?u=empty" className="reg-avatar" alt="User" />
                        <span>Бүртгэл хараахан алга</span>
                        <span className="ms-auto text-muted">-</span>
                      </div>
                    )}
                    <Link href="/dashboard" className="d-block text-center small text-primary mt-2">
                      Бүгдийг харах
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const data: HomePayload = await loadHomeData();

  const primaryCoreEvent = data.coreEvents?.[0];
  const coreEventBannerUrl = primaryCoreEvent?.bannerImage ? mediaUrl(primaryCoreEvent.bannerImage) : PLACEHOLDER_EVENT;

  return (
    <main className="home-page-v3">
      {SHOW_HOME_HERO_V3_SECTION ? <HomeHeroV3Section data={data} /> : null}

      {/* International Business Trips */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="section-title-v2 m-0">Олон улсын бизнес аялал</h2>
            <Link href="/trips" className="text-primary small text-decoration-none">Бүгдийг харах</Link>
          </div>
          <div className="trips-v3-grid">
            {data.businessTrips && data.businessTrips.length > 0 ? (
              data.businessTrips.slice(0, 3).map((trip) => {
                const tTitle = trip.destination || "Бизнес аялал";
                const tImage = mediaUrl(trip.coverImageUrl) || PLACEHOLDER_TRIP;
                const tDate = trip.startDate ? `${formatMnDate(trip.startDate)}${trip.endDate ? ` - ${formatMnDate(trip.endDate).slice(5)}` : ""}` : "Огноо удахгүй";
                const tDesc = trip.description || "Бизнес аяллын дэлгэрэнгүй мэдээлэл удахгүй нэмэгдэнэ.";
                const tStatus = trip.statusLabel || "Идэвхтэй";
                
                return (
                  <div className="trip-card-exact" key={trip.id}>
                    <div className="trip-exact-img-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tImage} className="trip-exact-img" alt={tTitle} />
                      <span className={`trip-status-tag ${tStatus !== 'Идэвхтэй' ? 'inactive' : ''}`}>{tStatus}</span>
                    </div>
                    <div className="trip-exact-body">
                      <h3 className="trip-exact-title">{tTitle}</h3>
                      <div className="trip-exact-date text-primary">{tDate}</div>
                      <p className="trip-exact-desc">{tDesc.slice(0, 120)}...</p>
                      <div className="trip-exact-btns">
                        <button
                          type="button"
                          className="btn-qpay js-trip-register-btn"
                          data-trip-id={String(trip.id)}
                          data-trip-title={tTitle}
                        >
                          Захиалах
                        </button>
                        <Link href={`/trip-details/${trip.id}`} className="btn-exact-outline text-center">Дэлгэрэнгүй</Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="trip-card-exact">
                <div className="trip-exact-body">
                  <h3 className="trip-exact-title">Одоогоор аялал алга</h3>
                  <p className="trip-exact-desc">Шинэ аялал нэмэгдэхэд энд автоматаар харагдана.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Core Activities Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="section-title-v2 mb-4">Үндсэн үйл ажиллагаа</h2>
          <div className="activities-tabs">
            <button type="button" className="activity-tab active">Эвэнт / Уулзалт</button>
          </div>

          <div className="activity-pane active">
            <div className="activity-main-grid">
              <div className="upcoming-meeting-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coreEventBannerUrl} className="meeting-card-img" alt={primaryCoreEvent?.title || "Эвент"} />
                <div className="meeting-card-body">
                  <div className="text-muted small mb-2">Ирэх эвент</div>
                  <h3 className="meeting-card-title">{primaryCoreEvent?.title || "Ирэх эвент зарлагдаагүй"}</h3>
                  <div className="meeting-card-meta">
                    <span>
                      <i className="fa-regular fa-calendar me-2"></i>{" "}
                      {primaryCoreEvent?.startsAt ? formatMnDate(primaryCoreEvent.startsAt) : "Тун удахгүй"}
                    </span>
                    <span>
                      <i className="fa-solid fa-location-dot me-2"></i> {primaryCoreEvent?.location || "Байршил шинэчлэгдэнэ"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Ирэх эвент {data.coreEvents?.length || 0}</span>
                      <span className="text-muted">{data.coreEvents?.length ? "100%" : "0%"}</span>
                    </div>
                    <div className="progress" style={{ height: 6, borderRadius: 3 }}>
                      <div className="progress-bar bg-primary" style={{ width: data.coreEvents?.length ? "100%" : "0%" }}></div>
                    </div>
                  </div>
                  <Link
                    href={primaryCoreEvent ? `/events/${primaryCoreEvent.id}` : "/events"}
                    className="btn btn-outline-primary btn-sm rounded-pill px-4"
                  >
                    Дэлгэрэнгүй
                  </Link>
                </div>
              </div>

              <div className="featured-members-box">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="m-0" style={{ fontSize: "0.95rem", fontWeight: 800 }}>Ойрын эвентүүд</h4>
                  <Link href="/events" className="small text-primary text-decoration-none">Бүгдийг харах</Link>
                </div>
                <div className="event-mini-list">
                  {data.coreEvents && data.coreEvents.length > 0 ? (
                    data.coreEvents.map((evt) => (
                      <Link href={`/events/${evt.id}`} className="event-mini-item text-decoration-none text-reset" key={evt.id}>
                        <div className="event-mini-title">{evt.title}</div>
                        <div className="event-mini-meta">
                          <span>
                            <i className="fa-regular fa-calendar me-1"></i> {formatMnDate(evt.startsAt)}
                          </span>
                          <span>
                            <i className="fa-solid fa-location-dot me-1"></i> {evt.location || "Байршил шинэчлэгдэнэ"}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="event-mini-empty">Одоогоор эвент бүртгэгдээгүй байна.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Members Section */}
      <section className="py-4">
        <div className="container">
          <div className="featured-members-box">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title-v2 m-0">Онцлох гишүүд</h2>
              <Link href="/members" className="small text-primary text-decoration-none">Бүгдийг харах</Link>
            </div>
            <div className="featured-members-grid">
              {data.featuredMembers && data.featuredMembers.length > 0 ? (
                data.featuredMembers.slice(0, 12).map((member) => (
                  <div className="featured-member-item" key={member.id}>
                    <div className="member-item-logo featured-member-logo">
                      {member.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(member.photo)} alt={member.name} />
                      ) : (
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b" }}>{member.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="featured-member-name">{member.company || member.name}</div>
                  </div>
                ))
              ) : (
                <div className="member-item-logo" style={{ background: "#f1f5f9", border: "none", fontSize: "0.7rem", fontWeight: "bold", color: "#cbd5e1" }}>
                  Гишүүдгүй
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section — after Онцлох гишүүд */}
      <section className="partners-section">
        <div className="container">
          <div className="partners-head">
            <h2 className="partners-title">Гишүүн байгууллагууд</h2>
            <div className="partners-head-right">
              <span className="partners-subtitle">Манай хамтрагч байгууллагууд</span>
            </div>
          </div>
          <div className="partner-slider">
            <div className="partner-viewport">
              <div className="partner-track d-flex gap-3 overflow-auto pb-3" style={{ scrollSnapType: "x mandatory" }}>
                {data.partners && data.partners.length > 0 ? (
                  data.partners.map((p) => (
                    <Link href={p.href || "/members"} className="partner-card partner-card-link" key={p.name} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
                      <div className="partner-logo-shell">
                        {p.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logo} className="partner-logo-img" alt={p.name} loading="lazy" />
                        ) : (
                          <span className="partner-fallback-icon">
                            <i className="fa-solid fa-building"></i>
                          </span>
                        )}
                      </div>
                      <span className="partner-name">{p.name}</span>
                    </Link>
                  ))
                ) : (
                  <div className="partner-card">
                    <div className="partner-logo-shell">
                      <span className="partner-fallback-icon"><i className="fa-solid fa-building"></i></span>
                    </div>
                    <span className="partner-name">Одоогоор компани бүртгэгдээгүй</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company News */}
      {data.latestNews && data.latestNews.length > 0 && (
        <section className="py-4 company-news-home-section">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title-v2 m-0">Шинэ мэдээ</h2>
              <Link href="/news" className="text-primary small text-decoration-none">Бүгдийг харах</Link>
            </div>
            <div className="company-news-home-grid">
              {data.latestNews.slice(0, 6).map((news) => (
                <Link href="/news" className="company-news-home-card" key={news.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(news.image) || PLACEHOLDER_NEWS} className="company-news-home-img" alt={news.title} />
                  <div className="company-news-home-body">
                    <h3 className="company-news-home-title">{news.title.length > 72 ? news.title.slice(0, 72) + "..." : news.title}</h3>
                    <div className="company-news-home-date">{formatMnDate(news.createdAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom Sections Grid */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <h2 className="section-title-v2 mb-4">Хөрөнгө оруулалтын салбарууд</h2>
              <div className="investment-grid">
                <div className="investment-sector-card">
                  <div className="sector-header">
                    <div className="sector-title">Үйлдвэрлэл</div>
                    <div className="sector-stats">
                      <span className="sector-count">124</span>
                      <span className="text-muted small">төсөл</span>
                      <span className="sector-growth">+18%</span>
                    </div>
                    <div className="text-muted small">(2025 он)</div>
                  </div>
                  <div className="sector-chart">
                    <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,50 L20,45 L40,48 L60,40 L80,35 L100,38 L120,30 L140,25 L160,28 L180,20 L200,15" fill="none" stroke="#10b981" strokeWidth="2" />
                      <circle cx="200" cy="15" r="3" fill="#10b981" />
                    </svg>
                  </div>
                </div>
                <div className="investment-sector-card">
                  <div className="sector-header">
                    <div className="sector-title">Технологи, инноваци</div>
                    <div className="sector-stats">
                      <span className="sector-count">98</span>
                      <span className="text-muted small">төсөл</span>
                      <span className="sector-growth">+24%</span>
                    </div>
                    <div className="text-muted small">(2025 он)</div>
                  </div>
                  <div className="sector-chart">
                    <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0,55 L20,50 L40,52 L60,45 L80,48 L100,35 L120,38 L140,30 L160,25 L180,22 L200,10" fill="none" stroke="#3b82f6" strokeWidth="2" />
                      <circle cx="200" cy="10" r="3" fill="#3b82f6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="d-flex justify-content-between align-items-center mb-4 mt-5 mt-lg-0">
                <h2 className="section-title-v2 m-0">Мэдээ мэдээлэл</h2>
                <Link href="/news" className="text-primary small text-decoration-none">Бүгдийг харах</Link>
              </div>
              <div className="news-exact-grid">
                {data.latestNews && data.latestNews.length > 0 ? (
                  data.latestNews.slice(0, 3).map((article) => (
                    <div className="news-card-exact" key={article.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(article.image) || PLACEHOLDER_NEWS} className="news-exact-img" alt={article.title} />
                      <div className="news-exact-body">
                        <h3 className="news-exact-title">{article.title.slice(0, 80)}</h3>
                        <div className="news-exact-date">{formatMnDate(article.createdAt)}</div>
                        <Link href="/news" className="small text-primary text-decoration-none d-block mt-2">Дэлгэрэнгүй</Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="news-card-exact">
                    <div className="news-exact-body">
                      <h3 className="news-exact-title">Одоогоор мэдээ байхгүй байна</h3>
                      <div className="news-exact-date">-</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeTripRegisterDrawer />
    </main>
  );
}
