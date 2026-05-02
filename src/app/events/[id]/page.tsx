import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";
import { bniEventPublicDetailSelect } from "@/lib/prisma-event-select";

export const dynamic = "force-dynamic";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";

type Props = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  let nid: bigint;
  try {
    nid = BigInt(id);
  } catch {
    notFound();
  }

  const ev = await prisma.bniEvent
    .findUnique({
      where: { id: nid },
      select: bniEventPublicDetailSelect,
    })
    .catch(() => null);

  if (!ev) {
    notFound();
  }

  const title = ev.title?.trim() || ev.chapter?.name || "Хурал / эвент";
  const whenLine = `${formatMnDate(ev.startsAt)} · ${ev.startsAt.toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  })} — ${formatMnDate(ev.endsAt)} · ${ev.endsAt.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <main className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/events">Хурал / Эвент</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-light shadow-sm position-relative">
            <Image
              src={FALLBACK_IMG}
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
            {title}
          </h1>
          <p className="text-muted mb-2">{whenLine}</p>
          <p className="small mb-2">
            <span className="badge bg-light text-dark border">{ev.eventType.replace(/_/g, " ")}</span>
          </p>
          {ev.chapter ? (
            <p className="text-muted small mb-3">
              {ev.chapter.region.name} · {ev.chapter.name}
            </p>
          ) : null}
          {ev.location ? (
            <p className="fw-semibold mb-0">
              <i className="fa-solid fa-location-dot me-1" />
              {ev.location}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
