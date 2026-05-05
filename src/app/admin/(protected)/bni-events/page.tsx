import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Хурлууд | Админ" };

export default async function AdminBniEventsPage() {
  const rows = await prisma.bniEvent.findMany({
    orderBy: { startsAt: "desc" },
    take: 200,
    include: { chapter: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Хурлууд</h1>
      <p className="text-muted small mb-3">
        <code>bni_events</code> — жагсаалт. Календар / засварын UI дараа нь.
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Бүлэг</th>
              <th>Төрөл</th>
              <th>Эхлэх</th>
              <th>Дуусах</th>
              <th className="text-end" style={{ width: "1%" }}>
                Үйлдэл
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.id)}</td>
                <td>{r.chapter?.name ?? "—"}</td>
                <td className="small">{r.eventType}</td>
                <td className="small">{r.startsAt.toISOString().slice(0, 16)}</td>
                <td className="small">{r.endsAt.toISOString().slice(0, 16)}</td>
                <td className="text-end">
                  <Link
                    href={`/admin/events/${String(r.id)}/registration-responses`}
                    className="btn btn-sm btn-outline-secondary"
                    title="Бүртгэлийн хариултууд (хүснэг)"
                    aria-label="Бүртгэлийн хариултууд"
                  >
                    <i className="fas fa-table" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
