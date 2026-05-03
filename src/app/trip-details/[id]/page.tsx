import { notFound } from "next/navigation";
import Link from "next/link";
import TripDetailsEffects from "@/components/trip-details/TripDetailsEffects";
import { TripItineraryAccordion } from "@/components/trip-details/TripItineraryAccordion";
import { TripDetailsBookSidebarClient } from "@/components/trip-details/TripDetailsBookSidebarClient";
import { dbBusinessTrip } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";
import { readExtras } from "@/components/platform/trips/trip-editor-helpers";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function parseSeatCapacity(label: string | null | undefined): number {
  if (!label?.trim()) return 30;
  const compact = label.replace(/\s/g, "");
  const m = compact.match(/(\d+)/);
  if (!m) return 30;
  return Math.min(500, Math.max(1, parseInt(m[1], 10)));
}

export default async function TripDetailsPage({ params }: Props) {
  const { id } = await params;
  const tripId = parseInt(id, 10);
  if (isNaN(tripId)) {
    notFound();
  }

  const trip = await dbBusinessTrip().findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return (
      <div className="container py-5 text-center">
        <h3>Аялал олдсонгүй</h3>
        <Link href="/" className="btn btn-primary">Нүүр хуудас руу буцах</Link>
      </div>
    );
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  // Calculate days difference
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const nDays = Math.max(1, Math.min(14, diffDays));

  const dest = trip.destination?.trim() || "";
  const scheduleDays = [];

  for (let i = 1; i <= nDays; i++) {
    const dDt = new Date(startDate);
    dDt.setDate(dDt.getDate() + (i - 1));
    
    scheduleDays.push({
      id: `trd-plh-${i}`,
      label: `Өдөр ${i}`,
      date: dDt.toISOString().split("T")[0],
      /** Preformatted on server — avoids Node vs browser `toLocaleDateString` hydration mismatch in accordion. */
      dateDisplay: formatMnDate(dDt).replace(/-/g, "."),
      heading: i === 1 ? "Хөтөлбөр" : "",
      banner_image: '',
      items: [
        {
          time: '',
          end_time: '',
          title: i === 1 ? 'Хөтөлбөрийн дэлгэрэнгүй удахгүй шинэчлэгдэнэ.' : '—',
          description: (dest ? `${dest} · ` : '') + formatMnDate(dDt),
          highlight: '',
        }
      ]
    });
  }

  let tripCover = mediaUrl(trip.coverImageUrl || "");
  if (!tripCover) {
    tripCover = 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1600&q=80';
  }

  const extras = readExtras(trip.extrasJson);
  const tripDetailHeroUrl = mediaUrl(extras.trip_details_hero_url);
  const tripHeroBg = tripDetailHeroUrl || tripCover;

  const payTripUrl = `/pay-advance?type=trip&id=${tripId}`;
  const tripRegisterLoginUrl = `/auth/login?next=${encodeURIComponent(payTripUrl)}`;
  const qpayLogoUrl = '/assets/img/qpay-logo.png';

  const isLoggedIn = false; // Replace with NextAuth or session logic

  const mapQueryPlain = dest ? `${dest}, South Korea` : 'Busan Seoul South Korea';
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQueryPlain)}`;

  const tripAbout = trip.description?.replace(/<[^>]*>?/gm, '').trim() || 'BNI KOREA National Conference 2026-д оролцох энэхүү аялал нь бизнесийн харилцаагаа тэлэх, олон улсын туршлага судлах, тэргүүлэгч үйлдвэрүүдтэй танилцахаар төлөвлөгдсөн. Бид таны цаг хугацааг үнэ цэнтэй болгож, бизнесийн үр дүн төдийгүй, дээд зэрэглэлийн туршлагыг хүргэх болно.';

  const basePriceMnt = trip.priceMnt ? Math.round(Number(trip.priceMnt)) : 4_590_000;
  const seatCapacity = parseSeatCapacity(trip.seatsLabel);
  const bookingDepartureIso = formatLocalYmd(startDate);
  const spotsHint = Math.min(20, seatCapacity);
  let bookingPanelTiers = extras.booking_tiers
    .filter((t) => t.label.trim() && Number.isFinite(t.price_mnt))
    .map((t) => ({
      id: t.id,
      label: t.label.trim(),
      subtitle: t.subtitle.trim(),
      priceMnt: Math.max(0, Math.round(t.price_mnt)),
    }));
  if (bookingPanelTiers.length === 0) {
    bookingPanelTiers = [{ id: "standard", label: "1 хүн", subtitle: "", priceMnt: basePriceMnt }];
  }
  const bookingCapacityNote =
    extras.booking_status_note.trim() || `${spotsHint} суудал үлдсэн`;
  
  const formattedStartYear = startDate.getFullYear();
  const formattedEndYear = endDate.getFullYear();
  const formattedStartStr = formatMnDate(startDate).replace(/-/g, '.');
  const formattedEndStr = formattedStartYear === formattedEndYear ? formatMnDate(endDate).slice(5).replace(/-/g, '.') : formatMnDate(endDate).replace(/-/g, '.');
  const tripDateRange = `${formattedStartStr} – ${formattedEndStr}`;

  return (
    <div className="trd-body">
      <TripDetailsEffects />
      {/* Hero Section */}
      <div className="trd-hero">
        <div className="trd-hero-img" style={{ backgroundImage: `url('${tripHeroBg}')` }}></div>
        <div className="trd-hero-overlay"></div>
        <div className="container trd-hero-content">
          <div className="row">
            <div className="col-lg-8">
              <div className="trd-status-badge"><i className="fa-solid fa-circle-check"></i> Бүртгэл нээлттэй</div>
              <h1 className="trd-hero-title">{trip.destination}</h1>
              {extras.short_description.trim() ? (
                <p className="lead mb-4 opacity-75">{extras.short_description.trim()}</p>
              ) : null}
              {isLoggedIn ? (
                <Link href={payTripUrl} className="btn btn-warning btn-lg rounded-pill fw-bold px-5 mb-4 shadow">
                  Төлбөр төлөх
                </Link>
              ) : (
                <Link href={tripRegisterLoginUrl} className="btn btn-warning btn-lg rounded-pill fw-bold px-5 mb-4 shadow">
                  Бүртгүүлэх
                </Link>
              )}
              <div className="trd-hero-meta">
                <div className="trd-hero-meta-item">
                  <i className="fa-regular fa-calendar-days"></i>
                  <div>
                    <div className="opacity-50 small">Аяллын хугацаа</div>
                    <div>{formattedStartStr} — {formattedEndStr}</div>
                  </div>
                </div>
                <div className="trd-hero-meta-item">
                  <i className="fa-solid fa-location-dot"></i>
                  <div>
                    <div className="opacity-50 small">Чиглэл</div>
                    <div>БНСУ – Бусан, Сеүл</div>
                  </div>
                </div>
                <div className="trd-hero-meta-item">
                  <i className="fa-solid fa-user-group"></i>
                  <div>
                    <div className="opacity-50 small">Боломжит суудал</div>
                    <div>{trip.seatsLabel || '30 суудал'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container trd-main-shell position-relative">
        <div className="row g-4 g-lg-5 align-items-lg-start">
          {/* Left Column */}
          <div className="col-lg-8 order-2 order-lg-1">
            
            {/* Feature Grid */}
            <div id="trd-section-brief" className="trd-grid-features mt-5 trd-scroll-anchor">
              <div className="trd-feature-card">
                <div className="trd-feature-icon"><i className="fa-solid fa-users"></i></div>
                <div className="trd-feature-title">BNI networking</div>
                <div className="trd-feature-desc">Дэлхийн бизнесийн хамгийн том сүлжээний арга хэмжээ.</div>
              </div>
              <div className="trd-feature-card">
                <div className="trd-feature-icon"><i className="fa-solid fa-industry"></i></div>
                <div className="trd-feature-title">Үйлдвэртэй танилцах</div>
                <div className="trd-feature-desc">Тэргүүлэх үйлдвэрүүд, технологийн шийдэлтэй танилцана.</div>
              </div>
              <div className="trd-feature-card">
                <div className="trd-feature-icon"><i className="fa-solid fa-handshake"></i></div>
                <div className="trd-feature-title">B2B уулзалт</div>
                <div className="trd-feature-desc">Үр дүнтэй уулзалтууд, хамтын ажиллагаа.</div>
              </div>
              <div className="trd-feature-card">
                <div className="trd-feature-icon"><i className="fa-solid fa-landmark"></i></div>
                <div className="trd-feature-title">Соёл, аялал</div>
                <div className="trd-feature-desc">Түүхэн дурсгалт газрууд болон орчин үеийн соёл.</div>
              </div>
            </div>

            {/* Tabs (scroll to sections) */}
            <div className="trd-tabs" role="tablist">
              <a href="#trd-section-brief" className="trd-tab active">Товч мэдээлэл</a>
              <a href="#trd-section-itinerary" className="trd-tab">Хөтөлбөр</a>
              <a href="#trd-section-included" className="trd-tab">Юу багтсан</a>
              <a href="#trd-section-faq" className="trd-tab">Асуулт хариулт</a>
              <a href="#trd-section-location" className="trd-tab">Байршил</a>
            </div>

            {/* Itinerary — vertical accordion */}
            <div id="trd-section-itinerary" className="mb-5 trd-scroll-anchor">
              <TripItineraryAccordion days={scheduleDays} fallbackCover={tripCover} />
            </div>

            {/* About Section — admin text only (no placeholder image; avoids cramped two-column layout). */}
            <div id="trd-section-about" className="mb-5 trd-scroll-anchor" style={{ maxWidth: 720 }}>
              <h2 className="fw-bold mb-4">Аяллын тухай</h2>
              <div
                className="text-muted lead text-break"
                style={{ lineHeight: 1.65 }}
                dangerouslySetInnerHTML={{ __html: tripAbout.replace(/\n/g, "<br/>") }}
              />
            </div>

            {/* Comparison */}
            <div id="trd-section-included" className="trd-comp-grid trd-scroll-anchor">
              <div className="trd-comp-box">
                <h3 className="trd-comp-title">Юу багтсан</h3>
                <ul className="trd-comp-list">
                  <li className="trd-comp-item included"><i className="fa-solid fa-circle-check"></i> <div>4-5 одтой зочид буудлын байр</div></li>
                  <li className="trd-comp-item included"><i className="fa-solid fa-circle-check"></i> <div>Өглөө, оройн зоог</div></li>
                  <li className="trd-comp-item included"><i className="fa-solid fa-circle-check"></i> <div>Бүх хотын тээвэр, даатгал</div></li>
                  <li className="trd-comp-item included"><i className="fa-solid fa-circle-check"></i> <div>Үйлдвэр, компанийн зочлох үйлчилгээ</div></li>
                  <li className="trd-comp-item included"><i className="fa-solid fa-circle-check"></i> <div>Орчуулга, бизнес зөвлөх үйлчилгээ</div></li>
                </ul>
              </div>
              <div className="trd-comp-box">
                <h3 className="trd-comp-title">Багтаагүй</h3>
                <ul className="trd-comp-list">
                  <li className="trd-comp-item excluded"><i className="fa-solid fa-circle-xmark"></i> <div>Олон улсын нислэгийн тийз</div></li>
                  <li className="trd-comp-item excluded"><i className="fa-solid fa-circle-xmark"></i> <div>Хувийн хэрэгцээ, дэлгүүр хэсэх</div></li>
                  <li className="trd-comp-item excluded"><i className="fa-solid fa-circle-xmark"></i> <div>Визийн хураамж</div></li>
                  <li className="trd-comp-item excluded"><i className="fa-solid fa-circle-xmark"></i> <div>Аяллын даатгал (заавал биш)</div></li>
                </ul>
              </div>
            </div>

          </div>

          {/* Right Column: sticky viewport stack */}
          <div className="col-lg-4 order-1 order-lg-2 mb-4 mb-lg-0 trd-aside-col">
            <div className="trd-aside-inner">
              <TripDetailsBookSidebarClient
                key={tripId}
                defaultDepartureIso={bookingDepartureIso}
                tiers={bookingPanelTiers}
                maxPassengers={seatCapacity}
                capacityNote={bookingCapacityNote}
              >
                <div className="trd-summary-grid" role="list">
                  <div className="trd-summary-cell" role="listitem">
                    <span className="trd-summary-cell__icon" aria-hidden="true"><i className="fa-regular fa-calendar-check"></i></span>
                    <span className="trd-summary-label">Хугацаа</span>
                    <span className="trd-summary-val">{tripDateRange}</span>
                  </div>
                  <div className="trd-summary-cell" role="listitem">
                    <span className="trd-summary-cell__icon" aria-hidden="true"><i className="fa-solid fa-couch"></i></span>
                    <span className="trd-summary-label">Суудал</span>
                    <span className="trd-summary-val">{trip.seatsLabel || '30 суудал'}</span>
                  </div>
                  <div className="trd-summary-cell trd-summary-cell--full" role="listitem">
                    <span className="trd-summary-cell__icon" aria-hidden="true"><i className="fa-solid fa-earth-asia"></i></span>
                    <span className="trd-summary-label">Чиглэл</span>
                    <span className="trd-summary-val">БНСУ – Бусан, Сеүл</span>
                  </div>
                </div>

                <div className="trd-cta-grid trd-cta-grid--stacked">
                  {isLoggedIn ? (
                    <Link className="trd-btn-qpay" href={payTripUrl}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qpayLogoUrl} alt="QPay" width="72" height="20" loading="lazy" decoding="async" />
                      <span>Төлбөр төлөх</span>
                    </Link>
                  ) : (
                    <Link className="trd-btn-trip-register" href={tripRegisterLoginUrl}>
                      <i className="fa-solid fa-user-check" aria-hidden="true"></i>
                      <span>Бүртгүүлэх</span>
                    </Link>
                  )}
                  <button className="trd-btn-contact" type="button">
                    <i className="fa-solid fa-headset"></i>
                    <span>Зөвлөх</span>
                  </button>
                </div>

                <div className="trd-trust-grid" aria-label="Давуу тал">
                  <div className="trd-trust-chip"><i className="fa-solid fa-shield-halved"></i><span>Төлбөр</span></div>
                  <div className="trd-trust-chip"><i className="fa-solid fa-file-signature"></i><span>Баталгаа</span></div>
                  <div className="trd-trust-chip"><i className="fa-solid fa-clock"></i><span>24/7</span></div>
                  <div className="trd-trust-chip"><i className="fa-solid fa-star"></i><span>Зэрэглэл</span></div>
                </div>
              </TripDetailsBookSidebarClient>

              <div id="trd-section-location" className="trd-map-card trd-aside-card trd-scroll-anchor">
                <div className="trd-aside-card__title">Маршрут</div>
                <Link href={mapHref} className="trd-map-static" target="_blank" rel="noopener noreferrer">
                  <span className="trd-map-static__icon" aria-hidden="true"><i className="fa-solid fa-map-location-dot"></i></span>
                  <span className="trd-map-static__text">
                    <span className="trd-map-static__title">Газрын зураг нээх</span>
                    <span className="trd-map-static__sub">Google Maps — чиглэл, замыг шууд харах</span>
                  </span>
                  <span className="trd-map-static__go" aria-hidden="true"><i className="fa-solid fa-arrow-up-right-from-square"></i></span>
                </Link>
                <p className="trd-map-note"><i className="fa-solid fa-train text-primary me-1"></i>KTX: Бусан — Сеүл</p>
              </div>

              <div id="trd-section-help" className="trd-help-card trd-aside-card trd-scroll-anchor">
                <div className="trd-aside-card__title">Тусламж</div>
                <p className="trd-help-lead">Зөвлөхүүд асуултад хариулна.</p>
                <div className="trd-help-grid">
                  <Link href="tel:+97677772828" className="trd-help-tile"><i className="fa-solid fa-phone"></i><span>+976 7777 2828</span></Link>
                  <Link href="mailto:travel@busy.mn" className="trd-help-tile"><i className="fa-solid fa-envelope"></i><span>travel@busy.mn</span></Link>
                  <Link href="#trd-section-help" className="trd-help-tile trd-help-tile--wide"><i className="fa-solid fa-comments"></i><span>Онлайн чат</span></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="trd-section-faq" className="container mt-5 pt-5 pb-5 trd-scroll-anchor">
        <h2 className="fw-bold mb-4">Түгээмэл асуултууд</h2>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="trd-faq-item">
              <button className="trd-faq-trigger">Аяллын үнэ юунд багтсан бэ? <i className="fa-solid fa-chevron-down"></i></button>
              <div className="trd-faq-content">Аяллын үнэнд олон улсын нислэгийн тийзнээс бусад бүх зардал багтсан болно. Үүнд зочид буудал, хоол, тээвэр, зөвлөх үйлчилгээ багтсан.</div>
            </div>
            <div className="trd-faq-item">
              <button className="trd-faq-trigger">Виз мэдүүлэхэд туслах уу? <i className="fa-solid fa-chevron-down"></i></button>
              <div className="trd-faq-content">Тийм ээ, манай баг таныг визний материал бүрдүүлэхэд зааварчилгаа өгч, туслах болно.</div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="trd-faq-item">
              <button className="trd-faq-trigger">Цуцлалтын нөхцөл ямар вэ? <i className="fa-solid fa-chevron-down"></i></button>
              <div className="trd-faq-content">Аялал эхлэхээс 30 хоногийн өмнө цуцалбал 100% буцаан олголттой.</div>
            </div>
            <div className="trd-faq-item">
              <button className="trd-faq-trigger">QPay-ээр хэрхэн төлөх вэ? <i className="fa-solid fa-chevron-down"></i></button>
              <div className="trd-faq-content">«Баталгаажуулах» дээр дарсны дараа бүтэн төлбөр эсвэл урьдчилгаагаа сонгоно. Дараа нь QPay-ийн QR код гарч, апп эсвэл вэбээр төлнө. Төлбөр орсны дараа баталгаажуулах имэйл илгээгдэнэ.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="trd-footer-stats">
        <div className="container">
          <div className="row">
            <div className="col-md-3 trd-stat-item">
              <div className="trd-stat-val">12,500+</div>
              <div className="trd-stat-lbl">Аяллын бизнес эрхлэгч</div>
            </div>
            <div className="col-md-3 trd-stat-item">
              <div className="trd-stat-val">3,200+</div>
              <div className="trd-stat-lbl">Итгэлтэй гишүүд</div>
            </div>
            <div className="col-md-2 trd-stat-item">
              <div className="trd-stat-val">180+</div>
              <div className="trd-stat-lbl">Бизнес уулзалт</div>
            </div>
            <div className="col-md-2 trd-stat-item">
              <div className="trd-stat-val">98%</div>
              <div className="trd-stat-lbl">Сэтгэл ханамж</div>
            </div>
            <div className="col-md-2 trd-stat-item">
              <div className="trd-stat-val">24ц</div>
              <div className="trd-stat-lbl">Түргэн дэмжлэг</div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
