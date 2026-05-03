import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { saveChapterAction } from "./actions";

export const metadata = { title: "Бүлгүүд | Админ" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminBniChaptersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const err = sp.error === "missing" ? "Бүс болон нэр заавал бөглөнө үү." : null;

  const [rows, regions] = await Promise.all([
    prisma.chapter.findMany({
      orderBy: [{ regionId: "asc" }, { id: "asc" }],
      include: { region: { select: { name: true } } },
    }),
    prisma.region.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Бүлгүүд</h1>
      {err ? <div className="alert alert-warning py-2 small mb-3">{err}</div> : null}
      <p className="text-muted small mb-3">
        <code>bni_chapters</code> — эвентийн «Бүлэг» сонголтод орно. Эхлээд{" "}
        <Link href="/admin/bni-regions">бүс</Link> үүсгээгүй бол тэндээс нэмнэ үү.
      </p>

      <div className="card mb-4">
        <div className="card-header fw-semibold">Шинэ бүлэг үүсгэх</div>
        <div className="card-body">
          <form action={saveChapterAction} className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="chapter_region_id">
                Бүс <span className="text-danger">*</span>
              </label>
              <select className="form-select" id="chapter_region_id" name="region_id" required defaultValue="">
                <option value="" disabled>
                  Сонгох…
                </option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="chapter_name">
                Бүлгийн нэр <span className="text-danger">*</span>
              </label>
              <input className="form-control" id="chapter_name" name="name" required placeholder="Ж: Central" />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="chapter_slug">
                Slug
              </label>
              <input
                className="form-control"
                id="chapter_slug"
                name="slug"
                placeholder="Хоосон бол нэрээс"
                autoComplete="off"
              />
            </div>
            <div className="col-md-1">
              <label className="form-label" htmlFor="chapter_max">
                Max
              </label>
              <input
                type="number"
                className="form-control"
                id="chapter_max"
                name="max_members"
                min={1}
                max={500}
                defaultValue={40}
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100">
                Нэмэх
              </button>
            </div>
            <input type="hidden" name="timezone" value="Asia/Ulaanbaatar" />
          </form>
        </div>
      </div>

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
