import Link from "next/link";
import { TripsFilterBudgetInputs } from "@/components/trips/TripsFilterBudgetInputs";
import { prisma } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";

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

  const trips = await prisma.businessTrip.findMany({
    where,
    orderBy: [
      { isFeatured: 'desc' },
      { startDate: 'asc' },
      { id: 'asc' }
    ]
  }).catch(() => []);

  const totalTrips = await prisma.businessTrip.count().catch(() => 0);
  
  const next90 = new Date(today);
  next90.setDate(next90.getDate() + 90);
  const nearTrips = await prisma.businessTrip.count({
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

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Trips Hero Section */}
      <section className="py-5" style={{ background: "url('/assets/img/busy-background.png') no-repeat center bottom", backgroundSize: "cover", minHeight: "250px", position: "relative" }}>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Бизнес аялал</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Олон улсын бизнес аялал, үзэсгэлэн, үйлдвэртэй танилцах хөтөлбөрүүд</p>
        </div>
        {/* Light overlay to make background very subtle */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.7)", zIndex: 1 }}></div>
      </section>

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
                    <div className="featured-trip-price">
                      {ftrip.priceMnt ? `₮${Number(ftrip.priceMnt).toLocaleString()}` : 'Үнэ шинэчлэгдэнэ'}
                      <span>/ 1 хүнд</span>
                    </div>
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
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="featured-trip-price" style={{ fontSize: "1.1rem" }}>
                          {trip.priceMnt ? `₮${Number(trip.priceMnt).toLocaleString()}` : 'Үнэ шинэчлэгдэнэ'}
                          <span style={{ fontSize: "0.7rem" }}>/ 1 хүнд</span>
                        </div>
                      </div>
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
          
          {/* Timeline Section */}
          <div className="timeline-section mt-5">
            <div className="timeline-header">
              <h3 className="widget-title mb-0">Аяллын хөтөлбөр</h3>
              <Link href={featuredTrip ? `/trip-details/${featuredTrip.id}` : '/trips'} className="btn-brand-outline btn-sm d-inline-flex align-items-center text-decoration-none" style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", borderColor: "var(--border-color)" }}>Бүрэн хөтөлбөрийг үзэх <i className="fa-solid fa-arrow-right ms-1"></i></Link>
            </div>
            
            <div className="timeline-track">
              <div className="timeline-node is-active" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 1</div>
                <div className="node-circle active"><i className="fa-solid fa-plane-arrival" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Аялал эхлэх</div>
                <div className="node-desc">Нислэг, буудал, зочид буудалд байрлах</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 2</div>
                <div className="node-circle"><i className="fa-regular fa-handshake" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Бизнес уулзалт</div>
                <div className="node-desc">Төрийн байгууллага, компаниудтай уулзалт</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 3</div>
                <div className="node-circle"><i className="fa-solid fa-industry" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Үйлдвэр танилцах</div>
                <div className="node-desc">Үйлдвэрийн айлчлал, презентаци</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 4</div>
                <div className="node-circle"><i className="fa-solid fa-users-viewfinder" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">B2B сүлжээ</div>
                <div className="node-desc">Сүлжээ үүсгэх, хамтын ажиллагаа</div>
              </div>
              <div className="timeline-node" role="button" tabIndex={0}>
                <div className="node-day">Өдөр 5</div>
                <div className="node-circle"><i className="fa-solid fa-plane-departure" style={{ fontSize: "1rem" }}></i></div>
                <div className="node-title">Буцах аялал</div>
                <div className="node-desc">Дүгнэлт, чөлөөт цаг, буцах нислэг</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="testimonials-section mt-5">
            <h3 className="widget-title mb-4">Оролцогчдын сэтгэгдэл</h3>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=E&background=random" className="testimonial-avatar" alt="Энхбат" />
                    <div>
                      <div className="testimonial-name">Г. Энхбат</div>
                      <div className="testimonial-role">Гүйцэтгэх захирал, TechBridge LLC</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i> 5.0
                  </div>
                  <div className="testimonial-text">&quot;Шинэ түншүүдтэй холбогдож, бодит төсөл эхлүүлсэн.&quot;</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=O&background=random" className="testimonial-avatar" alt="Отгонтуяа" />
                    <div>
                      <div className="testimonial-name">Б. Отгонтуяа</div>
                      <div className="testimonial-role">Маркетинг менежер, EcoPack LLC</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i> 4.8
                  </div>
                  <div className="testimonial-text">&quot;Үйлдвэрийн айлчлал маш сонирхолтой, үр өгөөжтэй байлаа.&quot;</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="testimonial-card">
                  <div className="testimonial-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://ui-avatars.com/api/?name=M&background=random" className="testimonial-avatar" alt="Мөнх-Эрдэнэ" />
                    <div>
                      <div className="testimonial-name">Ц. Мөнх-Эрдэнэ</div>
                      <div className="testimonial-role">Үйлдвэр эрхлэгч, MonBuild XXK</div>
                    </div>
                  </div>
                  <div className="testimonial-stars">
                    <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i> 4.9
                  </div>
                  <div className="testimonial-text">&quot;Гадаад дэвшилтэт технологитой танилцаж, олон санаа авсан.&quot;</div>
                </div>
              </div>
            </div>
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
              <i className="fa-solid fa-phone" style={{ color: "var(--brand-primary)", width: 20 }}></i> 7700-0900
            </div>
            <div className="help-contact">
              <i className="fa-regular fa-envelope" style={{ color: "var(--brand-primary)", width: 20 }}></i> travel@busy.mn
            </div>
            <div className="help-contact mb-3">
              <i className="fa-regular fa-clock" style={{ color: "var(--brand-primary)", width: 20 }}></i> Ажиллах цаг: 09:00 - 18:00
            </div>
            <button className="btn-brand-outline w-100">Холбогдох</button>
          </div>
          
          <div className="faq-section mt-4">
            <h3 className="widget-title">Түгээмэл асуултууд</h3>
            <div className="faq-item">
              <div className="faq-question">Аяллын үнэ юунд багтсан бэ? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Виз мэдүүлэхэд туслах уу? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Аяллын цуцлалт, буцаалтын нөхцөл? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
            <div className="faq-item">
              <div className="faq-question">Бүртгүүлэх хугацаа хэзээ дуусах вэ? <i className="fa-solid fa-chevron-down"></i></div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
