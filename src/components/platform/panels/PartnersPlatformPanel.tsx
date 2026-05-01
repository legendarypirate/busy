/** PHP `?panel=partners` UI shell — backend хүснэгт (`company_profile_partners`) удахгүй Prisma-д холбогдох болно. */

export default function PartnersPlatformPanel() {
  const totalPartners = 0;
  const activePartners = 0;
  const strategicPartners = 0;
  const avgRating = 0;

  return (
    <>
      <div className="pts-hero mb-4">
        <div className="pts-hero-icon">
          <i className="fa-solid fa-handshake" />
        </div>
        <div>
          <h2 className="h4 fw-bold mb-1">Түншлэл</h2>
          <p className="mb-0 small text-muted">Түншүүдтэй хамтын ажиллагаагаа удирдаж, мэдээллийг нэг дороос хялбар хянаарай.</p>
        </div>
      </div>

      <div className="pts-stats-grid">
        <div className="pts-stat-card">
          <div className="pts-stat-icon blue">
            <i className="fa-solid fa-users" />
          </div>
          <div className="pts-stat-info">
            <span className="pts-stat-label">Нийт түнш</span>
            <span className="pts-stat-value">{totalPartners}</span>
            <span className="pts-stat-meta">
              Бүгдтэй харьцсан өсөлт <b>+12%</b>
            </span>
          </div>
        </div>
        <div className="pts-stat-card">
          <div className="pts-stat-icon green">
            <i className="fa-solid fa-circle-check" />
          </div>
          <div className="pts-stat-info">
            <span className="pts-stat-label">Идэвхтэй түнш</span>
            <span className="pts-stat-value">{activePartners}</span>
          </div>
        </div>
        <div className="pts-stat-card">
          <div className="pts-stat-icon orange">
            <i className="fa-solid fa-star" />
          </div>
          <div className="pts-stat-info">
            <span className="pts-stat-label">Стратегийн түнш</span>
            <span className="pts-stat-value">{strategicPartners}</span>
          </div>
        </div>
        <div className="pts-stat-card">
          <div className="pts-stat-icon purple">
            <i className="fa-solid fa-chart-line" />
          </div>
          <div className="pts-stat-info">
            <span className="pts-stat-label">Нийт үнэлгээ (дундажаар)</span>
            <span className="pts-stat-value">{avgRating.toFixed(1)} / 5</span>
          </div>
        </div>
      </div>

      <div className="pm-card mb-4">
        <div className="pm-card-header">
          <i className="fa-solid fa-plus-circle" />
          <div>
            <div className="pm-card-title">ШИНЭ ТҮНШ НЭМЭХ</div>
            <div className="pm-card-subtitle">Шинэ түншлэлийн мэдээлэл оруулна уу.</div>
          </div>
        </div>
        <div className="pm-card-body">
          <div className="row g-4">
            <div className="col-md-4">
              <label className="pm-label">
                Байгууллагын нэр <span className="text-danger">*</span>
              </label>
              <input type="text" className="pm-input" placeholder="Байгууллагын нэрийг оруулна уу" disabled />
            </div>
            <div className="col-md-3">
              <label className="pm-label">
                Түншлэлийн төрөл <span className="text-danger">*</span>
              </label>
              <select className="pm-select" disabled defaultValue="partner">
                <option value="partner">Стратегийн түнш</option>
                <option value="contract">Хамтын түнш</option>
                <option value="other">Бусад</option>
              </select>
            </div>
            <div className="col-md-5">
              <label className="pm-label">Тэмдэглэл</label>
              <textarea className="pm-input" rows={2} placeholder="Удахгүй хадгалагдана" disabled />
            </div>
            <div className="col-12 text-end">
              <button type="button" className="pm-btn-secondary d-inline-flex px-4 me-2" disabled>
                Цуцлах
              </button>
              <button type="button" className="pm-btn-primary d-inline-flex px-4" disabled>
                Түнш нэмэх
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ps-table-card">
        <div className="pm-card-header justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="pm-card-title">ТҮНШИЙН ЖАГСААЛТ</div>
            <span className="badge bg-primary rounded-pill px-2 py-1" style={{ fontSize: "0.65rem" }}>
              {totalPartners}
            </span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table pts-table align-middle mb-0">
            <thead>
              <tr>
                <th>Лого</th>
                <th>Байгууллагын нэр</th>
                <th>Түншлэлийн төрөл</th>
                <th>Салбар</th>
                <th>Хамтын ажиллагаа эхэлсэн</th>
                <th>Үнэлгээ</th>
                <th>Төлөв</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="text-center py-5 text-muted">
                  Түншлэлийн мэдээлэл байхгүй байна.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
