import Link from "next/link";

/** PHP `?panel=opportunities` — статистик ба хоосон жагсаалтын хэлбэр. */

export default function OpportunitiesPlatformPanel() {
  const statPostedOpp = 0;
  const statSentApps = 0;
  const statIncomingApps = 0;
  const pendingHint = 0;

  return (
    <>
      <div className="alert alert-warning border-0 rounded-3 mb-4">
        Олон улсын боломжийн хүснэгтүүд (`bni_business_opportunities` гэх мэт) суурь баазад байхгүй бол энэ хэсэг хязгаарлагдана.
      </div>

      <div className="tps-greeting">Хөрөнгө оруулалт & боломжууд</div>
      <div className="text-muted small mb-4">Таны бизнес боломжууд болон холбогдох хүсэлтүүд.</div>

      <div className="ops-stat-grid">
        <Link href="/investments" className="ops-stat-card text-decoration-none">
          <div className="ops-stat-icon blue">
            <i className="fa-regular fa-file-lines" />
          </div>
          <div>
            <span className="ops-stat-label">Миний нийтэлсэн</span>
            <div className="ops-stat-value">{statPostedOpp}</div>
            <div className="ops-stat-meta">
              Нийт нийтэлсэн <i className="fa-solid fa-chevron-right ms-1 small" />
            </div>
          </div>
        </Link>
        <Link href="/investments" className="ops-stat-card text-decoration-none">
          <div className="ops-stat-icon orange">
            <i className="fa-regular fa-paper-plane" />
          </div>
          <div>
            <span className="ops-stat-label">Илгээсэн өргөдөл</span>
            <div className="ops-stat-value">{statSentApps}</div>
            <div className="ops-stat-meta">
              Нийт илгээсэн <i className="fa-solid fa-chevron-right ms-1 small" />
            </div>
          </div>
        </Link>
        <Link href="/investments" className="ops-stat-card text-decoration-none">
          <div className="ops-stat-icon green">
            <i className="fa-regular fa-comments" />
          </div>
          <div>
            <span className="ops-stat-label">Ирсэн хүсэлт</span>
            <div className="ops-stat-value">{statIncomingApps}</div>
            <div className="ops-stat-meta">
              Шинэ <b className="text-success">{pendingHint}</b> <i className="fa-solid fa-chevron-right ms-1 small" />
            </div>
          </div>
        </Link>
      </div>

      <div className="ops-grid mt-4">
        <div>
          <div className="ops-content-card">
            <div className="text-center py-5">
              <div className="ops-stat-icon blue mx-auto mb-3" style={{ width: 80, height: 80, fontSize: "2rem" }}>
                <i className="fa-regular fa-lightbulb" />
              </div>
              <h3 className="h6 fw-bold">Одоогоор боломж нийтлээгүй байна</h3>
              <p className="text-muted small mb-3">Шинэ боломж нийтэлж хамтын ажиллагаагаа эхлүүлээрэй.</p>
              <Link href="/investments" className="btn btn-primary btn-sm rounded-pill px-4">
                Хөрөнгө оруулалтын хуудас
              </Link>
            </div>
          </div>
        </div>
        <div style={{ width: 340, maxWidth: "100%" }}>
          <div className="ops-sidebar-card">
            <Link href="/investments" className="ops-new-btn">
              <i className="fa-solid fa-plus" /> Шинэ боломж үүсгэх
            </Link>
            <div className="small text-muted">Удахгүй энд ирсэн хүсэлтүүдийн жагсаалт харагдана.</div>
          </div>
        </div>
      </div>
    </>
  );
}
