import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold">Тойм мэдээлэл</h3>
        <div className="d-flex gap-2">
          <Link href="/dashboard/trips" className="btn btn-primary d-flex align-items-center gap-2">
            <i className="fa-solid fa-plus"></i>
            <span className="d-none d-sm-inline">Аялал үүсгэх</span>
          </Link>
          <Link href="/dashboard/events/create" className="btn btn-outline-primary d-flex align-items-center gap-2">
            <i className="fa-solid fa-plus"></i>
            <span className="d-none d-sm-inline">Эвент үүсгэх</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="platform-stat-card bg-white p-3 p-md-4 rounded shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="text-muted small fw-medium text-uppercase tracking-wide">Нийт аялал</div>
              <div className="bg-primary bg-opacity-10 text-primary rounded p-2 lh-1">
                <i className="fa-solid fa-paper-plane"></i>
              </div>
            </div>
            <div className="fs-2 fw-bold mb-1">0</div>
            <div className="text-success small d-flex align-items-center gap-1">
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>Энэ сард шинээр алга</span>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="platform-stat-card bg-white p-3 p-md-4 rounded shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="text-muted small fw-medium text-uppercase tracking-wide">Хурал, эвент</div>
              <div className="bg-info bg-opacity-10 text-info rounded p-2 lh-1">
                <i className="fa-solid fa-calendar-days"></i>
              </div>
            </div>
            <div className="fs-2 fw-bold mb-1">0</div>
            <div className="text-muted small">Идэвхтэй эвентүүд</div>
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="platform-stat-card bg-white p-3 p-md-4 rounded shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="text-muted small fw-medium text-uppercase tracking-wide">Нийт бүртгэл</div>
              <div className="bg-warning bg-opacity-10 text-warning rounded p-2 lh-1">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <div className="fs-2 fw-bold mb-1">0</div>
            <div className="text-muted small">Хүлээгдэж буй 0</div>
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="platform-stat-card bg-white p-3 p-md-4 rounded shadow-sm border-0 h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="text-muted small fw-medium text-uppercase tracking-wide">Нийт орлого</div>
              <div className="bg-success bg-opacity-10 text-success rounded p-2 lh-1">
                <i className="fa-solid fa-wallet"></i>
              </div>
            </div>
            <div className="fs-3 fw-bold mb-1">₮0</div>
            <div className="text-success small d-flex align-items-center gap-1">
              <i className="fa-solid fa-arrow-trend-up"></i>
              <span>Энэ сар</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Registrations */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Сүүлийн бүртгэлүүд</h5>
              <Link href="/dashboard/registrations" className="btn btn-sm btn-light">Бүгд</Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small">
                    <tr>
                      <th className="fw-medium border-0 rounded-start">ID</th>
                      <th className="fw-medium border-0">Нэр</th>
                      <th className="fw-medium border-0">Арга хэмжээ</th>
                      <th className="fw-medium border-0">Огноо</th>
                      <th className="fw-medium border-0 text-end rounded-end">Төлөв</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        <div className="mb-2"><i className="fa-solid fa-inbox fs-3 opacity-50"></i></div>
                        Бүртгэл олдсонгүй
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="mb-0 fw-bold">Хурдан холбоос</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                <Link href="/dashboard/trips" className="d-flex align-items-center gap-3 p-3 rounded bg-light text-decoration-none text-dark hover-bg-gray transition">
                  <div className="bg-white rounded p-2 shadow-sm text-primary">
                    <i className="fa-solid fa-paper-plane fa-fw"></i>
                  </div>
                  <div>
                    <div className="fw-semibold">Аялал удирдах</div>
                    <div className="small text-muted">Аялал нэмэх, засах, устгах</div>
                  </div>
                  <i className="fa-solid fa-chevron-right ms-auto opacity-50 small"></i>
                </Link>
                
                <Link href="/dashboard/events" className="d-flex align-items-center gap-3 p-3 rounded bg-light text-decoration-none text-dark hover-bg-gray transition">
                  <div className="bg-white rounded p-2 shadow-sm text-info">
                    <i className="fa-solid fa-calendar-days fa-fw"></i>
                  </div>
                  <div>
                    <div className="fw-semibold">Эвент удирдах</div>
                    <div className="small text-muted">Хурал эвент нэмэх, засах</div>
                  </div>
                  <i className="fa-solid fa-chevron-right ms-auto opacity-50 small"></i>
                </Link>

                <Link href="/dashboard/payments" className="d-flex align-items-center gap-3 p-3 rounded bg-light text-decoration-none text-dark hover-bg-gray transition">
                  <div className="bg-white rounded p-2 shadow-sm text-success">
                    <i className="fa-solid fa-credit-card fa-fw"></i>
                  </div>
                  <div>
                    <div className="fw-semibold">Төлбөр шалгах</div>
                    <div className="small text-muted">QPay болон дансны гүйлгээ</div>
                  </div>
                  <i className="fa-solid fa-chevron-right ms-auto opacity-50 small"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
