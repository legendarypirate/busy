import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Хяналтын самбар | Админ" };

export default async function AdminDashboardPage() {
  let memberCount = 0;
  let newsPublished = 0;
  let newsDraft = 0;
  let chapterCount = 0;
  let eventUpcoming = 0;
  const recentMembers: { id: number; name: string; company: string | null; industry: string | null; photo: string | null }[] = [];
  const recentNews: { id: number; title: string; status: string; createdAt: Date }[] = [];

  try {
    memberCount = await prisma.legacyMember.count({ where: { status: "active" } });
  } catch {
    /* */
  }
  try {
    newsPublished = await prisma.newsArticle.count({ where: { status: "published" } });
    newsDraft = await prisma.newsArticle.count({ where: { status: "draft" } });
  } catch {
    /* */
  }
  try {
    chapterCount = await prisma.chapter.count();
  } catch {
    /* */
  }
  try {
    eventUpcoming = await prisma.bniEvent.count({ where: { endsAt: { gte: new Date() } } });
  } catch {
    /* */
  }
  try {
    const rm = await prisma.legacyMember.findMany({
      where: { status: "active" },
      orderBy: { id: "desc" },
      take: 5,
      select: { id: true, name: true, company: true, industry: true, photo: true },
    });
    recentMembers.push(...rm);
  } catch {
    /* */
  }
  try {
    const rn = await prisma.newsArticle.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true },
    });
    recentNews.push(...rn);
  } catch {
    /* */
  }

  return (
    <div>
      <h1 className="h4 fw-bold mb-4">Хяналтын самбар</h1>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted mb-0">Нийт гишүүд</h6>
                  <h2 className="mt-2 mb-0">{memberCount}</h2>
                </div>
                <div className="bg-light rounded-circle p-3">
                  <i className="fas fa-users fa-2x text-primary" />
                </div>
              </div>
              <Link href="/admin/members" className="btn btn-sm btn-outline-primary mt-4">
                Бүх гишүүдийг харах
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted mb-0">Нийтлэгдсэн мэдээ</h6>
                  <h2 className="mt-2 mb-0">{newsPublished}</h2>
                </div>
                <div className="bg-light rounded-circle p-3">
                  <i className="fas fa-newspaper fa-2x text-primary" />
                </div>
              </div>
              <Link href="/admin/news" className="btn btn-sm btn-outline-primary mt-4">
                Бүх мэдээг харах
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card dashboard-card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-muted mb-0">Ноорог мэдээ</h6>
                  <h2 className="mt-2 mb-0">{newsDraft}</h2>
                </div>
                <div className="bg-light rounded-circle p-3">
                  <i className="fas fa-edit fa-2x text-primary" />
                </div>
              </div>
              <Link href="/admin/news?status=draft" className="btn btn-sm btn-outline-primary mt-4">
                Ноорог харах
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-12">
          <h5 className="text-muted small text-uppercase mb-3">BNI платформ</h5>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <h6 className="text-muted mb-0">Бүлгүүд</h6>
              <h2 className="mt-2 mb-0">{chapterCount}</h2>
              <Link href="/admin/bni-chapters" className="btn btn-sm btn-outline-primary mt-3">
                Удирдах
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-body">
              <h6 className="text-muted mb-0">Ирээдүйн хурал</h6>
              <h2 className="mt-2 mb-0">{eventUpcoming}</h2>
              <Link href="/admin/bni-events" className="btn btn-sm btn-outline-primary mt-3">
                Хурал
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Сүүлийн гишүүд</h5>
              <Link href="/admin/members" className="btn btn-sm btn-outline-primary">
                Бүгдийг харах
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Нэр</th>
                      <th>Байгууллага</th>
                      <th>Чиглэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-muted px-3 py-3">
                          Мэдээлэл байхгүй
                        </td>
                      </tr>
                    ) : (
                      recentMembers.map((m) => (
                        <tr key={m.id}>
                          <td>{m.name}</td>
                          <td>{m.company ?? "—"}</td>
                          <td>{m.industry ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Сүүлийн мэдээ</h5>
              <Link href="/admin/news" className="btn btn-sm btn-outline-primary">
                Бүгдийг харах
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Гарчиг</th>
                      <th>Төлөв</th>
                      <th>Огноо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentNews.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-muted px-3 py-3">
                          Мэдээлэл байхгүй
                        </td>
                      </tr>
                    ) : (
                      recentNews.map((n) => (
                        <tr key={n.id}>
                          <td>{n.title}</td>
                          <td>{n.status}</td>
                          <td className="small">{n.createdAt.toISOString().slice(0, 10)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
