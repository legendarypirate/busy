import { prisma } from "@/lib/prisma";

export const metadata = { title: "Мэдээ | Админ" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminNewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = sp.status === "draft" ? "draft" : undefined;

  const rows = await prisma.newsArticle.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, title: true, slug: true, status: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Мэдээ</h1>
      <p className="text-muted small mb-3">
        <code>news</code> — жагсаалт. Summernote редакторыг дараа нь оруулна.
        {status === "draft" ? (
          <span className="ms-1 fw-semibold">(зөвхөн ноорог)</span>
        ) : null}
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Гарчиг</th>
              <th>Slug</th>
              <th>Төлөв</th>
              <th>Үүсгэсэн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.title}</td>
                <td className="small text-break">{r.slug}</td>
                <td>{r.status}</td>
                <td className="small">{r.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
