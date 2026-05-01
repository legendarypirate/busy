/** PHP `?panel=shop` — статистик ба формын хэлбэр (`company_store_items` хүснэгт Next-д удахгүй). */

export default function ShopPlatformPanel() {
  const totalItems = 0;
  const activeItems = 0;
  const incomingOrdersCount = 0;
  const totalViews = 0;

  return (
    <>
      <div className="ps-hero mb-4">
        <div className="ps-hero-icon">
          <i className="fa-solid fa-store" />
        </div>
        <div>
          <h2 className="h4 fw-bold mb-1">Дэлгүүрийн удирдлага</h2>
          <p className="mb-0 small opacity-75">Бүтээгдэхүүнээ удирдаж, борлуулалтаа өсгө.</p>
        </div>
      </div>

      <div className="ps-stats-grid">
        <div className="ps-stat-card">
          <div className="ps-stat-icon blue">
            <i className="fa-solid fa-box" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Нийт бүтээгдэхүүн</span>
            <span className="ps-stat-value">{totalItems.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">+ 12 энэ сарын</span>
          </div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-icon green">
            <i className="fa-solid fa-circle-check" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Идэвхтэй бүтээгдэхүүн</span>
            <span className="ps-stat-value">{activeItems.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">+ 8 энэ сарын</span>
          </div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-icon purple">
            <i className="fa-solid fa-cart-shopping" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Ирсэн захиалга</span>
            <span className="ps-stat-value">{incomingOrdersCount.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">
              <a href="/platform/shop_orders_in" className="text-decoration-none opacity-75">
                Жагсаалт үзэх
              </a>
            </span>
          </div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-icon orange">
            <i className="fa-solid fa-eye" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Нийт үзэлт</span>
            <span className="ps-stat-value">{totalViews.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">+ 22% энэ сарын</span>
          </div>
        </div>
      </div>

      <div className="pm-card mb-4">
        <div className="pm-card-header">
          <i className="fa-solid fa-plus-circle" />
          <div>
            <div className="pm-card-title">Бүтээгдэхүүн нэмэх</div>
            <div className="pm-card-subtitle">Шинэ бүтээгдэхүүний мэдээлэл оруулна уу.</div>
          </div>
        </div>
        <div className="pm-card-body">
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="pm-form-grid">
                <div className="pm-form-group">
                  <label className="pm-label">
                    Бүтээгдэхүүний нэр <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="pm-input" placeholder="Нэр оруулна уу" disabled />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">
                    Үнэ (₮) <span className="text-danger">*</span>
                  </label>
                  <input type="text" className="pm-input" placeholder="0.00" disabled />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <label className="pm-label mb-2">Бүтээгдэхүүний зураг</label>
              <div className="pm-upload-box mb-3" style={{ borderStyle: "dashed", padding: 30 }}>
                <i className="fa-solid fa-cloud-arrow-up text-primary fs-2 mb-2" />
                <div className="small fw-bold">Зураг оруулах эсвэл чирч оруулна уу</div>
                <div className="pm-upload-info">JPG, PNG, WEBP - Макс. 10MB</div>
              </div>
            </div>
            <div className="col-12 text-end">
              <button type="button" className="pm-btn-primary d-inline-flex px-4" disabled>
                Бүтээгдэхүүн хадгалах
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ps-table-card">
        <div className="pm-card-header justify-content-between">
          <div className="pm-card-title">Миний бүтээгдэхүүнүүд</div>
        </div>
        <div className="table-responsive">
          <table className="table ps-table align-middle mb-0">
            <thead>
              <tr>
                <th>Зураг</th>
                <th>Бүтээгдэхүүний нэр</th>
                <th>Ангилал</th>
                <th>Үнэ (₮)</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  Одоогоор бараа байхгүй (суурь өгөгдлийн хүснэгт тохируулаагүй байна).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
