import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteRegionAction, saveRegionAction } from "./actions";

export const metadata = { title: "Бүс нутаг | Админ" };

type Props = { searchParams: Promise<{ edit?: string }> };

export default async function AdminBniRegionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const editId = parseInt(String(sp.edit ?? ""), 10);
  const editRow =
    Number.isFinite(editId) && editId > 0
      ? await prisma.region.findUnique({ where: { id: editId } }).catch(() => null)
      : null;

  const regions = await prisma.region.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Бүс нутаг</h1>

      <div className="card mb-4">
        <div className="card-header fw-semibold">{editRow ? "Бүс засах" : "Шинэ бүс"}</div>
        <div className="card-body">
          <form action={saveRegionAction} className="row g-3">
            <input type="hidden" name="id" value={editRow ? String(editRow.id) : ""} />
            <div className="col-md-4">
              <label className="form-label" htmlFor="name">
                Нэр
              </label>
              <input
                className="form-control"
                id="name"
                name="name"
                required
                defaultValue={editRow?.name ?? ""}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="slug">
                Slug
              </label>
              <input
                className="form-control"
                id="slug"
                name="slug"
                placeholder="Хоосон бол нэрээс үүснэ"
                defaultValue={editRow?.slug ?? ""}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="sort_order">
                Эрэмбэ
              </label>
              <input
                type="number"
                className="form-control"
                id="sort_order"
                name="sort_order"
                defaultValue={editRow?.sortOrder ?? 0}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100">
                {editRow ? "Хадгалах" : "Нэмэх"}
              </button>
            </div>
          </form>
          {editRow ? (
            <div className="mt-2">
              <Link href="/admin/bni-regions" className="small">
                Цуцлах
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Нэр</th>
              <th>Slug</th>
              <th>Эрэмбэ</th>
              <th>Бүлэг</th>
              <th className="actions">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td className="small">{r.slug}</td>
                <td>{r.sortOrder}</td>
                <td>{r._count.chapters}</td>
                <td className="actions">
                  <Link href={`/admin/bni-regions?edit=${r.id}`} className="btn btn-sm btn-outline-secondary me-1">
                    <i className="fas fa-edit" title="Засах" />
                  </Link>
                  {r._count.chapters === 0 ? (
                    <form action={deleteRegionAction} className="d-inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="btn btn-sm btn-outline-danger" title="Устгах">
                        <i className="fas fa-trash" />
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
