import Link from "next/link";
import DynamicQuestionBuilder from "@/components/platform/forms/DynamicQuestionBuilder";
import TripCoverHero from "@/components/platform/forms/TripCoverHero";
import TripDateDuration from "@/components/platform/forms/TripDateDuration";
import TripItineraryBuilder from "@/components/platform/forms/TripItineraryBuilder";
import PlatformPostTokenHidden from "@/components/platform/PlatformPostTokenHidden";
import { deleteTripAction, toggleTripFeaturedAction } from "@/app/platform/trips-actions";
import { dbBusinessTrip } from "@/lib/prisma";
import { getPlatformSession } from "@/lib/platform-session";
import { issuePlatformPostToken } from "@/lib/platform-trip-save-token";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop";

function fmtMoney(mnt: unknown): string {
  if (mnt == null || mnt === "") {
    return "₮0";
  }
  const n = Number(mnt);
  if (!Number.isFinite(n)) {
    return "₮0";
  }
  return `₮${Math.round(n).toLocaleString("mn-MN")}`;
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) {
    return v[0];
  }
  return v;
}

function parseHeroSlides(raw: string | null | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) {
      return [];
    }
    return j.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function readExtras(raw: unknown): {
  short_description: string;
  location: string;
  total_seats: number;
  advance_percent: number;
} {
  const d = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    short_description: String(d.short_description ?? ""),
    location: String(d.location ?? ""),
    total_seats: Math.max(1, Number(d.total_seats ?? 30) || 30),
    advance_percent: Math.max(0, Number(d.advance_percent ?? 20) || 20),
  };
}

function tripDaySpan(start: Date, end: Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) {
    return 0;
  }
  return Math.floor((e - s) / (24 * 60 * 60 * 1000)) + 1;
}

function toInputDate(d: Date): string {
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function errorBanner(code: string | undefined): string | null {
  if (!code) {
    return null;
  }
  if (code === "missing") {
    return "Чиглэл болон огноогоор бөглөнө үү.";
  }
  if (code === "dates") {
    return "Дуусах огноо эхлэхээс өмнө байж болохгүй.";
  }
  if (code === "notfound") {
    return "Аялал олдсонгүй.";
  }
  if (code === "featured_limit") {
    return "Онцлох аялал дээд тал нь 3 байна. Нэгийг нь буулгаад дахин оролдоно уу.";
  }
  return null;
}

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function TripsPanel({ searchParams }: Props) {
  const viewer = await getPlatformSession();
  const postToken = viewer ? issuePlatformPostToken(viewer.id) : null;
  const greetingName = viewer?.displayName?.trim() || "Та";
  const err = errorBanner(firstParam(searchParams?.error));
  const editRaw = firstParam(searchParams?.edit_trip) ?? firstParam(searchParams?.edit);
  const editTripId = Math.max(0, Number(editRaw ?? ""));

  const trips = dbBusinessTrip();
  const managedTrips = await trips.findMany({
    orderBy: [{ isFeatured: "desc" }, { startDate: "desc" }],
    take: 200,
  });

  const editTrip =
    editTripId > 0 ? await trips.findUnique({ where: { id: editTripId } }) : null;

  if (editTripId > 0 && !editTrip) {
    return (
      <div className="pl-panel-inner px-3 py-4">
        <div className="alert alert-warning">{errorBanner("notfound")}</div>
        <Link href="/platform/trips">Жагсаалт руу</Link>
      </div>
    );
  }

  const extras = readExtras(editTrip?.extrasJson ?? undefined);
  const heroSlides = parseHeroSlides(editTrip?.heroSliderJson);
  const coverPreview = editTrip?.coverImageUrl?.trim() || "";
  const daysLen = editTrip ? tripDaySpan(editTrip.startDate, editTrip.endDate) : 0;
  const durationLabel = daysLen > 0 ? `${daysLen} өдөр` : "—";
  const statusBadge = editTrip?.statusLabel?.trim() === "Нийтлэгдсэн" ? "Нийтлэгдсэн" : "Ноорог";

  return (
    <div className="pl-panel-inner px-3 py-4">
      {err ? <div className="alert alert-warning py-2 small mb-3">{err}</div> : null}

      {/* --- Managed trips (PHP order: card first) --- */}
      <div className="pm-card mb-4" id="managedTripsCard">
        <div className="pm-card-header d-flex justify-content-between align-items-center">
          <div>
            <div className="pm-card-title">Миний аяллууд</div>
            <div className="pm-card-subtitle">Онцлох аялал дээд тал нь 3 байж болно.</div>
          </div>
          <Link href="/platform/trips" className="btn btn-sm btn-outline-primary">
            <i className="fa-solid fa-plus me-1" />
            Шинэ аялал
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Аялал</th>
                <th>Огноо</th>
                <th>Үнэ</th>
                <th>Хүсэлт</th>
                <th>Онцлох</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {managedTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    Аялал бүртгэгдээгүй байна.
                  </td>
                </tr>
              ) : (
                managedTrips.map((mt) => (
                  <tr key={mt.id}>
                    <td>
                      <div className="fw-semibold">{mt.destination}</div>
                      <div className="small text-muted">{mt.seatsLabel?.trim() || ""}</div>
                    </td>
                    <td className="small text-muted">
                      {toInputDate(mt.startDate)} — {toInputDate(mt.endDate)}
                    </td>
                    <td>{fmtMoney(mt.priceMnt)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <span className="badge rounded-pill bg-light text-muted border">—</span>
                      </div>
                    </td>
                    <td>
                      {mt.isFeatured === 1 ? (
                        <span className="badge bg-warning text-dark">
                          <i className="fa-solid fa-star me-1" />
                          Онцлох
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted">Энгийн</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex flex-wrap gap-2 justify-content-end">
                        <form action={toggleTripFeaturedAction}>
                          <PlatformPostTokenHidden token={postToken} />
                          <input type="hidden" name="trip_id" value={mt.id} />
                          <input type="hidden" name="is_featured" value={mt.isFeatured === 1 ? "0" : "1"} />
                          <button
                            type="submit"
                            className={`btn btn-sm ${mt.isFeatured === 1 ? "btn-outline-secondary" : "btn-outline-warning"}`}
                          >
                            {mt.isFeatured === 1 ? "Онцлолоос буулгах" : "Make Онцлох аялал"}
                          </button>
                        </form>
                        <Link href={`/platform/trips?edit_trip=${mt.id}`} className="btn btn-sm btn-outline-primary">
                          Засах
                        </Link>
                        <form action={deleteTripAction} className="d-inline">
                          <PlatformPostTokenHidden token={postToken} />
                          <input type="hidden" name="trip_id" value={mt.id} />
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

      {/* --- Approved attendees placeholder (parity shell) --- */}
      <div className="pm-card mb-4" id="approvedTripAttendeesCard">
        <div className="pm-card-header d-flex justify-content-between align-items-center">
          <div>
            <div className="pm-card-title">Зөвшөөрсөн оролцогчдын жагсаалт</div>
            <div className="pm-card-subtitle">Төлөв, төлбөрийн мэдээлэлтэй оролцогчид.</div>
          </div>
          <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">Нийт 0</span>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Оролцогч</th>
                <th>Аялал</th>
                <th>Компани / Салбар</th>
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

      {/* --- Main trip editor form --- */}
      <form id="tripMainForm" action="/api/platform/trips/save" method="post" encType="multipart/form-data">
        <PlatformPostTokenHidden token={postToken} />
        <input type="hidden" name="trip_id" value={editTrip?.id ?? 0} />

        <div className="tps-header mb-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2" style={{ fontSize: "0.7rem" }}>
              <li className="breadcrumb-item">
                <Link href="/platform/trips" className="text-decoration-none">
                  Аялал
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
                <span className="tps-section-title">Бүртгэлийн асуулгын форм (Dynamic)</span>
              </div>
              <div className="small text-muted mb-2">Аялал тус бүр өөрийн Google Form шиг асуулгатай байж болно.</div>
              <DynamicQuestionBuilder
                hiddenName="trip_registration_form_json"
                initialJson={editTrip?.registrationFormJson ?? undefined}
                listId="tripQuestionBuilderList"
                addBtnId="tripQuestionAddBtn"
              />
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
                      <input
                        type="number"
                        className="pm-input"
                        name="trip_total_seats"
                        defaultValue={extras.total_seats}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="pm-label">Үлдэгдэл суудал</label>
                    <input
                      type="text"
                      className="pm-input bg-light border-0"
                      readOnly
                      value={String(extras.total_seats)}
                    />
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
                      <input
                        type="number"
                        className="pm-input"
                        name="trip_advance_percent"
                        defaultValue={extras.advance_percent}
                      />
                    </div>
                  </div>
                  <div className="mt-2 small text-muted">Хувь эсвэл дүнгээр тооцно.</div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <TripCoverHero existingSlides={heroSlides} coverPreviewUrl={coverPreview || null} />

              <div className="col-md-4">
                <div className="tps-form-section h-100">
                  <div className="tps-section-head">
                    <div className="tps-section-num">9</div>
                    <span className="tps-section-title">Аяллын дэлгэрэнгүй тайлбар</span>
                  </div>
                  <div className="mb-2 d-flex gap-2 flex-wrap">
                    <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 28, height: 28 }}>
                      <i className="fa-solid fa-bold" />
                    </button>
                    <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 28, height: 28 }}>
                      <i className="fa-solid fa-italic" />
                    </button>
                    <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 28, height: 28 }}>
                      <i className="fa-solid fa-underline" />
                    </button>
                    <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 28, height: 28 }}>
                      <i className="fa-solid fa-list-ul" />
                    </button>
                    <button type="button" className="btn btn-sm btn-light p-1" style={{ width: 28, height: 28 }}>
                      <i className="fa-solid fa-link" />
                    </button>
                  </div>
                  <textarea
                    className="pm-input"
                    name="trip_description"
                    rows={5}
                    placeholder="Аяллын дэлгэрэнгүй мэдээллийг энд оруулна уу..."
                    defaultValue={editTrip?.description ?? ""}
                  />
                </div>
              </div>
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

              <button type="button" className="pm-btn-secondary w-100 py-2 mb-2 d-flex align-items-center justify-content-center gap-2">
                <i className="fa-solid fa-eye" /> Урьдчилан харах
              </button>
              <button
                type="submit"
                className="pm-btn-secondary w-100 py-2 mb-2 d-flex align-items-center justify-content-center gap-2"
                style={{ background: "#fff" }}
              >
                <i className="fa-solid fa-floppy-disk" /> Хадгалах
              </button>
              <button type="submit" className="pm-btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 border-0">
                <i className="fa-solid fa-paper-plane" /> Нийтлэх
              </button>
            </div>

            <div className="tps-sidebar-widget">
              <div className="fw-bold text-muted small text-uppercase mb-3">Аяллын урьдчилсан харагдац</div>
              <div className="tps-preview-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview || DEFAULT_COVER}
                  alt=""
                  className="tps-preview-img"
                  width={320}
                  height={180}
                />
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
    </div>
  );
}
