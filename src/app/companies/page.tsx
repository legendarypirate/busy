import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CompaniesPage({ searchParams }: { searchParams: { kw?: string } }) {
  const compKw = searchParams.kw?.trim() || "";
  const compMailto = "mailto:info@busy.mn";
  const compLogin = "/auth/login";
  const compResultsHref = "/companies#factory-results";

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Hero Section */}
      <section className="pt-5 pb-4" style={{ background: "url('/assets/img/busy-background.png') no-repeat center top", backgroundSize: "cover", position: "relative" }}>
        {/* Light overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.85)", zIndex: 1 }}></div>
        
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Үйлдвэр холболт</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Хятад, Солонгос болон бусад зах зээлээс үйлдвэрлэгч, ханган нийлүүлэгч, OEM түнш олох</p>

          {/* Search Bar */}
          <form className="factory-search-box" method="get" action="/companies">
            <i className="fa-solid fa-magnifying-glass ms-3" style={{ color: "var(--text-muted)" }}></i>
            <input type="text" className="factory-search-input" name="kw" defaultValue={compKw} placeholder="Бараа, үйлдвэр, улс, хот, MOQ хайх..." />
            <select className="factory-search-select" name="country">
              <option value="">Бүх улс</option>
              <option value="cn">БНХАУ</option>
              <option value="kr">БНСУ</option>
              <option value="vn">Вьетнам</option>
            </select>
            <button type="submit" className="btn-brand factory-search-btn">Хайх</button>
          </form>

          {/* Top Category Cards */}
          <div className="top-category-cards">
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-solid fa-industry"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">Үйлдвэрүүд</div>
                <div className="top-category-desc">Үйлдвэрлэгч компаниудыг хайх</div>
              </div>
            </Link>
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-regular fa-user"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">Ханган нийлүүлэгчид</div>
                <div className="top-category-desc">Бараа нийлүүлэгчдийг олох</div>
              </div>
            </Link>
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-solid fa-gear"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">OEM/ODM</div>
                <div className="top-category-desc">OEM/ODM түншүүдтэй холбогдох</div>
              </div>
            </Link>
            <Link href={compResultsHref} className="top-category-card">
              <div className="top-category-icon"><i className="fa-solid fa-bullseye"></i></div>
              <div className="top-category-text">
                <div className="top-category-title">Сүүлийн match</div>
                <div className="top-category-desc">Танд санал болгосон matches</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="container factories-layout">
        
        {/* Left Sidebar: Filter */}
        <aside className="factories-sidebar-left">
          <div className="factory-widget">
            <h3 className="factory-widget-title">Шүүлтүүр <span style={{ fontSize: "0.75rem", color: "var(--text-light)", cursor: "pointer", fontWeight: "normal" }}>Дахин тохируулах</span></h3>
            <form>
              <div className="filter-item">
                <label className="filter-item-label">Улс</label>
                <select className="filter-select-sm">
                  <option value="">Бүх улс</option>
                  <option value="cn">Хятад</option>
                  <option value="kr">Солонгос</option>
                  <option value="vn">Вьетнам</option>
                </select>
              </div>
              
              <div className="filter-item">
                <label className="filter-item-label">Салбар</label>
                <select className="filter-select-sm">
                  <option value="">Бүх салбар</option>
                  <option value="electronics">Электроник</option>
                  <option value="machinery">Тоног төхөөрөмж</option>
                  <option value="textile">Нэхмэл</option>
                </select>
              </div>
              
              <div className="filter-item">
                <label className="filter-item-label">MOQ (нэгж)</label>
                <div className="min-max-inputs">
                  <input type="number" className="filter-input-sm" placeholder="Мин" />
                  <span>-</span>
                  <input type="number" className="filter-input-sm" placeholder="Макс" />
                </div>
              </div>
              
              <div className="filter-item">
                <label className="filter-item-label">Үнийн хүрээ (USD)</label>
                <div className="min-max-inputs">
                  <input type="number" className="filter-input-sm" placeholder="Мин" />
                  <span>-</span>
                  <input type="number" className="filter-input-sm" placeholder="Макс" />
                </div>
              </div>
              
              <div className="filter-item">
                <label className="filter-item-label d-flex justify-content-between align-items-center">
                  Сертификат <i className="fa-solid fa-chevron-up text-muted"></i>
                </label>
                <ul className="checkbox-list">
                  <li><label><input type="checkbox" defaultChecked /> ISO 9001</label></li>
                  <li><label><input type="checkbox" /> CE</label></li>
                  <li><label><input type="checkbox" /> RoHS</label></li>
                  <li><label><input type="checkbox" /> FDA</label></li>
                  <li><label><input type="checkbox" /> BSCI</label></li>
                </ul>
              </div>

              <div className="toggle-switch-wrapper">
                <span className="toggle-switch-label">Баталгаажсан эсэх<br /><span className="text-muted" style={{ fontSize: "0.7rem", fontWeight: "normal" }}>Verified supplier</span></span>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="filter-item">
                <label className="filter-item-label d-flex justify-content-between align-items-center">
                  Үйлдвэрлэлийн төрөл <i className="fa-solid fa-chevron-up text-muted"></i>
                </label>
                <ul className="checkbox-list">
                  <li><label><input type="checkbox" defaultChecked /> Standard</label></li>
                  <li><label><input type="checkbox" /> Custom (Tailor-made)</label></li>
                  <li><label><input type="checkbox" /> Private Label</label></li>
                  <li><label><input type="checkbox" /> OEM</label></li>
                  <li><label><input type="checkbox" /> ODM</label></li>
                </ul>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-4">
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>1,248 үр дүн</span>
                <button type="button" className="btn-brand px-4 py-1">Шүүх</button>
              </div>
            </form>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="factories-main-content">
          
          {/* Featured Partner Card */}
          <div id="featured-factory-partner" className="featured-partner-card">
            <div className="featured-partner-img-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80" alt="Shenzhen TopTech" className="featured-partner-img" />
              <div className="verified-badge-overlay"><i className="fa-solid fa-circle-check text-primary"></i> Verified</div>
            </div>
            <div className="featured-partner-info">
              <div className="d-flex justify-content-between align-items-start">
                <h2 className="featured-partner-title">Shenzhen TopTech Electronics Co., Ltd.</h2>
                <button className="btn btn-link text-muted p-0"><i className="fa-regular fa-heart"></i></button>
              </div>
              <div className="featured-partner-meta">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://flagcdn.com/w20/cn.png" alt="CN" /> Хятад, Шэньжэнь
              </div>
              <div style={{ fontSize: "0.8rem", marginBottom: "1rem" }}><span className="text-muted">Салбар:</span> Электроник, Ухаалаг төхөөрөмж</div>
              <div className="featured-partner-stats">
                <div className="featured-partner-stat-item">
                  <div className="label">MOQ</div>
                  <div className="val">500 ширхэг</div>
                </div>
                <div className="featured-partner-stat-item">
                  <div className="label">Сертификат</div>
                  <div className="val d-flex gap-1">
                    <span className="badge border text-dark">ISO 9001</span>
                    <span className="badge border text-dark">CE</span>
                    <span className="badge border text-dark">RoHS</span>
                  </div>
                </div>
                <div className="featured-partner-stat-item">
                  <div className="label">Хариу өгөх хувь</div>
                  <div className="val">98%</div>
                </div>
                <div className="featured-partner-stat-item">
                  <div className="label">Дундаж хариу өгөх</div>
                  <div className="val">≤ 2 цаг</div>
                </div>
              </div>
            </div>
            <div className="featured-partner-actions">
              <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.8rem" }}>Профайл харах</Link>
              <a href={compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.8rem" }}>Холбогдох</a>
            </div>
          </div>

          {/* Results List */}
          <div className="results-header">
            <div className="results-title">Үр дүнгийн жагсаалт{compKw !== "" ? ` — «${compKw}»` : ""}</div>
            <div className="results-sort-bar">
              <select className="sort-select">
                <option>Эрэмбэлэх: Холбогдох байдал</option>
              </select>
              <div className="view-toggles">
                <div className="view-btn"><i className="fa-solid fa-list"></i></div>
                <div className="view-btn active"><i className="fa-solid fa-border-all"></i></div>
              </div>
            </div>
          </div>

          <div id="factory-results" className="results-list">
            <div className="result-list-item">
              <div className="result-item-icon"><i className="fa-solid fa-leaf"></i></div>
              <div className="result-item-info">
                <div className="result-item-title">Qingdao GreenHome Textile Co., Ltd.</div>
                <div className="result-item-loc">Хятад, Циндао • Нэхмэл, Гэр ахуйн бүтээгдэхүүн</div>
              </div>
              <div className="result-item-stats">
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>MOQ</div>
                  <div className="font-semibold">1,000 ширхэг</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Lead time</div>
                  <div className="font-semibold">15-25 хоног</div>
                </div>
              </div>
              <div className="result-item-badge">
                <i className="fa-solid fa-check text-primary"></i> Verified
              </div>
              <div className="result-item-actions">
                <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Профайл харах</Link>
                <a href={compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Холбогдох</a>
              </div>
              <button className="btn btn-link text-muted p-0 ms-2"><i className="fa-regular fa-heart"></i></button>
            </div>

            <div className="result-list-item">
              <div className="result-item-icon"><i className="fa-solid fa-gears"></i></div>
              <div className="result-item-info">
                <div className="result-item-title">Busan Modern Machinery Co., Ltd.</div>
                <div className="result-item-loc">БНСУ, Бусан • Машин тоног төхөөрөмж</div>
              </div>
              <div className="result-item-stats">
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>MOQ</div>
                  <div className="font-semibold">1 ширхэг</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Lead time</div>
                  <div className="font-semibold">30-45 хоног</div>
                </div>
              </div>
              <div className="result-item-badge">
                <i className="fa-solid fa-check text-primary"></i> Verified
              </div>
              <div className="result-item-actions">
                <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Профайл харах</Link>
                <a href={compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Холбогдох</a>
              </div>
              <button className="btn btn-link text-muted p-0 ms-2"><i className="fa-regular fa-heart"></i></button>
            </div>

            <div className="result-list-item">
              <div className="result-item-icon"><i className="fa-solid fa-box-open"></i></div>
              <div className="result-item-info">
                <div className="result-item-title">Ningbo Bright Plastic Co., Ltd.</div>
                <div className="result-item-loc">Хятад, Нинбо • Хуванцар бүтээгдэхүүн</div>
              </div>
              <div className="result-item-stats">
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>MOQ</div>
                  <div className="font-semibold">2,000 ширхэг</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Lead time</div>
                  <div className="font-semibold">10-20 хоног</div>
                </div>
              </div>
              <div className="result-item-badge">
                <i className="fa-solid fa-check text-primary"></i> Verified
              </div>
              <div className="result-item-actions">
                <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Профайл харах</Link>
                <a href={compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Холбогдох</a>
              </div>
              <button className="btn btn-link text-muted p-0 ms-2"><i className="fa-regular fa-heart"></i></button>
            </div>

            <div className="result-list-item">
              <div className="result-item-icon"><i className="fa-solid fa-spray-can"></i></div>
              <div className="result-item-info">
                <div className="result-item-title">Seoul Beauty Lab Co., Ltd.</div>
                <div className="result-item-loc">БНСУ, Сөүл • Гоо сайхан, арьс арчилгаа</div>
              </div>
              <div className="result-item-stats">
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>MOQ</div>
                  <div className="font-semibold">500 ширхэг</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Lead time</div>
                  <div className="font-semibold">20-30 хоног</div>
                </div>
              </div>
              <div className="result-item-badge">
                <i className="fa-solid fa-check text-primary"></i> Verified
              </div>
              <div className="result-item-actions">
                <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Профайл харах</Link>
                <a href={compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Холбогдох</a>
              </div>
              <button className="btn btn-link text-muted p-0 ms-2"><i className="fa-regular fa-heart"></i></button>
            </div>

            <div className="result-list-item">
              <div className="result-item-icon"><i className="fa-regular fa-lightbulb"></i></div>
              <div className="result-item-info">
                <div className="result-item-title">Guangzhou Sunway Lighting Co., Ltd.</div>
                <div className="result-item-loc">Хятад, Гуанжоу • Гэрэлтүүлэг</div>
              </div>
              <div className="result-item-stats">
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>MOQ</div>
                  <div className="font-semibold">300 ширхэг</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Lead time</div>
                  <div className="font-semibold">15-25 хоног</div>
                </div>
              </div>
              <div className="result-item-badge">
                <i className="fa-solid fa-check text-primary"></i> Verified
              </div>
              <div className="result-item-actions">
                <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Профайл харах</Link>
                <a href={compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Холбогдох</a>
              </div>
              <button className="btn btn-link text-muted p-0 ms-2"><i className="fa-regular fa-heart"></i></button>
            </div>

            <div className="result-list-item">
              <div className="result-item-icon"><i className="fa-solid fa-chair"></i></div>
              <div className="result-item-info">
                <div className="result-item-title">Vietnam Smart Furniture JSC.</div>
                <div className="result-item-loc">Вьетнам, Хошимин • Тавилга</div>
              </div>
              <div className="result-item-stats">
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>MOQ</div>
                  <div className="font-semibold">10 ширхэг</div>
                </div>
                <div>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Lead time</div>
                  <div className="font-semibold">25-35 хоног</div>
                </div>
              </div>
              <div className="result-item-badge">
                <i className="fa-solid fa-check text-primary"></i> Verified
              </div>
              <div className="result-item-actions">
                <Link href={compLogin} className="btn-brand-outline w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Профайл харах</Link>
                <a href={compMailto} className="btn-brand w-100 py-1 text-center" style={{ fontSize: "0.75rem" }}>Холбогдох</a>
              </div>
              <button className="btn btn-link text-muted p-0 ms-2"><i className="fa-regular fa-heart"></i></button>
            </div>
          </div>

          {/* Pagination */}
          <div className="custom-pagination">
            <span className="page-btn opacity-50" aria-disabled="true"><i className="fa-solid fa-chevron-left"></i></span>
            <Link href={compResultsHref} className="page-btn active">1</Link>
            <span className="page-btn opacity-50">…</span>
            <span className="page-btn opacity-50" aria-disabled="true"><i className="fa-solid fa-chevron-right"></i></span>
          </div>

          {/* 4 Step Process */}
          <div className="process-steps-container">
            <h3 className="process-title">Match хийх 4 алхам</h3>
            <div className="process-flow">
              <div className="process-step">
                <div className="process-number">1</div>
                <div className="process-step-title">Хүсэлт</div>
                <div className="process-step-desc">Шаардлагаа илгээх</div>
                <i className="fa-solid fa-arrow-right process-arrow"></i>
              </div>
              <div className="process-step">
                <div className="process-number">2</div>
                <div className="process-step-title">Сонголт</div>
                <div className="process-step-desc">Тохирох түншүүд санал ирүүлэх</div>
                <i className="fa-solid fa-arrow-right process-arrow"></i>
              </div>
              <div className="process-step">
                <div className="process-number">3</div>
                <div className="process-step-title">Уулзалт</div>
                <div className="process-step-desc">Онлайн уулзалт, дээжийн үзэсгэлэн</div>
                <i className="fa-solid fa-arrow-right process-arrow"></i>
              </div>
              <div className="process-step">
                <div className="process-number">4</div>
                <div className="process-step-title">Гэрээ</div>
                <div className="process-step-desc">Гэрээ байгуулж, захиалга эхлэх</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <aside className="factories-sidebar-right">
          
          {/* Sourcing Form */}
          <div className="factory-widget">
            <h3 className="factory-widget-title" style={{ marginBottom: "0.5rem" }}>Хүсэлт илгээх</h3>
            <p className="text-muted mb-4" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>Бүтээгдэхүүний шаардлагаа илгээж, тохирох түншүүдээс санал аваарай.</p>
            
            <form className="sourcing-form">
              <label>Бүтээгдэхүүн</label>
              <input type="text" placeholder="Жишээ: Ухаалаг цагны оосор" />
              
              <label>Тоо хэмжээ (MOQ)</label>
              <input type="text" placeholder="Жишээ: 1,000 ширхэг" />
              
              <label>Техникийн шаардлага</label>
              <textarea placeholder="Материал, хэмжээ, өнгө, савлагаа, бусад шаардлагаа бичнэ үү..."></textarea>
              
              <label>Зориулалт зах зээл</label>
              <select>
                <option>Сонгоно уу</option>
                <option>Монгол улс</option>
                <option>Олон улс</option>
              </select>
              
              <label>Хавсралт (заавал биш)</label>
              <div className="file-upload-box">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <div className="file-upload-text">Файл чирэх эсвэл сонгох<br />(PDF, DOC, JPG, PNG)</div>
              </div>
              
              <button type="button" className="btn-brand w-100 py-2">Request Match</button>
              <div className="text-center mt-2 text-muted" style={{ fontSize: "0.7rem" }}>
                <i className="fa-solid fa-lock"></i> Мэдээлэл 100% нууцлагдана
              </div>
            </form>
          </div>

          {/* Shortlist */}
          <div className="factory-widget">
            <h3 className="factory-widget-title">Таны shortlist (3)</h3>
            
            <div className="shortlist-grid">
              {/* Header */}
              <div className="sl-header"></div>
              <div className="sl-header text-center"><i className="fa-solid fa-laptop text-primary fs-5 mb-1 d-block"></i> <span style={{ fontSize: "0.6rem" }}>Shenzhen TopTech</span></div>
              <div className="sl-header text-center"><i className="fa-solid fa-leaf text-success fs-5 mb-1 d-block"></i> <span style={{ fontSize: "0.6rem" }}>Qingdao GreenHome</span></div>
              <div className="sl-header text-center"><i className="fa-solid fa-gears text-warning fs-5 mb-1 d-block"></i> <span style={{ fontSize: "0.6rem" }}>Busan Modern</span></div>
              
              {/* Row 1 */}
              <div className="sl-row sl-cell text-muted">Улс</div>
              <div className="sl-row sl-cell justify-content-center">Хятад</div>
              <div className="sl-row sl-cell justify-content-center">Хятад</div>
              <div className="sl-row sl-cell justify-content-center">БНСУ</div>
              
              {/* Row 2 */}
              <div className="sl-row sl-cell text-muted">MOQ</div>
              <div className="sl-row sl-cell justify-content-center text-center">500 ширхэг</div>
              <div className="sl-row sl-cell justify-content-center text-center">1,000 ширхэг</div>
              <div className="sl-row sl-cell justify-content-center text-center">1 ширхэг</div>
              
              {/* Row 3 */}
              <div className="sl-row sl-cell text-muted">Lead time</div>
              <div className="sl-row sl-cell justify-content-center text-center">15-25 хоног</div>
              <div className="sl-row sl-cell justify-content-center text-center">15-25 хоног</div>
              <div className="sl-row sl-cell justify-content-center text-center">30-45 хоног</div>
              
              {/* Row 4 */}
              <div className="sl-row sl-cell text-muted">Сертификат</div>
              <div className="sl-row sl-cell justify-content-center text-center">ISO 9001, CE, RoHS</div>
              <div className="sl-row sl-cell justify-content-center text-center">ISO 9001, BSCI</div>
              <div className="sl-row sl-cell justify-content-center text-center">ISO 9001, CE</div>
              
              {/* Row 5 */}
              <div className="sl-row sl-cell text-muted" style={{ border: "none" }}>Хариу өгөх</div>
              <div className="sl-row sl-cell justify-content-center" style={{ border: "none" }}>98%</div>
              <div className="sl-row sl-cell justify-content-center" style={{ border: "none" }}>95%</div>
              <div className="sl-row sl-cell justify-content-center" style={{ border: "none" }}>92%</div>
            </div>
            
            <button className="btn-brand-outline w-100 py-1 mt-3" style={{ fontSize: "0.8rem" }}>Харьцуулалт дэлгэрэнгүй харах</button>
          </div>

        </aside>

      </div>

      {/* Bottom Stats Bar */}
      <div className="container">
        <div className="bottom-stats-bar">
          <div className="b-stat-item">
            <i className="fa-solid fa-industry b-stat-icon"></i>
            <div className="b-stat-info">
              <div className="val">12,500+</div>
              <div className="lbl">Үйлдвэрүүд</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-regular fa-user b-stat-icon"></i>
            <div className="b-stat-info">
              <div className="val">3,200+</div>
              <div className="lbl">Ханган нийлүүлэгчид</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-solid fa-globe b-stat-icon"></i>
            <div className="b-stat-info">
              <div className="val">180+</div>
              <div className="lbl">Улс орны хамрах хүрээ</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-solid fa-bolt b-stat-icon text-warning"></i>
            <div className="b-stat-info">
              <div className="val">98%</div>
              <div className="lbl">Дундаж хариу өгөх хувь</div>
            </div>
          </div>
          <div className="b-stat-item">
            <i className="fa-regular fa-clock b-stat-icon text-primary"></i>
            <div className="b-stat-info">
              <div className="val">24ц</div>
              <div className="lbl">Дотор санал авах</div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
