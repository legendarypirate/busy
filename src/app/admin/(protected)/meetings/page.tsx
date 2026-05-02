import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Уулзалтууд | Админ" };

export default async function AdminMeetingsPage() {
  let rows: { id: number; title: string; meetingDate: Date; status: string }[] = [];
  try {
    rows = await prisma.legacyMeeting.findMany({
      orderBy: { id: "desc" },
      take: 200,
      select: { id: true, title: true, meetingDate: true, status: true },
    });
  } catch {
    /* */
  }

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Уулзалтууд</h1>
      <p className="text-muted small mb-3">
        Legacy <code>meetings</code> хүснэгт. Засварын UI дараа нь нэмэгдэнэ — одоогоор жагсаалт.
      </p>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Гарчиг</th>
              <th>Огноо</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.title}</td>
                <td>{r.meetingDate.toISOString().slice(0, 10)}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="text-muted small">Мөр байхгүй.</p> : null}
      <p className="small text-muted mt-2">
        Платформын шинэ уулзалт: <Link href="/platform">/platform</Link>
      </p>
    </div>
  );
}
