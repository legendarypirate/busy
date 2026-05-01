import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatClockUtc, formatMnDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const meetings = await prisma.legacyMeeting
    .findMany({
      where: {
        status: "active",
        meetingDate: { gte: today },
      },
      orderBy: [{ meetingDate: "asc" }, { startTime: "asc" }],
      take: 60,
    })
    .catch(() => []);

  return (
    <main className="container py-4">
      <h1 className="h2 fw-bold mb-3" style={{ color: "var(--brand-primary)" }}>
        Хурал, уулзалт
      </h1>
      <p className="text-muted">
        Legacy <code>meetings</code> хүснэгт — PHP дээрх <code>meetings.php</code>-тай ижил өгөгдлийн эх үүсвэр.
      </p>

      <div className="list-group mt-4 shadow-sm">
        {meetings.length === 0 ? (
          <div className="list-group-item text-muted">Ирээдүйн хурал олдсонгүй.</div>
        ) : (
          meetings.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="list-group-item list-group-item-action py-3"
            >
              <div className="fw-semibold">{m.title}</div>
              <div className="small text-muted">
                {formatMnDate(m.meetingDate)} · {formatClockUtc(m.startTime)} — {formatClockUtc(m.endTime)}
              </div>
              {m.location ? <div className="small mt-1">{m.location}</div> : null}
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
