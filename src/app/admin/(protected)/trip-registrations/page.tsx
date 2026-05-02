import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Аяллын формын бүртгэл | Админ" };

type Search = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function fmtLocal(iso: Date): string {
  try {
    return iso.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso.toISOString().slice(0, 16).replace("T", " ");
  }
}

export default async function AdminTripRegistrationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const tripRaw = firstParam(sp.trip_id)?.trim() ?? "";
  const tripFilter = Math.max(0, Number(tripRaw || "0"));

  let trips: { id: number; destination: string }[] = [];
  let rows: Awaited<ReturnType<typeof loadResponses>> = [];
  let loadError: string | null = null;

  try {
    trips = await prisma.businessTrip.findMany({
      orderBy: [{ startDate: "desc" }],
      take: 400,
      select: { id: true, destination: true },
    });
    rows = await loadResponses(tripFilter > 0 ? { tripId: tripFilter } : {});
  } catch {
    loadError = "Өгөгдөл ачаалахад алдаа (хүснэгт байгаа эсэхийг шалгана уу).";
  }

  return (
    <div>
      <h1 className="h4 fw-bold mb-2">Аяллын формын бүртгэл</h1>
      <p className="text-muted small mb-3">
        Нийтийн <code className="small">/register/…</code> хуудас болон drawer-аар илгээсэн хариултууд (TripFormResponse).
      </p>

      <form method="get" className="row g-2 align-items-end mb-4">
        <div className="col-md-6 col-lg-4">
          <label htmlFor="trip_id" className="form-label small mb-1">
            Аяллаар шүүх
          </label>
          <select id="trip_id" name="trip_id" className="form-select form-select-sm" defaultValue={tripFilter > 0 ? String(tripFilter) : ""}>
            <option value="">Бүх аялал</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.destination}
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            Шүүх
          </button>
          {tripFilter > 0 ? (
            <Link href="/admin/trip-registrations" className="btn btn-outline-secondary btn-sm">
              Цэвэрлэх
            </Link>
          ) : null}
        </div>
      </form>

      {loadError ? <div className="alert alert-warning py-2 small">{loadError}</div> : null}

      <div className="table-responsive">
        <table className="table table-hover table-sm align-middle">
          <thead>
            <tr>
              <th>Огноо</th>
              <th>Аялал</th>
              <th>Форм</th>
              <th>Илгээгч</th>
              <th>Төлөв</th>
              <th>Хариулт</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const who =
                r.participant?.fullName?.trim() ||
                r.submitter?.email?.trim() ||
                (r.submittedByUserId ? `ID ${String(r.submittedByUserId)}` : "Зочин");
              const sortedAnswers = [...r.answers].sort(
                (a, b) => (a.question?.sortOrder ?? 0) - (b.question?.sortOrder ?? 0),
              );
              return (
                <tr key={r.id}>
                  <td className="small text-nowrap">{fmtLocal(r.submittedAt)}</td>
                  <td className="small">
                    <Link href={`/admin/trips?edit_trip=${r.trip.id}`} className="fw-semibold text-decoration-none">
                      #{r.trip.id}
                    </Link>{" "}
                    {r.trip.destination}
                  </td>
                  <td className="small">
                    <div>{r.form.title}</div>
                    <a
                      href={`/register/${encodeURIComponent(r.form.publicSlug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      /register/…
                    </a>
                  </td>
                  <td className="small text-break">{who}</td>
                  <td className="small">
                    <span className="badge bg-light text-dark border">{r.status}</span>
                  </td>
                  <td className="small">{r.answers.length}</td>
                  <td className="small">
                    <details>
                      <summary className="cursor-pointer user-select-none">Хариултууд</summary>
                      <dl className="mb-0 mt-2 small border rounded p-2 bg-light">
                        {sortedAnswers.map((a) => (
                          <div key={a.id} className="mb-2">
                            <dt className="fw-semibold text-muted">{a.question?.label ?? a.questionId}</dt>
                            <dd className="mb-0 text-break">
                              {(a.value ?? "").trim() || "—"}
                              {a.fileUrl?.trim() ? (
                                <>
                                  {" "}
                                  <a href={a.fileUrl.trim()} target="_blank" rel="noopener noreferrer" className="small">
                                    файл
                                  </a>
                                </>
                              ) : null}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && !loadError ? (
        <p className="text-muted small">Одоогоор бүртгэл байхгүй эсвэл сонгосон аялалд хариулт ирээгүй байна.</p>
      ) : null}
    </div>
  );
}

async function loadResponses(where: { tripId?: number }) {
  return prisma.tripFormResponse.findMany({
    where: where.tripId ? { tripId: where.tripId } : {},
    orderBy: { submittedAt: "desc" },
    take: 500,
    include: {
      trip: { select: { id: true, destination: true } },
      form: { select: { title: true, publicSlug: true } },
      submitter: { select: { email: true } },
      participant: { select: { fullName: true, phone: true, email: true } },
      answers: {
        include: {
          question: { select: { label: true, sortOrder: true } },
        },
      },
    },
  });
}
