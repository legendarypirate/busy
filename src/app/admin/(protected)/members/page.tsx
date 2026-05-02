import { prisma } from "@/lib/prisma";

export const metadata = { title: "Гишүүд | Админ" };

export default async function AdminMembersPage() {
  const rows = await prisma.legacyMember.findMany({
    orderBy: { id: "desc" },
    take: 300,
    select: {
      id: true,
      name: true,
      company: true,
      industry: true,
      email: true,
      status: true,
    },
  });

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Гишүүд</h1>
      <p className="text-muted small mb-3">
        <code>members</code> хүснэгт. CSV импорт, зураг оруулах зэрэг PHP функцийг дараагийн алхамтай нэмнэ.
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Нэр</th>
              <th>Байгууллага</th>
              <th>Чиглэл</th>
              <th>Имэйл</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.company ?? "—"}</td>
                <td>{r.industry ?? "—"}</td>
                <td className="small">{r.email ?? "—"}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
