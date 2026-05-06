import Link from "next/link";
import type { BusinessTrip } from "@prisma/client";
import { mediaUrl } from "@/lib/media-url";
import PlatformTripRegistrationJsonBuilder from "@/components/platform/forms/PlatformTripRegistrationJsonBuilder";
import TripFormUploadPendingOverlay from "@/components/platform/forms/TripFormUploadPendingOverlay";
import TripEditorRegistrationQrAside from "@/components/platform/trips/TripEditorRegistrationQrAside";
import TripCoverHero from "@/components/platform/forms/TripCoverHero";
import TripDescriptionEditor from "@/components/platform/forms/TripDescriptionEditor";
import TripSimpleListEditor from "@/components/platform/forms/TripSimpleListEditor";
import TripFaqEditor from "@/components/platform/forms/TripFaqEditor";
import TripPaymentStepsEditor from "@/components/platform/forms/TripPaymentStepsEditor";
import TripDateDuration from "@/components/platform/forms/TripDateDuration";
import TripItineraryBuilder from "@/components/platform/forms/TripItineraryBuilder";
import TripBookingTiersEditor from "@/components/platform/trips/TripBookingTiersEditor";
import {
  DEFAULT_TRIP_COVER,
  defaultEditorBookingTiers,
  extrasFromTrip,
  fmtMoney,
  toInputDate,
  tripDaySpan,
} from "@/components/platform/trips/trip-editor-helpers";

export type TripEditorFormProps = {
  greetingName: string;
  editTrip: BusinessTrip | null;
  /** Full form action URL, e.g. `/api/platform/trips/save` or `...?return=admin` */
  formAction: string;
  tripsIndexHref: string;
  tripsIndexLabel: string;
};

export default function TripEditorForm({
  greetingName,
  editTrip,
  formAction,
  tripsIndexHref,
  tripsIndexLabel,
}: TripEditorFormProps) {
  const extras = extrasFromTrip(editTrip);
  const coverPreview = editTrip?.coverImageUrl?.trim() || "";
  const daysLen = editTrip ? tripDaySpan(editTrip.startDate, editTrip.endDate) : 0;
  const durationLabel = daysLen > 0 ? `${daysLen} өдөр` : "—";
  const statusBadge = editTrip?.statusLabel?.trim() === "Нийтлэгдсэн" ? "Нийтлэгдсэн" : "Ноорог";

  return (
    <form id="tripMainForm" action={formAction} method="post" encType="multipart/form-data">
      <TripFormUploadPendingOverlay formId="tripMainForm" />
      <input type="hidden" name="trip_id" value={editTrip?.id ?? 0} />

      <div className="tps-header mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-2" style={{ fontSize: "0.7rem" }}>
            <li className="breadcrumb-item">
              <Link href={tripsIndexHref} className="text-decoration-none">
                {tripsIndexLabel}
              </Link>
            </li>
            <li className="breadcrumb-item active">{editTrip ? "Засах" : "Шинэ аялал үүсгэх"}</li>
          </ol>
        </nav>
        <h1 className="tps-greeting">Сайн байна уу, {greetingName}</h1>
        <p className="text-muted small mb-0">Бизнес аяллаа үүсгээд гишүүдтэйгээ хуваалцаарай</p>
      </div>

      <div className="tps-grid">
        <div className="tps-main">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="tps-form-section">
                <div className="tps-section-head">
                  <div className="tps-section-num">1</div>
                  <span className="tps-section-title">Аяллын үндсэн мэдээлэл</span>
                </div>
                <div className="mb-3">
                  <label className="pm-label">
                    Аяллын нэр <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="pm-input"
                    name="trip_destination"
                    required
                    placeholder="Жишээ: Сөүл хотын бизнес аялал 2025"
                    defaultValue={editTrip?.destination ?? ""}
                  />
                </div>
                <div className="mb-3">
                  <label className="pm-label">Аяллын статус</label>
                  <select className="pm-select" name="trip_status_label" defaultValue={editTrip?.statusLabel ?? "Ноорог"}>
                    <option value="Ноорог">Ноорог</option>
                    <option value="Нийтлэгдсэн">Нийтлэгдсэн</option>
                  </select>
                </div>
                <div>
                  <label className="pm-label">Товч тайлбар</label>
                  <textarea
                    className="pm-input"
                    name="trip_short_description"
                    rows={2}
                    placeholder="Аяллын товч танилцуулга..."
                    defaultValue={extras.short_description}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="tps-form-section">
                <div className="tps-section-head">
                  <div className="tps-section-num">2</div>
                  <span className="tps-section-title">Аяллын хугацаа</span>
                </div>
                <TripDateDuration
                  startDefault={editTrip ? toInputDate(editTrip.startDate) : ""}
                  endDefault={editTrip ? toInputDate(editTrip.endDate) : ""}
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="tps-form-section">
                <div className="tps-section-head">
                  <div className="tps-section-num">3</div>
                  <span className="tps-section-title">Очих газар</span>
                </div>
                <div className="mb-3">
                  <label className="pm-label">
                    Очих улс / Хот <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="pm-input"
                    name="trip_location"
                    placeholder="Жишээ: БНСУ, Сөүл"
                    defaultValue={extras.location}
                    required
                  />
                </div>
                <div>
                  <label className="pm-label">Чиглэл / Салбар</label>
                  <select className="pm-select" name="trip_focus" defaultValue={editTrip?.focus ?? ""}>
                    <option value="">Чиглэлийг сонгоно уу</option>
                    <option value="Технологи, Маркетинг">Технологи, Маркетинг</option>
                    <option value="Үйлдвэрлэл">Үйлдвэрлэл</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="tps-form-section mt-4">
            <div className="tps-section-head">
              <div className="tps-section-num">7</div>
              <span className="tps-section-title">Бүртгэлийн асуулгын форм</span>
            </div>
            <p className="small text-muted mb-3">
              Нийтийн бүртгэл нь тусад <strong>/register/…</strong> хуудас (QR-аар нээгдэнэ). Нүүрний drawer-ын бүртгэлээс
              тусдаа.
            </p>
            <div className="row g-3 align-items-start">
              <div className="col-lg-8">
                <PlatformTripRegistrationJsonBuilder
                  hiddenName="trip_registration_form_json"
                  initialJson={editTrip?.registrationFormJson ?? undefined}
                />
              </div>
              <div className="col-lg-4">
                <TripEditorRegistrationQrAside tripId={editTrip?.id ?? 0} />
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="tps-form-section">
                <div className="tps-section-head">
                  <div className="tps-section-num">4</div>
                  <span className="tps-section-title">Салбар ба зорилтот бүлэг</span>
                </div>
                <div className="mb-3">
                  <label className="pm-label">Салбар</label>
                  <select className="pm-select" name="trip_sector" disabled>
                    <option>Салбар сонгоно уу</option>
                  </select>
                </div>
                <div>
                  <label className="pm-label">Зорилтот бүлэг</label>
                  <select className="pm-select" name="trip_target_group" disabled>
                    <option>Зорилтот бүлэг сонгоно уу</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="tps-form-section">
                <div className="tps-section-head">
                  <div className="tps-section-num">5</div>
                  <span className="tps-section-title">Үнэ ба суудлын мэдээлэл</span>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="pm-label">
                      Аяллын үнэ (₮) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="pm-input"
                      name="trip_price_mnt"
                      defaultValue={editTrip?.priceMnt != null ? String(editTrip.priceMnt) : ""}
                    />
                  </div>
                  <div className="col-6">
                    <label className="pm-label">
                      Нийт суудал <span className="text-danger">*</span>
                    </label>
                    <input type="number" className="pm-input" name="trip_total_seats" defaultValue={extras.total_seats} />
                  </div>
                </div>
                <div>
                  <label className="pm-label">Үлдэгдэл суудал</label>
                  <input type="text" className="pm-input bg-light border-0" readOnly value={String(extras.total_seats)} />
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="tps-form-section">
                <div className="tps-section-head">
                  <div className="tps-section-num">6</div>
                  <span className="tps-section-title">Урьдчилгаа төлбөр</span>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="pm-label">Урьдчилгаа төлбөр (₮)</label>
                    <input
                      type="number"
                      className="pm-input"
                      name="trip_advance_order_mnt"
                      defaultValue={editTrip?.advanceOrderMnt != null ? String(editTrip.advanceOrderMnt) : ""}
                    />
                  </div>
                  <div className="col-6">
                    <label className="pm-label">Урьдчилгаа хувь (%)</label>
                    <input type="number" className="pm-input" name="trip_advance_percent" defaultValue={extras.advance_percent} />
                  </div>
                </div>
                <div className="mt-2 small text-muted">Хувь эсвэл дүнгээр тооцно.</div>
              </div>
            </div>
          </div>

          <div className="tps-form-section mt-4">
            <div className="tps-section-head">
              <div className="tps-section-num">5a</div>
              <span className="tps-section-title">Захиалгын tier (нийтийн trip-details)</span>
            </div>
            <div className="row g-3 align-items-start mb-3">
              <div className="col-12 col-md-6 col-xl-4">
                <label className="pm-label">Бүртгэл хаагдах огноо</label>
                <input
                  type="date"
                  className="pm-input"
                  name="trip_registration_close_date"
                  defaultValue={extras.trip_registration_close_date}
                />
                <p className="form-text small text-muted mb-0">
                  Нийтийн <code>/trip-details/:id</code> дээр харагдана. Хоосон бол мөр харуулахгүй.
                </p>
              </div>
            </div>
            <div className="row g-3 align-items-start">
              <div className="col-12 col-xl-8">
                <TripBookingTiersEditor
                  hiddenName="trip_booking_tiers_json"
                  initialTiers={
                    extras.booking_tiers.length > 0
                      ? extras.booking_tiers
                      : defaultEditorBookingTiers(
                          editTrip?.priceMnt != null ? Math.round(Number(editTrip.priceMnt)) : 4_590_000,
                        )
                  }
                />
              </div>
              <div className="col-12 col-xl-4">
                <label className="pm-label">Суудал / захиалгын төлөвийн текст</label>
                <textarea
                  className="pm-input"
                  name="trip_booking_status_note"
                  rows={4}
                  placeholder="Жишээ: 20 суудал үлдсэн"
                  defaultValue={extras.booking_status_note}
                />
                <div className="form-text small text-muted">
                  Хоосон бол автоматаар «суудал үлдсэн» мэдээлэл харагдана.
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <TripCoverHero coverPreviewUrl={coverPreview || null} />

            <div className="col-md-8">
              <div className="tps-form-section h-100">
                <div className="tps-section-head">
                  <div className="tps-section-num">9</div>
                  <span className="tps-section-title">Аяллын дэлгэрэнгүй тайлбар</span>
                </div>
                <TripDescriptionEditor
                  name="trip_description"
                  rows={10}
                  placeholder="Аяллын дэлгэрэнгүй мэдээллийг энд оруулна уу..."
                  defaultValue={editTrip?.description ?? ""}
                />
              </div>
            </div>
          </div>

          <div className="tps-form-section mt-3">
            <div className="tps-section-head">
              <div className="tps-section-num">8a</div>
              <span className="tps-section-title">Trip-details том hero (background)</span>
            </div>
            <p className="small text-muted mb-3">
              <code>/trip-details/:id</code> хуудсын дээд том зураг — ковероос тусдаа. «Хадгалах» дарвал Cloudinary руу
              байршина.
            </p>
            <div className="row g-3 align-items-start">
              <div className="col-md-6">
                <label className="pm-label mb-1">Зураг сонгох (JPG, PNG, WEBP · max 10MB)</label>
                <input type="file" name="trip_detail_hero_file" className="form-control" accept="image/*" />
                {extras.trip_details_hero_url ? (
                  <div className="form-check mt-3">
                    <input className="form-check-input" type="checkbox" name="trip_details_hero_clear" id="tripDetailsHeroClear" />
                    <label className="form-check-label small" htmlFor="tripDetailsHeroClear">
                      Одоогийн hero зургийг устгах (ковер руу буцна)
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="col-md-6">
                {extras.trip_details_hero_url ? (
                  <div>
                    <div className="pm-label small mb-1">Одоогийн hero</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(extras.trip_details_hero_url) || extras.trip_details_hero_url}
                      alt=""
                      className="rounded border w-100"
                      style={{ maxHeight: 220, objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="small text-muted border rounded p-3 bg-light">
                    Одоогоор тохируулаагүй — нийтийн хуудсан дээр ковер зураг background болно.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="tps-form-section mt-3">
            <div className="tps-section-head">
              <div className="tps-section-num">8b</div>
              <span className="tps-section-title">Trip-details — Тусламж</span>
            </div>
            <p className="small text-muted mb-3">
              Нийтийн <code>/trip-details/:id</code> — «Тусламж» карт: доорх <strong>утас</strong>,{" "}
              <strong>имэйл</strong>, <strong>онлайн чат</strong> холбоосыг энэ аялалд тохируулна. Имэйл хоосон бол{" "}
              <code>travel@busy.mn</code>; чат URL хоосон бол чатын товч идэвгүй.
            </p>
            <div className="mb-3">
              <label className="pm-label">Утас (аяллын удирдагч)</label>
              <input
                type="tel"
                className="pm-input"
                name="trip_manager_phone"
                placeholder="Жишээ: +976 9911 2233 эсвэл 99112233"
                defaultValue={extras.trip_manager_phone}
                autoComplete="tel"
              />
            </div>
            <div className="mb-3">
              <label className="pm-label">Имэйл (тусламж, зөвлөх)</label>
              <input
                type="email"
                className="pm-input"
                name="trip_help_email"
                placeholder="Жишээ: trips@company.mn — хоосон бол travel@busy.mn"
                defaultValue={extras.trip_help_email}
                autoComplete="email"
              />
            </div>
            <div className="mb-0">
              <label className="pm-label">Онлайн чат (URL)</label>
              <input
                type="text"
                className="pm-input"
                name="trip_help_chat_url"
                placeholder="Жишээ: https://wa.me/976… эсвэл https://m.me/…"
                defaultValue={extras.trip_help_chat_url}
              />
              <p className="small text-muted mt-1 mb-0">
                WhatsApp, Messenger, Slack гэх мэт бүрэн <code>https://</code> хаяг. Хоосон бол чатын товч
                идэвгүй.
              </p>
            </div>
          </div>

          <div className="tps-form-section mt-3">
            <div className="tps-section-head">
              <div className="tps-section-num">8c</div>
              <span className="tps-section-title">Trip-details — Багтсан / Багтаагүй</span>
            </div>
            <p className="small text-muted mb-3">
              Нийтийн <code>/trip-details/:id</code> дээрх хэсгүүдийг item-ээр нь нэмнэ. Хоосон байвал харуулахгүй.
            </p>
            <div className="row g-3">
              <div className="col-md-6">
                <TripSimpleListEditor
                  label="Юу багтсан"
                  name="trip_included_items[]"
                  initialItems={extras.trip_included_items}
                  placeholder="Жишээ: 4-5 одтой зочид буудлын байр"
                  addLabel="Юу багтсан мөр нэмэх"
                />
              </div>
              <div className="col-md-6">
                <TripSimpleListEditor
                  label="Багтаагүй"
                  name="trip_excluded_items[]"
                  initialItems={extras.trip_excluded_items}
                  placeholder="Жишээ: Олон улсын нислэгийн тийз"
                  addLabel="Багтаагүй мөр нэмэх"
                />
              </div>
            </div>
          </div>

          <div className="tps-form-section mt-3">
            <div className="tps-section-head">
              <div className="tps-section-num">8d</div>
              <span className="tps-section-title">Trip-details — Санамж</span>
            </div>
            <p className="small text-muted mb-3">
              Аяллын дэлгэрэнгүй хуудасны «Санамж» хэсэг. Item нэмээгүй бол хэсэг харагдахгүй.
            </p>
            <TripSimpleListEditor
              label="Санамж"
              name="trip_notes[]"
              initialItems={extras.trip_notes}
              placeholder="Жишээ: Паспортын хугацаа 6+ сар хүчинтэй байх шаардлагатай."
              addLabel="Санамж нэмэх"
            />
          </div>

          <div className="tps-form-section mt-3">
            <div className="tps-section-head">
              <div className="tps-section-num">8e</div>
              <span className="tps-section-title">Trip-details — Түгээмэл асуултууд</span>
            </div>
            <p className="small text-muted mb-3">
              Асуулт, хариултыг 1-by-1 нэмнэ. FAQ хоосон бол нийтийн хуудсанд энэ section харагдахгүй.
            </p>
            <TripFaqEditor initialItems={extras.trip_faqs} />
          </div>

          <div className="tps-form-section mt-3">
            <div className="tps-section-head">
              <div className="tps-section-num">8f</div>
              <span className="tps-section-title">Trip-details — Төлбөрийн үе шат</span>
            </div>
            <p className="small text-muted mb-3">
              Төлбөрийн алхмуудыг 1-by-1 нэмнэ. Жишээ нь: 3 эсвэл 4 алхамтай төлбөрийн явц.
              Хоосон байвал нийтийн хуудсанд section харагдахгүй.
            </p>
            <TripPaymentStepsEditor initialItems={extras.trip_payment_steps} />
          </div>

          <div className="tps-form-section mt-4">
            <div className="tps-section-head justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="tps-section-num">10</div>
                <span className="tps-section-title">Аяллын хөтөлбөр (Itinerary builder)</span>
              </div>
              <button type="button" className="btn btn-sm btn-outline-dark">
                <i className="fa-solid fa-wand-magic-sparkles me-2" />
                AI Trip generation
              </button>
            </div>
            <TripItineraryBuilder hiddenName="trip_itinerary_json" initialJson={editTrip?.itineraryJson ?? undefined} />
          </div>
        </div>

        <div className="tps-sidebar">
          <div className="tps-sidebar-widget">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fw-bold text-muted small text-uppercase">Аяллын тойм</div>
              <span className="badge bg-primary bg-opacity-10 text-primary px-2 py-1">{statusBadge}</span>
            </div>
            <div className="tps-summary-item">
              <i className="fa-solid fa-chair tps-summary-icon" />
              <span className="tps-summary-label">Нийт суудал</span>
              <span className="tps-summary-value">{extras.total_seats}</span>
            </div>
            <div className="tps-summary-item">
              <i className="fa-solid fa-user-check tps-summary-icon" />
              <span className="tps-summary-label">Үлдсэн суудал</span>
              <span className="tps-summary-value">{extras.total_seats}</span>
            </div>
            <div className="tps-summary-item">
              <i className="fa-solid fa-calendar-day tps-summary-icon" />
              <span className="tps-summary-label">Эхлэх огноо</span>
              <span className="tps-summary-value">{editTrip ? toInputDate(editTrip.startDate) : "—"}</span>
            </div>
            <div className="tps-summary-item">
              <i className="fa-solid fa-calendar-check tps-summary-icon" />
              <span className="tps-summary-label">Дуусах огноо</span>
              <span className="tps-summary-value">{editTrip ? toInputDate(editTrip.endDate) : "—"}</span>
            </div>
            <div className="tps-summary-item">
              <i className="fa-solid fa-clock tps-summary-icon" />
              <span className="tps-summary-label">Нийт хугацаа</span>
              <span className="tps-summary-value">{durationLabel}</span>
            </div>
            <div className="tps-summary-item">
              <i className="fa-solid fa-tag tps-summary-icon" />
              <span className="tps-summary-label">Үнэ</span>
              <span className="tps-summary-value">{fmtMoney(editTrip?.priceMnt ?? null)}</span>
            </div>

            <button
              type="button"
              className="pm-btn-secondary w-100 py-2 mb-2 d-flex align-items-center justify-content-center gap-2"
            >
              <i className="fa-solid fa-eye" /> Урьдчилан харах
            </button>
            <button
              type="submit"
              className="pm-btn-secondary w-100 py-2 mb-2 d-flex align-items-center justify-content-center gap-2"
              style={{ background: "#fff" }}
            >
              <i className="fa-solid fa-floppy-disk" /> Хадгалах
            </button>
            <button
              type="submit"
              className="pm-btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 border-0"
            >
              <i className="fa-solid fa-paper-plane" /> Нийтлэх
            </button>
          </div>

          <div className="tps-sidebar-widget">
            <div className="fw-bold text-muted small text-uppercase mb-3">Аяллын урьдчилсан харагдац</div>
            <div className="tps-preview-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverPreview || DEFAULT_TRIP_COVER} alt="" className="tps-preview-img" width={320} height={180} />
              <div className="tps-preview-body">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold text-truncate" style={{ maxWidth: 180 }}>
                    {editTrip?.destination ?? "Аяллын нэр"}
                  </span>
                  <span className="badge bg-light text-muted small">{statusBadge}</span>
                </div>
                <p className="small text-muted mb-2 text-truncate">
                  {extras.short_description || "Аяллын товч тайлбар харагдана..."}
                </p>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
                  <span className="small text-muted">
                    <i className="fa-solid fa-clock me-1" /> {durationLabel}
                  </span>
                  <span className="small text-muted">
                    <i className="fa-solid fa-users me-1" /> {extras.total_seats} суудал
                  </span>
                  <span className="fw-bold text-primary">{fmtMoney(editTrip?.priceMnt ?? null)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tps-sidebar-widget">
            <div className="fw-bold text-muted small text-uppercase mb-3">Түгээмэл зөвлөмж</div>
            <div className="tps-checklist-item">
              <div className="tps-checklist-dot checked">
                <i className="fa-solid fa-check" />
              </div>
              <span>Ковер зураг нэмэхийг зөвлөж байна</span>
            </div>
            <div className="tps-checklist-item">
              <div className="tps-checklist-dot checked">
                <i className="fa-solid fa-check" />
              </div>
              <span>Геройн зураг 3-аас доош байвал илүү сайн</span>
            </div>
            <div className="tps-checklist-item">
              <div className="tps-checklist-dot" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                <i className="fa-solid fa-exclamation" style={{ fontSize: "0.4rem" }} />
              </div>
              <span>Аяллын дэлгэрэнгүй тайлбарыг бөглөнө үү</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
