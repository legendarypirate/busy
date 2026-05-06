import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import TripDetailsEffects from "@/components/trip-details/TripDetailsEffects";
import { TripItineraryAccordion } from "@/components/trip-details/TripItineraryAccordion";
import {
  TripDetailsBookingRegisterProvider,
  TripDetailsHeroCtas,
  TripDetailsSidebarRegisterCtas,
} from "@/components/trip-details/trip-details-booking-context";
import { TripDetailsBookSidebarClient } from "@/components/trip-details/TripDetailsBookSidebarClient";
import { TripDetailsSocialShare } from "@/components/trip-details/TripDetailsSocialShare";
import { dbBusinessTrip, prisma } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";
import { buildTripItineraryAccordionDays } from "@/lib/trip-itinerary-for-trip-details";
import { mediaUrl } from "@/lib/media-url";
import { marketingSiteOrigin } from "@/lib/marketing-site-origin";
import { readExtras } from "@/components/platform/trips/trip-editor-helpers";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tripId = parseInt(id, 10);
  const fallback: Metadata = { title: "Аялал | BUSY.mn" };
  if (isNaN(tripId)) return fallback;

  const trip = await dbBusinessTrip().findUnique({
    where: { id: tripId },
    select: {
      destination: true,
      description: true,
      coverImageUrl: true,
      startDate: true,
      endDate: true,
      extrasJson: true,
    },
  });
  if (!trip) return fallback;

  const extras = readExtras(trip.extrasJson);
  const dest = trip.destination?.trim() || "Бизнес аялал";
  const plainDesc = (trip.description?.replace(/<[^>]*>?/gm, "") ?? "").trim().slice(0, 280);
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const dateStr = `${formatMnDate(startDate).replace(/-/g, ".")} — ${formatMnDate(endDate).replace(/-/g, ".")}`;
  const bits = [dateStr];
  if (extras.location.trim()) bits.push(extras.location.trim());
  if (extras.short_description.trim()) bits.push(extras.short_description.trim());
  const ogDescription =
    bits.join(" · ") || plainDesc || `${dest} — BUSY.mn олон улсын бизнес аялал.`;

  const base = marketingSiteOrigin();
  const ogImage = `${base}/trip-details/${tripId}/opengraph-image`;
  const canonical = `${base}/trip-details/${tripId}`;
  const title = `${dest} | BUSY.mn`;
  const descShort = ogDescription.length > 300 ? `${ogDescription.slice(0, 297)}…` : ogDescription;

  return {
    title,
    description: descShort,
    openGraph: {
      title: dest,
      description: descShort,
      url: canonical,
      siteName: "BUSY.mn",
      locale: "mn_MN",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: dest }],
    },
    twitter: {
      card: "summary_large_image",
      title: dest,
      description: descShort.length > 200 ? `${descShort.slice(0, 197)}…` : descShort,
      images: [ogImage],
    },
    alternates: { canonical },
  };
}

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

/** `tel:` href + display label from admin-entered phone (MN-friendly). */
function tripManagerTelParts(raw: string): { href: string; label: string } | null {
  const label = raw.trim();
  if (!label) return null;
  const compact = label.replace(/[\s-]/g, "");
  let href: string;
  if (compact.startsWith("+")) {
    href = `tel:${compact}`;
  } else if (compact.startsWith("00")) {
    href = `tel:+${compact.slice(2)}`;
  } else if (/^976\d{8}$/.test(compact)) {
    href = `tel:+${compact}`;
  } else if (/^0\d{8}$/.test(compact)) {
    href = `tel:+976${compact.slice(1)}`;
  } else {
    href = `tel:${compact}`;
  }
  return { href, label };
}

const TRIP_HELP_EMAIL_DEFAULT = "travel@busy.mn";

/** Display + mailto from admin email; empty uses site default. */
function tripHelpEmailParts(raw: string): { label: string; href: string } {
  let a = raw.trim();
  if (a.toLowerCase().startsWith("mailto:")) {
    a = a.slice("mailto:".length).split("?")[0].trim();
  }
  if (!a) a = TRIP_HELP_EMAIL_DEFAULT;
  return { label: a, href: `mailto:${a}` };
}

/** Chat / messenger link for help tile; empty → no link. */
function normalizeTripHelpChatHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("#")) return t;
  if (t.startsWith("/")) return t;
  const lower = t.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

function stripLegacyTripStaticHighlights(html: string): string {
  const banned = [
    "BNI networking",
    "Дэлхийн бизнесийн хамгийн том сүлжээний арга хэмжээ.",
    "Үйлдвэртэй танилцах",
    "Тэргүүлэх үйлдвэрүүд, технологийн шийдэлтэй танилцана.",
    "B2B уулзалт",
    "Үр дүнтэй уулзалтууд, хамтын ажиллагаа.",
    "Соёл, аялал",
    "Түүхэн дурсгалт газрууд болон орчин үеийн соёл.",
  ];

  let out = html;
  for (const phrase of banned) {
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Remove list-item rows containing the static phrase.
    out = out.replace(new RegExp(`<li[^>]*>[\\s\\S]*?${esc}[\\s\\S]*?<\\/li>`, "gi"), "");
    // Remove standalone blocks containing the static phrase.
    out = out.replace(new RegExp(`<p[^>]*>[\\s\\S]*?${esc}[\\s\\S]*?<\\/p>`, "gi"), "");
    // Remove plain text fallthrough.
    out = out.replace(new RegExp(esc, "gi"), "");
  }
  return out;
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

  const dest = trip.destination?.trim() || "";

  const scheduleDaysFromItinerary = buildTripItineraryAccordionDays(trip.itineraryJson, startDate, dest);

  const scheduleDays =
    scheduleDaysFromItinerary && scheduleDaysFromItinerary.length > 0
      ? scheduleDaysFromItinerary
      : (() => {
          const out: {
            id: string;
            label: string;
            date: string;
            dateDisplay: string;
            heading: string;
            banner_image: string;
            items: { time: string; end_time: string; title: string; description: string; highlight: string }[];
          }[] = [];
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const nDays = Math.max(1, Math.min(14, diffDays));
          for (let i = 1; i <= nDays; i++) {
            const dDt = new Date(startDate);
            dDt.setDate(dDt.getDate() + (i - 1));
            out.push({
              id: `trd-plh-${i}`,
              label: `Өдөр ${i}`,
              date: dDt.toISOString().split("T")[0],
              dateDisplay: formatMnDate(dDt).replace(/-/g, "."),
              heading: i === 1 ? "Хөтөлбөр" : "",
              banner_image: "",
              items: [
                {
                  time: "",
                  end_time: "",
                  title: i === 1 ? "Хөтөлбөрийн дэлгэрэнгүй удахгүй шинэчлэгдэнэ." : "—",
                  description: (dest ? `${dest} · ` : "") + formatMnDate(dDt),
                  highlight: "",
                },
              ],
            });
          }
          return out;
        })();

  let tripCover = mediaUrl(trip.coverImageUrl || "");
  if (!tripCover) {
    tripCover = 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=1600&q=80';
  }

  const extras = readExtras(trip.extrasJson);
  const tripDetailHeroUrl = mediaUrl(extras.trip_details_hero_url);
  const tripHeroBg = tripDetailHeroUrl || tripCover;

  const payTripUrl = `/pay-advance?type=trip&id=${tripId}`;
  const qpayLogoUrl = '/assets/img/qpay-logo.png';

  const isLoggedIn = false; // Replace with NextAuth or session logic

  const tripLocationDisplay = extras.location.trim() || dest || "—";
  const tripManagerCall = tripManagerTelParts(extras.trip_manager_phone);
  const tripHelpEmail = tripHelpEmailParts(extras.trip_help_email);
  const tripHelpChatHref = normalizeTripHelpChatHref(extras.trip_help_chat_url);
  const tripHelpChatExternal = tripHelpChatHref != null && /^https?:\/\//i.test(tripHelpChatHref);

  const regCloseIso = extras.trip_registration_close_date.trim();
  let registrationCloseDisplay: string | null = null;
  if (regCloseIso && /^\d{4}-\d{2}-\d{2}$/.test(regCloseIso)) {
    const cd = new Date(`${regCloseIso}T12:00:00`);
    if (!Number.isNaN(cd.getTime())) {
      registrationCloseDisplay = formatMnDate(cd).replace(/-/g, ".");
    }
  }

  const tripAboutRaw =
    trip.description?.replace(/<[^>]*>?/gm, "").trim() ||
    "BNI KOREA National Conference 2026-д оролцох энэхүү аялал нь бизнесийн харилцаагаа тэлэх, олон улсын туршлага судлах, тэргүүлэгч үйлдвэрүүдтэй танилцахаар төлөвлөгдсөн. Бид таны цаг хугацааг үнэ цэнтэй болгож, бизнесийн үр дүн төдийгүй, дээд зэрэглэлийн туршлагыг хүргэх болно.";
  const tripAbout = stripLegacyTripStaticHighlights(tripAboutRaw);
  const includedItems = extras.trip_included_items;
  const excludedItems = extras.trip_excluded_items;
  const tripNotes = extras.trip_notes;
  const faqs = extras.trip_faqs;
  const hasComparison = includedItems.length > 0 || excludedItems.length > 0;

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

  const origin = marketingSiteOrigin();
  const sharePath = `/trip-details/${tripId}`;
  const canonicalShareUrl = `${origin}${sharePath}`;
  const shareTitle = dest || trip.destination?.trim() || "BUSY.mn — бизнес аялал";

  const publishedForm = await prisma.tripRegistrationForm.findFirst({
    where: { tripId, isPublished: true },
    select: { publicSlug: true },
  });
  const registerTargetPath = publishedForm?.publicSlug
    ? `/register/${encodeURIComponent(publishedForm.publicSlug)}`
    : sharePath;
  const registerAbsUrl = `${origin}${registerTargetPath}`;
  let registrationQrDataUrl: string | null = null;
  let registrationQrCaption: string | null = null;
  if (registerAbsUrl) {
    try {
      registrationQrDataUrl = await QRCode.toDataURL(registerAbsUrl, {
        margin: 2,
        width: 220,
        color: { dark: "#0b2149", light: "#ffffff" },
      });
      registrationQrCaption = publishedForm?.publicSlug
        ? "Утасны камераар уншуулбал нийтийн бүртгэлийн хуудас нээгдэнэ."
        : "Утасны камераар уншуулбал энэ аяллын хуудас нээгдэнэ (бүртгэлийг баруун талын товчоор).";
    } catch {
      registrationQrDataUrl = null;
      registrationQrCaption = null;
    }
  }

  return (
    <TripDetailsBookingRegisterProvider
      tripId={tripId}
      tripTitle={dest || trip.destination || "Бизнес аялал"}
      defaultDepartureIso={bookingDepartureIso}
      tiers={bookingPanelTiers}
      maxPassengers={seatCapacity}
      capacityNote={bookingCapacityNote}
      registrationQrDataUrl={registrationQrDataUrl}
      registrationQrCaption={registrationQrCaption}
      registrationFormUrl={registerAbsUrl}
    >
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
              {registrationCloseDisplay ? (
                <div className="small text-dark mt-2 mb-1 d-flex align-items-center gap-2 flex-wrap">
                  <span className="rounded-pill bg-white px-3 py-1 shadow-sm">
                    <i className="fa-regular fa-calendar-xmark me-2" aria-hidden="true" />
                    Бүртгэл хаагдах: <strong className="ms-1">{registrationCloseDisplay}</strong>
                  </span>
                </div>
              ) : null}
              <h1 className="trd-hero-title">{trip.destination}</h1>
              {extras.short_description.trim() ? (
                <p className="lead mb-4 opacity-75">{extras.short_description.trim()}</p>
              ) : null}
              <TripDetailsHeroCtas isLoggedIn={isLoggedIn} payTripUrl={payTripUrl} />
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
                    <div>{tripLocationDisplay}</div>
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
              <TripDetailsSocialShare sharePageUrl={canonicalShareUrl} shareTitle={shareTitle} />
            </div>
          </div>
        </div>
      </div>

      <div className="container trd-main-shell position-relative">
        <div className="row g-4 g-lg-5 align-items-lg-start">
          {/* Left Column */}
          <div className="col-lg-8 order-2 order-lg-1">
            
            {/* Tabs (scroll to sections) */}
            <div className="trd-tabs mt-3 mt-lg-4" role="tablist">
              <a href="#trd-section-itinerary" className="trd-tab active">Өдрийн хөтөлбөр</a>
              <a href="#trd-section-about" className="trd-tab">Аяллын тухай</a>
              {hasComparison ? <a href="#trd-section-included" className="trd-tab">Юу багтсан</a> : null}
              {tripNotes.length > 0 ? <a href="#trd-section-notes" className="trd-tab">Санамж</a> : null}
              {faqs.length > 0 ? <a href="#trd-section-faq" className="trd-tab">Асуулт хариулт</a> : null}
            </div>

            {/* About Section — admin text only (no placeholder image; avoids cramped two-column layout). */}
            <div id="trd-section-about" className="mb-5 trd-scroll-anchor trd-about-box">
              <h2 className="fw-bold mb-4">Аяллын тухай</h2>
              <div
                className="trd-about-content text-break"
                dangerouslySetInnerHTML={{ __html: tripAbout.replace(/\n/g, "<br/>") }}
              />
            </div>

            {/* Itinerary — vertical accordion */}
            <div id="trd-section-itinerary" className="mb-5 trd-scroll-anchor">
              <TripItineraryAccordion days={scheduleDays} fallbackCover={tripCover} />
            </div>

            {/* Comparison */}
            {hasComparison ? (
              <div id="trd-section-included" className="trd-comp-grid trd-scroll-anchor">
                {includedItems.length > 0 ? (
                  <div className="trd-comp-box">
                    <h3 className="trd-comp-title">Юу багтсан</h3>
                    <ul className="trd-comp-list">
                      {includedItems.map((item, idx) => (
                        <li key={`inc-${idx}-${item}`} className="trd-comp-item included">
                          <i className="fa-solid fa-circle-check"></i> <div>{item}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {excludedItems.length > 0 ? (
                  <div className="trd-comp-box">
                    <h3 className="trd-comp-title">Багтаагүй</h3>
                    <ul className="trd-comp-list">
                      {excludedItems.map((item, idx) => (
                        <li key={`exc-${idx}-${item}`} className="trd-comp-item excluded">
                          <i className="fa-solid fa-circle-xmark"></i> <div>{item}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tripNotes.length > 0 ? (
              <div id="trd-section-notes" className="mb-5 trd-scroll-anchor trd-notes-box">
                <h2 className="fw-bold mb-3">Санамж</h2>
                <ul className="trd-comp-list">
                  {tripNotes.map((item, idx) => (
                    <li key={`note-${idx}-${item}`} className="trd-comp-item trd-comp-item--warning">
                      <i className="fa-solid fa-circle-info"></i> <div>{item}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

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
                    <span className="trd-summary-val">{tripLocationDisplay}</span>
                  </div>
                </div>

                <TripDetailsSidebarRegisterCtas
                  isLoggedIn={isLoggedIn}
                  payTripUrl={payTripUrl}
                  qpayLogoUrl={qpayLogoUrl}
                />

                <div className="trd-trust-grid" aria-label="Давуу тал">
                  <div className="trd-trust-chip"><i className="fa-solid fa-shield-halved"></i><span>Төлбөр</span></div>
                  <div className="trd-trust-chip"><i className="fa-solid fa-file-signature"></i><span>Баталгаа</span></div>
                  <div className="trd-trust-chip"><i className="fa-solid fa-clock"></i><span>24/7</span></div>
                  <div className="trd-trust-chip"><i className="fa-solid fa-star"></i><span>Зэрэглэл</span></div>
                </div>
              </TripDetailsBookSidebarClient>

              <div id="trd-section-help" className="trd-help-card trd-aside-card trd-scroll-anchor">
                <div className="trd-aside-card__title">Тусламж</div>
                <p className="trd-help-lead">Зөвлөхүүд асуултад хариулна.</p>
                <div className="trd-help-grid">
                  {tripManagerCall ? (
                    <Link href={tripManagerCall.href} className="trd-help-tile">
                      <i className="fa-solid fa-phone"></i>
                      <span>{tripManagerCall.label}</span>
                    </Link>
                  ) : (
                    <div className="trd-help-tile opacity-50" role="status">
                      <i className="fa-solid fa-phone"></i>
                      <span>Аяллын удирдагчийн утас тохируулаагүй</span>
                    </div>
                  )}
                  <Link href={tripHelpEmail.href} className="trd-help-tile">
                    <i className="fa-solid fa-envelope"></i>
                    <span>{tripHelpEmail.label}</span>
                  </Link>
                  {tripHelpChatHref ? (
                    <Link
                      href={tripHelpChatHref}
                      className="trd-help-tile trd-help-tile--wide"
                      {...(tripHelpChatExternal
                        ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                        : {})}
                    >
                      <i className="fa-solid fa-comments"></i>
                      <span>Онлайн чат</span>
                    </Link>
                  ) : (
                    <div className="trd-help-tile trd-help-tile--wide opacity-50" role="status">
                      <i className="fa-solid fa-comments"></i>
                      <span>Онлайн чатын холбоос тохируулаагүй</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      {faqs.length > 0 ? (
        <div id="trd-section-faq" className="container mt-5 pt-5 pb-5 trd-scroll-anchor">
          <h2 className="fw-bold mb-4">Түгээмэл асуултууд</h2>
          <div className="row g-4">
            {faqs.map((faq, idx) => (
              <div key={`faq-${idx}`} className="col-md-6">
                <div className="trd-faq-item">
                  <button className="trd-faq-trigger">{faq.question} <i className="fa-solid fa-chevron-down"></i></button>
                  <div className="trd-faq-content">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

    </div>
    </TripDetailsBookingRegisterProvider>
  );
}
