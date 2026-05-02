import { prisma } from "@/lib/prisma";

export const metadata = { title: "QPay төлбөрүүд | Админ" };

export default async function AdminPaymentOrdersPage() {
  let rows: {
    id: bigint;
    orderRef: string;
    targetType: string;
    targetId: bigint;
    amountMnt: number;
    status: string;
    createdAt: Date;
  }[] = [];
  try {
    rows = await prisma.paymentOrder.findMany({
      orderBy: { id: "desc" },
      take: 200,
      select: {
        id: true,
        orderRef: true,
        targetType: true,
        targetId: true,
        amountMnt: true,
        status: true,
        createdAt: true,
      },
    });
  } catch {
    /* */
  }

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">QPay төлбөрүүд</h1>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Order ref</th>
              <th>Зорилго</th>
              <th>Дүн (₮)</th>
              <th>Төлөв</th>
              <th>Үүсгэсэн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.id)}</td>
                <td className="small text-break">{r.orderRef}</td>
                <td className="small">
                  {r.targetType} #{String(r.targetId)}
                </td>
                <td>{r.amountMnt.toLocaleString()}</td>
                <td>{r.status}</td>
                <td className="small">{r.createdAt.toISOString().slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="text-muted small">Мөр байхгүй.</p> : null}
    </div>
  );
}
