/** PHP `?panel=jobs` — формын гол хэсэг (ажлын зар хадгалах удахгүй). */

export default function JobsPlatformPanel() {
  return (
    <>
      <div className="tps-greeting">Ажлын зар</div>
      <div className="text-muted small mb-4">Ажлын байр нийтлэх, удирдах, үр дүнг хянах.</div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button type="button" className="jbs-btn-primary" disabled>
          <i className="fa-solid fa-plus" /> Ажлын зар нийтлэх
        </button>
      </div>

      <div className="jbs-grid">
        <div className="jbs-main">
          <div className="jbs-card">
            <div className="jbs-card-title">Шинэ ажлын зар үүсгэх</div>

            <div className="jbs-form-row two-col">
              <div className="jbs-form-group">
                <label className="jbs-label">
                  Ажлын байрны нэр <abbr>*</abbr>
                </label>
                <input type="text" name="job_title" className="jbs-input" placeholder="Жишээ: Маркетинг менежер" disabled />
              </div>
              <div className="jbs-form-group">
                <label className="jbs-label">
                  Байршил <abbr>*</abbr>
                </label>
                <div className="jbs-input-group">
                  <i className="fa-solid fa-location-dot jbs-input-icon" />
                  <input type="text" className="jbs-input has-icon" placeholder="Байршлыг оруулна уу" disabled />
                </div>
              </div>
            </div>

            <div className="jbs-form-row two-col">
              <div className="jbs-form-group">
                <label className="jbs-label">Ажлын байрны төрөл</label>
                <select name="job_type" className="jbs-select" disabled defaultValue="office">
                  <option value="office">Оффис</option>
                  <option value="remote">Зайнаас</option>
                  <option value="hybrid">Холимог</option>
                </select>
              </div>
              <div className="jbs-form-group">
                <label className="jbs-label">Ажиллах хэлбэр</label>
                <select name="job_work_mode" className="jbs-select" disabled defaultValue="fulltime">
                  <option value="fulltime">Бүтэн цаг</option>
                  <option value="parttime">Хагас цаг</option>
                  <option value="contract">Гэрээт</option>
                </select>
              </div>
            </div>

            <div className="jbs-form-group mb-4">
              <label className="jbs-label">
                Ажлын байрны товч тайлбар <abbr>*</abbr>
              </label>
              <textarea name="job_description" className="jbs-input" rows={4} placeholder="Тайлбар..." disabled />
            </div>

            <div className="text-end">
              <button type="button" className="jbs-btn-primary" disabled>
                Хадгалах
              </button>
            </div>
          </div>
        </div>
        <div className="jbs-sidebar">
          <div className="jbs-stat-grid mb-3">
            <div className="jbs-stat-card">
              <div className="jbs-stat-icon blue">
                <i className="fa-solid fa-briefcase" />
              </div>
              <div className="jbs-stat-info">
                <span className="jbs-stat-lbl">Идэвхтэй зар</span>
                <span className="jbs-stat-val">0</span>
              </div>
            </div>
            <div className="jbs-stat-card">
              <div className="jbs-stat-icon green">
                <i className="fa-solid fa-user-check" />
              </div>
              <div className="jbs-stat-info">
                <span className="jbs-stat-lbl">Аплай</span>
                <span className="jbs-stat-val">0</span>
              </div>
            </div>
          </div>
          <div className="jbs-tip-card">
            <div className="jbs-tip-icon">
              <i className="fa-solid fa-circle-info" />
            </div>
            <div className="jbs-tip-content">
              Зарыг бүрэн бөглөж, цалин болон давуу талаа тодорхой бичвэл илүү олон өргөдөл ирнэ.
            </div>
          </div>
        </div>
      </div>

      <div className="jbs-table-card mt-4">
        <div className="jbs-table-header">
          <span className="fw-bold small">Нийтлэгдсэн зарууд</span>
        </div>
        <table className="table jbs-table mb-0">
          <thead>
            <tr>
              <th>Ажлын байр</th>
              <th>Байршил</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="text-center py-5 text-muted">
                Жагсаалт хоосон.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
