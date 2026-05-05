import Link from "next/link";
import AdminTripRegistrationsClient, {
  type AdminTripRegistrationRow,
} from "@/components/admin/AdminTripRegistrationsClient";
import { answersForOrganizerApi } from "@/lib/trip-registration-form/answers-snapshot";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Аяллын формын бүртгэл | Админ" };

type Search = Record<string, string | string[] | undefined>;

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

async function loadResponses(where: { tripId?: number }) {
  return prisma.tripFormResponse.findMany({
    where: where.tripId ? { tripId: where.tripId } : {},
    orderBy: { submittedAt: "desc" },
    take: 500,
    include: {
      trip: { select: { id: true, destination: true } },
      event: { select: { id: true, title: true } },
      form: { select: { title: true, publicSlug: true } },
      submitter: { select: { email: true } },
      participant: { select: { fullName: true, phone: true, email: true } },
      answers: {
        include: {
          question: { select: { label: true, sortOrder: true, type: true } },
        },
      },
    },
  });
}

function serializeTripRegistrationRows(
  rows: Awaited<ReturnType<typeof loadResponses>>,
): AdminTripRegistrationRow[] {
  return rows.map((r) => {
    const merged = answersForOrganizerApi({
      answersSnapshot: r.answersSnapshot,
      answers: r.answers.map((a) => ({
        questionId: a.questionId,
        value: a.value,
        fileUrl: a.fileUrl,
        question: a.question,
      })),
    });
    return {
      id: r.id,
      submittedAt: r.submittedAt.toISOString(),
      status: r.status,
      paymentStatus: r.paymentStatus,
      orderSummary: r.orderSummary ?? null,
      trip:
        r.trip != null
          ? r.trip
          : {
              id: 0,
              destination:
                r.event != null
                  ? `Эвент #${r.event.id.toString()} — ${r.event.title?.trim() || ""}`
                  : "Эвент (аялалгүй)",
            },
      form: r.form,
      submitterEmail: r.submitter?.email?.trim() || null,
      submittedByUserId: r.submittedByUserId != null ? String(r.submittedByUserId) : null,
      participant: r.participant
        ? {
            fullName: r.participant.fullName,
            phone: r.participant.phone,
            email: r.participant.email,
          }
        : null,
      answers: merged.map((a, idx) => ({
        id: `${r.id}_${a.questionId}_${idx}`,
        label: a.questionLabel,
        sortOrder: idx,
        value: a.value,
        fileUrl: a.fileUrl,
      })),
    };
  });
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

      {rows.length > 0 ? <AdminTripRegistrationsClient rows={serializeTripRegistrationRows(rows)} /> : null}
      {rows.length === 0 && !loadError ? (
        <p className="text-muted small">Одоогоор бүртгэл байхгүй эсвэл сонгосон аялалд хариулт ирээгүй байна.</p>
      ) : null}
    </div>
  );
}
