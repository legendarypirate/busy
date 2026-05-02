import { prisma } from "@/lib/prisma";

export const metadata = { title: "Гишүүн эрх | Админ" };

export default async function AdminBniMembershipsPage() {
  const rows = await prisma.chapterMembership.findMany({
    orderBy: { id: "desc" },
    take: 200,
    include: {
      account: { select: { email: true } },
      chapter: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Гишүүн эрх</h1>
      <p className="text-muted small mb-3">
        <code>bni_chapter_memberships</code> — сүүлийн 200 мөр.
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имэйл</th>
              <th>Бүлэг</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.id)}</td>
                <td className="small">{r.account.email}</td>
                <td>{r.chapter.name}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
