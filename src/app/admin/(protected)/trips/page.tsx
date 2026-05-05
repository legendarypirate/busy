import Link from "next/link";
import AdminTripDeleteButton from "@/components/admin/AdminTripDeleteButton";
import TripEditorForm from "@/components/platform/trips/TripEditorForm";
import { adminDeleteTripAction } from "@/app/admin/(protected)/trips/actions";
import { dbBusinessTrip } from "@/lib/prisma";
import { getPlatformSession } from "@/lib/platform-session";
import {
  errorBanner,
  firstParam,
  fmtMoney,
  toInputDate,
} from "@/components/platform/trips/trip-editor-helpers";

export const metadata = { title: "Бизнес аялал | Админ" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminTripsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const showNew = firstParam(sp.new) === "1";
  const editRaw = firstParam(sp.edit_trip) ?? firstParam(sp.edit);
  const editTripId = Math.max(0, Number(editRaw ?? "0"));
  const showEditor = showNew || editTripId > 0;

  const viewer = await getPlatformSession();
  const greetingName = viewer?.displayName?.trim() || viewer?.email?.trim() || "Админ";
  const err = errorBanner(firstParam(sp.error));

  const trips = dbBusinessTrip();
  const rows = await trips.findMany({
    orderBy: [{ isFeatured: "desc" }, { startDate: "desc" }],
    take: 200,
    select: { id: true, destination: true, startDate: true, endDate: true, statusLabel: true, priceMnt: true },
  });

  const editTrip =
    editTripId > 0 ? await trips.findUnique({ where: { id: editTripId } }) : null;

  if (showEditor) {
    if (editTripId > 0 && !editTrip) {
      return (
        <div>
          <div className="alert alert-warning">{errorBanner("notfound")}</div>
          <Link href="/admin/trips">Жагсаалт руу</Link>
        </div>
      );
    }
    return (
      <div>
        {err ? <div className="alert alert-warning py-2 small mb-3">{err}</div> : null}
        <div className="mb-3">
          <Link href="/admin/trips" className="btn btn-sm btn-outline-secondary">
            ← Жагсаалт руу
          </Link>
        </div>
        <TripEditorForm
          key={editTripId > 0 ? `trip-editor-${editTripId}` : "trip-editor-new"}
          greetingName={greetingName}
          editTrip={editTrip}
          formAction="/api/platform/trips/save?return=admin"
          tripsIndexHref="/admin/trips"
          tripsIndexLabel="Бизнес аялал"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 className="h4 fw-bold mb-0">Бизнес аялал</h1>
        <Link href="/admin/trips?new=1" className="btn btn-primary btn-sm">
          <i className="fas fa-plus me-1" />
          Шинэ аялал
        </Link>
      </div>
      <p className="text-muted small mb-3">
        Платформын хэрэглэгчийн адил <Link href="/admin/trips?new=1">аялал үүсгэх</Link> форм. Хадгалсны дараа энд
        буцна.
      </p>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Чиглэл</th>
              <th>Эхлэх</th>
              <th>Дуусах</th>
              <th>Төлөв</th>
              <th>Үнэ</th>
              <th className="text-end" style={{ width: "1%" }}>
                Үйлдэл
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.destination}</td>
                <td className="small">{toInputDate(r.startDate)}</td>
                <td className="small">{toInputDate(r.endDate)}</td>
                <td className="small">{r.statusLabel ?? "—"}</td>
                <td>{fmtMoney(r.priceMnt)}</td>
                <td className="text-end text-nowrap">
                  <div
                    className="d-inline-flex align-items-stretch border rounded-2 overflow-hidden shadow-sm"
                    role="group"
                    aria-label="Үйлдэл"
                  >
                    <Link
                      href={`/admin/trips/${r.id}/registration-responses`}
                      className="btn btn-sm btn-outline-secondary px-2 py-1 lh-sm border-0 rounded-0"
                      title="Хариултууд (хүснэг)"
                      aria-label="Хариултууд"
                    >
                      <i className="fas fa-table" style={{ fontSize: "0.85rem" }} aria-hidden />
                    </Link>
                    <Link
                      href={`/admin/trips?edit_trip=${r.id}`}
                      className="btn btn-sm btn-outline-primary px-2 py-1 lh-sm border-0 rounded-0 border-start"
                      style={{ fontSize: "0.8rem" }}
                      title="Засах"
                    >
                      Засах
                    </Link>
                    <AdminTripDeleteButton
                      compact
                      action={adminDeleteTripAction}
                      tripId={r.id}
                      destination={r.destination}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="text-muted small">Мөр байхгүй.</p> : null}
    </div>
  );
}
