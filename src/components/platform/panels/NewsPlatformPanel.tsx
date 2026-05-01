import Link from "next/link";

/** PHP `?panel=news` — формын үндсэн блокууд (Summernote ба хадгалалт удахгүй). */

export default function NewsPlatformPanel() {
  return (
    <>
      <div className="tps-greeting">Мэдээний удирдлага</div>
      <div className="text-muted small mb-4">Компанийн мэдээний агуулгыг удирдаж, нийтлэлийн гүйцэтгэлийг хянаарай.</div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex gap-2">
          <button type="button" className="nws-btn nws-btn-primary" disabled>
            <i className="fa-solid fa-plus" /> Шинэ мэдээ нийтлэх
          </button>
          <button type="button" className="nws-btn nws-btn-outline" disabled>
            <i className="fa-solid fa-file-import" /> Импортлох
          </button>
        </div>
        <Link href="/news" className="small text-primary text-decoration-none fw-semibold">
          Нийтийн мэдээний хуудас →
        </Link>
      </div>

      <div className="nws-grid">
        <div className="nws-main">
          <div className="nws-card">
            <div className="nws-card-title">Шинэ мэдээ нийтлэх</div>
            <div className="row g-3">
              <div className="col-md-12">
                <label className="nws-label">
                  Гарчиг <abbr title="Заавал">*</abbr>
                </label>
                <input type="text" name="news_title" className="nws-input" placeholder="Жагсаалтанд харагдах гарчиг" disabled />
              </div>
              <div className="col-md-6">
                <label className="nws-label">Slug (URL)</label>
                <div className="nws-input-group">
                  <i className="fa-solid fa-link nws-input-icon" />
                  <input type="text" className="nws-input has-icon nws-slug-input" placeholder="slug-oruulna" disabled />
                </div>
              </div>
              <div className="col-md-6">
                <label className="nws-label">Эх сурвалж URL</label>
                <div className="nws-input-group">
                  <i className="fa-solid fa-globe nws-input-icon" />
                  <input type="text" className="nws-input has-icon" placeholder="https://" disabled />
                </div>
              </div>
              <div className="col-12">
                <label className="nws-label">Товч тайлбар (excerpt)</label>
                <textarea className="nws-input" rows={3} placeholder="Товч тойм..." disabled />
              </div>
              <div className="col-12">
                <label className="nws-label">Нийтлэлийн агуулга</label>
                <textarea id="platform_news_body" className="form-control rounded-3" rows={10} placeholder="Агуулга (удахгийн Summernote)" disabled />
              </div>
            </div>
          </div>
        </div>
        <div className="nws-sidebar">
          <div className="nws-publish-card">
            <div className="nws-publish-body">
              <div className="fw-bold small text-muted text-uppercase mb-3">Нийтлэх</div>
              <p className="small text-muted mb-0">Төлөв сонголт, хуваарь зэрэг нэмэлт талбарууд PHP-тай адилхан шилжүүлнэ.</p>
            </div>
            <div className="nws-publish-footer">
              <button type="button" className="nws-btn nws-btn-primary w-100" disabled>
                Нийтлэх
              </button>
              <button type="button" className="nws-btn nws-btn-outline w-100" disabled>
                Ноороглох
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="nws-table-card mt-4">
        <div className="nws-table-header">
          <span className="fw-bold small text-uppercase text-muted">Нийтлэлүүдийн жагсаалт</span>
        </div>
        <div className="table-responsive">
          <table className="table nws-table mb-0">
            <thead>
              <tr>
                <th>Зураг</th>
                <th>Гарчиг</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="text-center py-5 text-muted">
                  Жагсаалт хоосон — хадгалах API холбогдоогүй байна.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
