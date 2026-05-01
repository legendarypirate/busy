import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80";

type Props = { params: Promise<{ id: string }> };

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    notFound();
  }
  const trip = await prisma.businessTrip.findUnique({ where: { id: num } }).catch(() => null);
  if (!trip) {
    notFound();
  }

  return (
    <main className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/trips">Бизнес аялал</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {trip.destination}
          </li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-light shadow-sm position-relative">
            <Image
              src={mediaUrl(trip.coverImageUrl) || FALLBACK_IMG}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 992px) 100vw, 58vw"
              priority
            />
          </div>
        </div>
        <div className="col-lg-5">
          <h1 className="h2 fw-bold" style={{ color: "var(--brand-primary)" }}>
            {trip.destination}
          </h1>
          <p className="text-muted mb-2">
            {formatMnDate(trip.startDate)} — {formatMnDate(trip.endDate)}
          </p>
          {trip.statusLabel ? (
            <p className="small">
              <span className="badge bg-light text-dark border">{trip.statusLabel}</span>
            </p>
          ) : null}
          {trip.seatsLabel ? <p className="small">{trip.seatsLabel}</p> : null}
          {trip.priceMnt != null ? (
            <p className="fw-semibold">
              Үнэ: {trip.priceMnt.toString()} ₮
            </p>
          ) : null}
          {trip.focus ? <p className="mt-3">{trip.focus}</p> : null}
          {trip.description ? (
            <p className="mt-3 mb-0 small text-muted whitespace-pre-wrap">{trip.description}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
