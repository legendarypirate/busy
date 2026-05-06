import Link from "next/link";
import { MarketingListingHero } from "@/components/marketing/MarketingListingHero";
import { TripsFilterBudgetInputs } from "@/components/trips/TripsFilterBudgetInputs";
import { dbBusinessTrip, prisma } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";
import { getMarketingListingHeroSlides } from "@/lib/marketing-listing-hero";
import { mediaUrl } from "@/lib/media-url";
import { getFooterPublicConfig } from "@/lib/footer-public-config";

export const dynamic = "force-dynamic";

const PLACEHOLDER_TRIP = "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80";

type SearchParams = {
  country?: string;
  focus?: string;
  date_from?: string;
  date_to?: string;
  trip_type?: string;
  budget_max?: string;
};

export default async function TripsPage({ searchParams }: { searchParams: SearchParams }) {
  const country = searchParams.country?.trim() || "";
  const focus = searchParams.focus?.trim() || "";
  const dateFrom = searchParams.date_from?.trim() || "";
  const dateTo = searchParams.date_to?.trim() || "";
  const validTypes = ["all", "near", "vip", "factory", "expo", "trip"];
  const tripType = validTypes.includes(searchParams.trip_type?.trim() || "") ? searchParams.trip_type!.trim() : "all";
  const budgetMax = Math.max(0, parseInt(searchParams.budget_max || "0", 10));

  const where: any = {};
  
  if (country) {
    where.destination = { contains: country, mode: 'insensitive' };
  }
  if (focus) {
    where.OR = [
      { focus: { contains: focus, mode: 'insensitive' } },
      { description: { contains: focus, mode: 'insensitive' } }
    ];
  }
  if (dateFrom || dateTo) {
    where.startDate = {};
    if (dateFrom) where.startDate.gte = new Date(dateFrom);
    if (dateTo) where.startDate.lte = new Date(dateTo);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (tripType === 'near') {
    const next90Days = new Date(today);
    next90Days.setDate(next90Days.getDate() + 90);
    where.startDate = { gte: today, lte: next90Days };
  } else if (tripType === 'vip') {
    where.statusLabel = { contains: 'VIP', mode: 'insensitive' };
  } else if (tripType === 'factory') {
    where.OR = [
      { focus: { contains: 'үйлдвэр', mode: 'insensitive' } },
      { description: { contains: 'үйлдвэр', mode: 'insensitive' } }
    ];
  } else if (tripType === 'expo') {
    where.OR = [
      { focus: { contains: 'үзэсгэлэн', mode: 'insensitive' } },
      { description: { contains: 'үзэсгэлэн', mode: 'insensitive' } }
    ];
  } else if (tripType === 'trip') {
    where.OR = [
      { focus: { contains: 'business trip', mode: 'insensitive' } },
      { focus: { contains: 'аялал', mode: 'insensitive' } },
      { description: { contains: 'business trip', mode: 'insensitive' } }
    ];
  }

  if (budgetMax > 0) {
    where.priceMnt = { lte: budgetMax };
  }

  const tripDb = dbBusinessTrip();
  const trips = await tripDb.findMany({
    where,
    orderBy: [
      { isFeatured: 'desc' },
      { startDate: 'asc' },
      { id: 'asc' }
    ]
  }).catch(() => []);

  const totalTrips = await tripDb.count().catch(() => 0);
  
  const next90 = new Date(today);
  next90.setDate(next90.getDate() + 90);
  const nearTrips = await tripDb.count({
    where: { startDate: { gte: today, lte: next90 } }
  }).catch(() => 0);

  const registeredMembers = await prisma.paymentOrder.count({
    where: { targetType: 'trip', status: { in: ['paid', 'success'] } }
  }).catch(() => 0);

  const featuredTrips = [];
  const tripCards = [];

  if (tripType === 'all') {
    for (const t of trips) {
      if (t.isFeatured === 1 && featuredTrips.length < 3) {
        featuredTrips.push(t);
      } else {
        tripCards.push(t);
      }
    }
  } else {
    if (trips.length > 0) {
      featuredTrips.push(trips[0]);
      tripCards.push(...trips.slice(1));
    }
  }

  const limitedTripCards = tripCards.slice(0, 12);
  const featuredTrip = featuredTrips[0] ?? null;

  const heroSlidesRaw = await getMarketingListingHeroSlides("trips");
  const heroSlides = heroSlidesRaw.map((u) => mediaUrl(u) || u).filter(Boolean);
  const heroFallback = "/assets/img/busy-background.png";
  const footerCfg = await getFooterPublicConfig();
  const footerContact = footerCfg.contact;

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      <MarketingListingHero slides={heroSlides} fallbackImageUrl={heroFallback}>
        <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
          Бизнес аялал
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Олон улсын бизнес аялал, үзэсгэлэн, үйлдвэртэй танилцах хөтөлбөрүүд
        </p>
      </MarketingListingHero>

      <div className="container trips-layout mt-5 mb-5">
        
        {/* Left Sidebar: Filter */}
        <aside className="trips-sidebar-left">
          <div className="sidebar-widget">
            <h3 className="widget-title">Аялал хайх</h3>
            <form method="get" action="/trips">
              <div className="filter-group">
                <label className="filter-label">Улс</label>
                <input type="text" className="filter-input" name="country" defaultValue={country} placeholder="Ж: Сингапур, БНСУ" />
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
                <label className="filter-label">Салбар</label>
                <select className="filter-select" name="focus" defaultValue={focus}>
                  <option value="">Салбар сонгох</option>
                  <option value="Инноваци">Инноваци, Технологи</option>
                  <option value="Худалдаа">Худалдаа, Ложистик</option>
                  <option value="Үйлдвэр">Үйлдвэрлэл</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Төсөв (1 хүнд)</label>
                <TripsFilterBudgetInputs budgetMaxFromUrl={budgetMax} />
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Аяллын төрөл</label>
                <select className="filter-select" name="trip_type" defaultValue={tripType}>
                  <option value="all">Бүгд</option>
                  <option value="trip">Business Trip</option>
                  <option value="factory">Үйлдвэр аялал</option>
                  <option value="expo">Үзэсгэлэн</option>
                  <option value="vip">VIP</option>
                  <option value="near">Ойрын аялал</option>
                </select>
              </div>

              <button type="submit" className="btn-brand w-100 mb-2">Хайх</button>
              <Link href="/trips" className="btn-brand-outline w-100 d-inline-block text-center" style={{ color: "var(--brand-primary)", borderColor: "var(--border-color)" }}>Шүүлтүүр цэвэрлэх</Link>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="trips-main-content">
          {/* Tabs */}
          <div className="trips-tabs">
            <Link className={`trip-tab ${tripType === 'all' ? 'active' : ''}`} href="/trips?trip_type=all">Бүгд</Link>
            <Link className={`trip-tab ${tripType === 'near' ? 'active' : ''}`} href="/trips?trip_type=near">Ойрын аялал</Link>
            <Link className={`trip-tab ${tripType === 'vip' ? 'active' : ''}`} href="/trips?trip_type=vip">VIP</Link>
            <Link className={`trip-tab ${tripType === 'factory' ? 'active' : ''}`} href="/trips?trip_type=factory">Үйлдвэр аялал</Link>
            <Link className={`trip-tab ${tripType === 'expo' ? 'active' : ''}`} href="/trips?trip_type=expo">Үзэсгэлэн</Link>
          </div>

          {/* Featured Large Card(s) */}
          {featuredTrips.map((ftrip) => (
            <div className="featured-trip-card featured-trip-card-stack" key={ftrip.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(ftrip.coverImageUrl) || PLACEHOLDER_TRIP} alt={ftrip.destination} className="featured-trip-img" />
              <div className="featured-trip-content">
                <div className="featured-trip-header">
                  <div>
                    <span className="featured-badge mb-2 d-inline-block">ОНЦЛОХ АЯЛАЛ</span>
                    <h2 className="featured-trip-title">{ftrip.destination}</h2>
                    <div className="featured-trip-meta">
                      <span><i className="fa-regular fa-calendar me-1"></i> {formatMnDate(ftrip.startDate)} - {formatMnDate(ftrip.endDate)}</span>
                    </div>
                    <div className="mb-3">
                      <span className="trip-card-badge me-2" style={{ background: "#f3f4f6" }}>Аяллын төрөл</span>
                      <span className="trip-card-badge">{ftrip.focus || 'Business Trip'}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>Хөтөлбөрийн товч</div>
                <ul className="featured-trip-features">
                  <li><i className="fa-solid fa-check"></i> {(ftrip.description || 'Бизнесийн уулзалт, танилцах хөтөлбөр.').slice(0, 120)}</li>
                  <li><i className="fa-solid fa-check"></i> B2B уулзалт, сүлжээ тогтоох боломж</li>
                  <li><i className="fa-solid fa-check"></i> Зах зээлийн бодит туршлага судлах</li>
                </ul>
                
                <div className="featured-trip-footer">
                  <div>
                    {ftrip.priceMnt ? (
                      <div className="featured-trip-price">
                        {`₮${Number(ftrip.priceMnt).toLocaleString()}`}
                      </div>
                    ) : null}
                  </div>
                  <div className="featured-trip-actions">
                    <div className="seats-badge">
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Үлдсэн суудал</div>
                      <div className="seats-count">{ftrip.seatsLabel || 'Мэдээлэл шинэчлэгдэнэ'}</div>
                    </div>
                    <div className="featured-trip-cta">
                      <Link href={`/trip-details/${ftrip.id}`} className="btn-brand-outline">Дэлгэрэнгүй</Link>
                      <Link href={`/trip-details/${ftrip.id}`} className="btn-brand">Бүртгүүлэх</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Small Trip Cards Grid */}
          <div className="trips-grid">
            {limitedTripCards.length > 0 ? (
              limitedTripCards.map((trip) => (
                <div className="trip-card-v4" key={trip.id}>
                  <div className="trip-img-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(trip.coverImageUrl) || PLACEHOLDER_TRIP} alt={trip.destination} />
                    <button type="button" className="trip-bookmark" aria-label="Хадгалах"><i className="fa-regular fa-bookmark"></i></button>
                    <div className="trip-date-overlay"><i className="fa-regular fa-calendar me-1"></i> {formatMnDate(trip.startDate)} - {formatMnDate(trip.endDate)}</div>
                  </div>
                  <div className="trip-card-body">
                    <h3 className="trip-card-title">{trip.destination}</h3>
                    <div>
                      <span className="trip-card-badge">{trip.focus || 'Business Trip'}</span>
                    </div>
                    <div className="trip-card-footer">
                      <div className="d-flex justify-content-between align-items-center">
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Үлдсэн суудал <span style={{ fontWeight: 700, color: "var(--text-main)", marginLeft: "0.2rem" }}>{trip.seatsLabel || '-'}</span></div>
                      </div>
                      {trip.priceMnt ? (
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="featured-trip-price" style={{ fontSize: "1.1rem" }}>
                            {`₮${Number(trip.priceMnt).toLocaleString()}`}
                          </div>
                        </div>
                      ) : null}
                      <Link href={`/trip-details/${trip.id}`} className="btn-brand-outline w-100 text-center py-1 mt-1" style={{ color: "var(--brand-primary)", borderColor: "#bfdbfe" }}>Дэлгэрэнгүй</Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="trip-card-v4">
                <div className="trip-card-body">
                  <h3 className="trip-card-title">Шүүлтүүрт тохирох аялал олдсонгүй</h3>
                  <Link href="/trips" className="btn-brand-outline w-100 text-center py-1 mt-1" style={{ color: "var(--brand-primary)", borderColor: "#bfdbfe" }}>Бүх аялал руу буцах</Link>
                </div>
              </div>
            )}
          </div>

          {/* View All Button */}
          <div className="text-center mb-5 mt-4">
            <Link href="/trips" className="btn-brand-outline px-5" style={{ borderRadius: 20 }}>Бүх аяллыг үзэх <i className="fa-solid fa-arrow-right ms-2" style={{ fontSize: "0.8rem" }}></i></Link>
          </div>
          
        </div>

        {/* Right Sidebar */}
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
              <span style={{ color: "var(--text-muted)" }}>Нийт аялал</span>
              <span style={{ fontWeight: 600 }}>{totalTrips.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Ойрын аялал</span>
              <span style={{ fontWeight: 600 }}>{nearTrips.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Бүртгүүлсэн гишүүд</span>
              <span style={{ fontWeight: 600 }}>{registeredMembers.toLocaleString()}+</span>
            </div>
            <div className="stat-row">
              <span style={{ color: "var(--text-muted)" }}>Хамгийн өндөр үнэлгээ</span>
              <span style={{ fontWeight: 600 }}>4.9 / 5 <i className="fa-solid fa-star" style={{ color: "#fbbf24", fontSize: "0.75rem" }}></i></span>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Тусламж хэрэгтэй юу?</h3>
            <p className="help-text">Аяллын талаар асуух зүйл байвал бидэнтэй холбогдоорой.</p>
            <div className="help-contact">
              <i className="fa-solid fa-phone" style={{ color: "var(--brand-primary)", width: 20 }}></i> {footerContact.phoneDisplay}
            </div>
            <div className="help-contact">
              <i className="fa-regular fa-envelope" style={{ color: "var(--brand-primary)", width: 20 }}></i> {footerContact.email}
            </div>
            <div className="help-contact mb-3">
              <i className="fa-solid fa-location-dot" style={{ color: "var(--brand-primary)", width: 20 }}></i> {footerContact.addressLine}
            </div>
            <button className="btn-brand-outline w-100">Холбогдох</button>
          </div>
        </aside>

      </div>
    </main>
  );
}
