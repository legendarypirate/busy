import Link from "next/link";
import TripEditorForm from "@/components/platform/trips/TripEditorForm";
import { deleteTripAction, toggleTripFeaturedAction } from "@/app/platform/trips-actions";
import { dbBusinessTrip } from "@/lib/prisma";
import { getPlatformSession } from "@/lib/platform-session";
import {
  errorBanner,
  firstParam,
  fmtMoney,
  toInputDate,
} from "@/components/platform/trips/trip-editor-helpers";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function TripsPanel({ searchParams }: Props) {
  const viewer = await getPlatformSession();
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

      <TripEditorForm
        key={editTripId > 0 ? `trip-editor-${editTripId}` : "trip-editor-new"}
        greetingName={greetingName}
        editTrip={editTrip}
        formAction="/api/platform/trips/save"
        tripsIndexHref="/platform/trips"
        tripsIndexLabel="Аялал"
      />
    </div>
  );
}
