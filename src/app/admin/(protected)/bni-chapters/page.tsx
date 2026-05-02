import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Бүлгүүд | Админ" };

export default async function AdminBniChaptersPage() {
  const rows = await prisma.chapter.findMany({
    orderBy: [{ regionId: "asc" }, { id: "asc" }],
    include: { region: { select: { name: true } } },
  });

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Бүлгүүд</h1>
      <p className="text-muted small mb-3">
        <code>bni_chapters</code> — жагсаалт. Бүлэг нэмэх/засах (<code>bni-chapter-manage.php</code>) дараа нь
        нэгтгэнэ.
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Бүс</th>
              <th>Нэр</th>
              <th>Slug</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.region.name}</td>
                <td>{r.name}</td>
                <td className="small">{r.slug}</td>
                <td>{r.maxMembers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small text-muted mt-2">
        Холбоотой: <Link href="/admin/bni-regions">Бүс нутаг</Link>
      </p>
    </div>
  );
}
