import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatClockUtc, formatMnDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MeetingDetailPage({ params }: Props) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    notFound();
  }
  const m = await prisma.legacyMeeting.findUnique({ where: { id: num } }).catch(() => null);
  if (!m) {
    notFound();
  }

  return (
    <main className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/meetings">Хурал</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {m.title}
          </li>
        </ol>
      </nav>
      <h1 className="h2 fw-bold" style={{ color: "var(--brand-primary)" }}>
        {m.title}
      </h1>
      <p className="text-muted">
        {formatMnDate(m.meetingDate)} · {formatClockUtc(m.startTime)} — {formatClockUtc(m.endTime)}
      </p>
      {m.location ? <p>{m.location}</p> : null}
      {m.description ? <div className="mt-4 small whitespace-pre-wrap">{m.description}</div> : null}
    </main>
  );
}
