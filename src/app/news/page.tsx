import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewsPage({ searchParams }: { searchParams: { cat?: string } }) {
  const allowedCats = ['all', 'market', 'trip', 'guide', 'news', 'video'];
  const catParam = searchParams.cat?.trim() || 'all';
  const newsCat = allowedCats.includes(catParam) ? catParam : 'all';
  
  const gridClass = newsCat === 'all' ? 'n-content-grid n-content-grid--all' : `n-content-grid n-content-grid--filter-${newsCat}`;
  const isHeroHidden = (newsCat !== 'all' && newsCat !== 'market');

  return (
    <main className="page-content" style={{ backgroundColor: "var(--bg-page)" }}>

      <div className="container pt-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="fw-bold" style={{ fontSize: "2.25rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Мэдлэг ба Мэдээ</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Зах зээл, экспорт, аялал, хөрөнгө оруулалт болон үйлдвэрийн мэдээллийг нэг дор.</p>
        </div>
      </div>

      <div className="container news-layout">
        
        {/* Left Sidebar */}
        <aside className="news-sidebar-left">
          <div className="n-widget newsletter-box">
            <h3 className="n-widget-title justify-content-center">Мэдээллийн товхимол</h3>
            <p className="newsletter-desc">Шинэ тайлан, мэдээ, арга хэмжээний мэдээллийг шууд имэйлээр аваарай.</p>
            <form>
              <input type="email" className="newsletter-input" placeholder="Имэйл хаягаа оруулна уу" />
              <button type="button" className="btn-brand w-100 py-2" style={{ fontSize: "0.85rem" }}>Бүртгүүлэх</button>
            </form>
          </div>

          <div className="n-widget">
            <h3 className="n-widget-title">Хадгалсан сэдвүүд</h3>
            <ul className="saved-topics-list">
              <li>
                <span className="st-name"><i className="fa-solid fa-box-open text-muted"></i> Экспорт</span>
                <span className="st-count">12</span>
              </li>
              <li>
                <span className="st-name"><i className="fa-solid fa-plane text-muted"></i> Аялал жуулчлал</span>
                <span className="st-count">8</span>
              </li>
              <li>
                <span className="st-name"><i className="fa-solid fa-wheat-awn text-muted"></i> Хүнс, хөдөө аж ахуй</span>
                <span className="st-count">6</span>
              </li>
              <li>
                <span className="st-name"><i className="fa-solid fa-bolt text-muted"></i> Эрчим хүч</span>
                <span className="st-count">4</span>
              </li>
              <li>
                <span className="st-name"><i className="fa-solid fa-city text-muted"></i> Барилга, хот байгуулалт</span>
                <span className="st-count">5</span>
              </li>
            </ul>
            <button className="btn btn-light w-100 mt-3 py-1" style={{ fontSize: "0.8rem", background: "#f8fafc", border: "1px solid var(--border-color)" }}>Бүгд харах</button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="news-main-content">
          
          {/* Hero Article */}
          <div className={`n-hero-card${isHeroHidden ? ' is-hidden-by-news-cat' : ''}`}>
            <div className="n-hero-content">
              <span className="n-hero-tag">Зах зээлийн тайлан</span>
              <h2 className="n-hero-title">Монгол Улсын экспортын зах зээлийн тойм 2025 оны II улирал</h2>
              <p className="n-hero-desc">Экспортын гол бүтээгдэхүүнүүдийн гадаад зах зээл дэх эрэлт, үнэ, нийлүүлэлтийн чиг хандлагыг тоймлон инфографик, хүснэгттэй тайлан.</p>
              <div className="n-hero-meta">
                <span><i className="fa-regular fa-clock"></i> 2025.06.10</span>
                <span><i className="fa-regular fa-eye"></i> 1.2K</span>
                <span><i className="fa-regular fa-bookmark"></i> 12 мин унших</span>
              </div>
              <div className="n-hero-actions">
                <button className="btn-brand px-4 py-1" style={{ fontSize: "0.85rem" }}>Унших</button>
                <button className="btn-brand-outline px-4 py-1" style={{ fontSize: "0.85rem" }}><i className="fa-solid fa-download me-2"></i> Татах PDF (2.4 MB)</button>
              </div>
            </div>
            <div className="n-hero-img-box">
              <i className="fa-regular fa-image"></i>
              <div className="n-hero-dots">
                <div className="n-hero-dot active"></div>
                <div className="n-hero-dot"></div>
                <div className="n-hero-dot"></div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="n-tabs-scroll">
            <div className="n-tabs" role="tablist">
              <Link href="/news" className={`n-tab${newsCat === 'all' ? ' active' : ''}`}>Бүгд</Link>
              <Link href="/news?cat=market" className={`n-tab${newsCat === 'market' ? ' active' : ''}`}>Зах зээлийн тайлан</Link>
              <Link href="/news?cat=trip" className={`n-tab${newsCat === 'trip' ? ' active' : ''}`}>Аяллын тайлан</Link>
              <Link href="/news?cat=guide" className={`n-tab${newsCat === 'guide' ? ' active' : ''}`}>Гарын авлага</Link>
              <Link href="/news?cat=news" className={`n-tab${newsCat === 'news' ? ' active' : ''}`}>Мэдээ</Link>
              <Link href="/news?cat=video" className={`n-tab${newsCat === 'video' ? ' active' : ''}`}>Видео</Link>
            </div>
          </div>

          {/* Content Grid (8 Cards) */}
          <div className={gridClass}>
            {/* Card 1 */}
            <div className="n-card n-card--market">
              <div className="n-card-tag"><i className="fa-solid fa-chart-pie me-1"></i> Зах зээлийн тайлан</div>
              <div className="n-card-icon-box"><i className="fa-solid fa-chart-area"></i></div>
              <h3 className="n-card-title">БНХАУ-ын зах зээлийн тойм (Хүнсний бүтээгдэхүүн)</h3>
              <div className="n-card-meta">
                <span>2025.06.08</span>
                <span><i className="fa-regular fa-eye"></i> 820</span>
                <span><i className="fa-regular fa-clock"></i> 10 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Татах PDF <i className="fa-solid fa-download"></i></a>
              </div>
            </div>
            {/* Card 2 */}
            <div className="n-card n-card--trip">
              <div className="n-card-tag"><i className="fa-solid fa-plane me-1"></i> Аяллын тайлан</div>
              <div className="n-card-icon-box"><i className="fa-solid fa-plane-departure"></i></div>
              <h3 className="n-card-title">Солонгос аяллын зах зээл 2025 оны эхний хагас жил</h3>
              <div className="n-card-meta">
                <span>2025.06.05</span>
                <span><i className="fa-regular fa-eye"></i> 650</span>
                <span><i className="fa-regular fa-clock"></i> 9 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Татах PDF <i className="fa-solid fa-download"></i></a>
              </div>
            </div>
            {/* Card 3 */}
            <div className="n-card n-card--guide">
              <div className="n-card-tag"><i className="fa-solid fa-book me-1"></i> Гарын авлага</div>
              <div className="n-card-icon-box"><i className="fa-solid fa-book-open-reader"></i></div>
              <h3 className="n-card-title">Экспортлогчдод зориулсан гааль, татварын гарын авлага</h3>
              <div className="n-card-meta">
                <span>2025.06.01</span>
                <span><i className="fa-regular fa-eye"></i> 1.1K</span>
                <span><i className="fa-regular fa-clock"></i> 15 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Татах PDF <i className="fa-solid fa-download"></i></a>
              </div>
            </div>
            {/* Card 4 */}
            <div className="n-card n-card--news">
              <div className="n-card-tag"><i className="fa-solid fa-bullhorn me-1"></i> Мэдээ</div>
              <div className="n-card-icon-box"><i className="fa-solid fa-bullhorn"></i></div>
              <h3 className="n-card-title">Экспортын дэмжлэгийн шинэ хөтөлбөр зарлагдлаа</h3>
              <div className="n-card-meta">
                <span>2025.06.09</span>
                <span><i className="fa-regular fa-eye"></i> 420</span>
                <span><i className="fa-regular fa-clock"></i> 5 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Унших <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.6rem" }}></i></a>
              </div>
            </div>
            {/* Card 5 */}
            <div className="n-card n-card--news">
              <div className="n-card-tag"><i className="fa-solid fa-bullhorn me-1"></i> Мэдээ</div>
              <div className="n-card-icon-box"><i className="fa-solid fa-bullhorn"></i></div>
              <h3 className="n-card-title">&quot;Go Mongolia 2025&quot; үзэсгэлэнд оролцох байгууллага</h3>
              <div className="n-card-meta">
                <span>2025.06.07</span>
                <span><i className="fa-regular fa-eye"></i> 390</span>
                <span><i className="fa-regular fa-clock"></i> 4 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Унших <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.6rem" }}></i></a>
              </div>
            </div>
            {/* Card 6 */}
            <div className="n-card n-card--market">
              <div className="n-card-tag"><i className="fa-solid fa-chart-pie me-1"></i> Зах зээлийн тайлан</div>
              <div className="n-card-icon-box"><i className="fa-solid fa-chart-column"></i></div>
              <h3 className="n-card-title">ОХУ-ын барилгын материалын зах зээлийн шинжилгээ</h3>
              <div className="n-card-meta">
                <span>2025.05.30</span>
                <span><i className="fa-regular fa-eye"></i> 760</span>
                <span><i className="fa-regular fa-clock"></i> 11 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Татах PDF <i className="fa-solid fa-download"></i></a>
              </div>
            </div>
            {/* Card 7 */}
            <div className="n-card n-card--video">
              <div className="n-card-tag"><i className="fa-solid fa-video me-1"></i> Видео</div>
              <div className="n-card-icon-box"><i className="fa-regular fa-circle-play"></i></div>
              <h3 className="n-card-title">Экспорт амжилтын түүх: &quot;Мах Импекс&quot; ХХК</h3>
              <div className="n-card-meta">
                <span>2025.06.03</span>
                <span><i className="fa-regular fa-eye"></i> 1.3K</span>
                <span><i className="fa-regular fa-clock"></i> 18 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Үзэх <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.6rem" }}></i></a>
              </div>
            </div>
            {/* Card 8 */}
            <div className="n-card n-card--guide">
              <div className="n-card-tag"><i className="fa-solid fa-file-lines me-1"></i> Гарын авлага</div>
              <div className="n-card-icon-box"><i className="fa-regular fa-file-lines"></i></div>
              <h3 className="n-card-title">Бараа, бүтээгдэхүүний гарал үүслийн гэрчилгээ</h3>
              <div className="n-card-meta">
                <span>2025.05.28</span>
                <span><i className="fa-regular fa-eye"></i> 540</span>
                <span><i className="fa-regular fa-clock"></i> 7 мин</span>
              </div>
              <div className="n-card-actions">
                <a href="#" className="n-card-btn text-muted">Татах PDF <i className="fa-solid fa-download"></i></a>
              </div>
            </div>
          </div>

          {/* Downloadable Reports */}
          <div className="n-section-title">
            Татаж авах тайлангууд
            <a href="#" style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400, textDecoration: "none" }}>Бүгдийг харах <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }}></i></a>
          </div>
          <div className="n-dl-grid">
            <div className="n-dl-item">
              <div className="n-dl-format" style={{ color: "#ef4444", background: "#fef2f2" }}>PDF</div>
              <div className="n-dl-info">
                <div className="n-dl-title">Дэлхийн эдийн засгийн төлөв 2025</div>
                <div className="n-dl-meta">2025.06.05 &nbsp;&nbsp; 2.8 MB</div>
              </div>
              <a href="#" className="n-dl-btn"><i className="fa-solid fa-download text-muted" style={{ fontSize: "0.8rem" }}></i></a>
            </div>
            <div className="n-dl-item">
              <div className="n-dl-format" style={{ color: "#10b981", background: "#ecfdf5" }}>Excel</div>
              <div className="n-dl-info">
                <div className="n-dl-title">Экспортын бүтээгдэхүүний үнэ статистик (2020-2025)</div>
                <div className="n-dl-meta">2025.06.04 &nbsp;&nbsp; 1.6 MB</div>
              </div>
              <a href="#" className="n-dl-btn"><i className="fa-solid fa-download text-muted" style={{ fontSize: "0.8rem" }}></i></a>
            </div>
            <div className="n-dl-item">
              <div className="n-dl-format" style={{ color: "#f59e0b", background: "#fffbeb" }}>Slide</div>
              <div className="n-dl-info">
                <div className="n-dl-title">Монголын аялал жуулчлалын байгууллагуудын тойм</div>
                <div className="n-dl-meta">2025.06.02 &nbsp;&nbsp; 1.4 MB</div>
              </div>
              <a href="#" className="n-dl-btn"><i className="fa-solid fa-download text-muted" style={{ fontSize: "0.8rem" }}></i></a>
            </div>
            <div className="n-dl-item">
              <div className="n-dl-format" style={{ color: "#ef4444", background: "#fef2f2" }}>PDF</div>
              <div className="n-dl-info">
                <div className="n-dl-title">Үйлдвэрийн салбарын тайлан 2025</div>
                <div className="n-dl-meta">2025.05.29 &nbsp;&nbsp; 3.1 MB</div>
              </div>
              <a href="#" className="n-dl-btn"><i className="fa-solid fa-download text-muted" style={{ fontSize: "0.8rem" }}></i></a>
            </div>
          </div>

          {/* Success Cases */}
          <div className="n-section-title">
            Амжилтын кэйс
            <a href="#" style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400, textDecoration: "none" }}>Бүгдийг харах <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }}></i></a>
          </div>
          <div className="n-cases-wrapper mb-5">
            <button className="slider-arrow position-absolute" style={{ left: "-15px", zIndex: 2 }}><i className="fa-solid fa-chevron-left text-muted" style={{ fontSize: "0.7rem" }}></i></button>
            
            <div className="n-case-card">
              <div className="n-case-info">
                <div className="n-case-title">&quot;Инвескор ББСБ&quot; ХХК</div>
                <div className="n-case-desc">Экспорт санхүүжилтээр өсөлт</div>
                <div className="n-case-meta">Санаачилга &nbsp;&nbsp; <i className="fa-regular fa-clock"></i> 6 мин унших</div>
              </div>
            </div>
            <div className="n-case-card">
              <div className="n-case-img"><i className="fa-solid fa-industry"></i></div>
              <div className="n-case-info">
                <div className="n-case-title">&quot;АПУ Дэйри&quot; ХХК</div>
                <div className="n-case-desc">Шинэ зах зээлд гарах стратеги</div>
                <div className="n-case-meta">Экспорт &nbsp;&nbsp; <i className="fa-regular fa-clock"></i> 7 мин унших</div>
              </div>
            </div>
            <div className="n-case-card">
              <div className="n-case-img"><i className="fa-solid fa-globe"></i></div>
              <div className="n-case-info">
                <div className="n-case-title">&quot;Мах Импекс&quot; ХХК</div>
                <div className="n-case-desc">Олон улсын стандарт, амжилт</div>
                <div className="n-case-meta">Чанар &nbsp;&nbsp; <i className="fa-regular fa-clock"></i> 5 мин унших</div>
              </div>
            </div>

            <button className="slider-arrow position-absolute" style={{ right: "-15px", zIndex: 2 }}><i className="fa-solid fa-chevron-right text-muted" style={{ fontSize: "0.7rem" }}></i></button>
          </div>

        </div>

        {/* Right Sidebar */}
        <aside className="news-sidebar-right">
          
          {/* Trending Topics */}
          <div className="n-widget">
            <h3 className="n-widget-title"><i className="fa-solid fa-fire text-danger"></i> Тренд сэдвүүд</h3>
            <ul className="trending-list">
              <li>
                <span className="t-num">1</span>
                <span className="t-title">Экспортын шинэ зах зээл</span>
                <span className="t-views">1.2K</span>
              </li>
              <li>
                <span className="t-num">2</span>
                <span className="t-title">Гааль, татварын шинэчлэл</span>
                <span className="t-views">980</span>
              </li>
              <li>
                <span className="t-num">3</span>
                <span className="t-title">Хөдөө аж ахуйн экспорт</span>
                <span className="t-views">870</span>
              </li>
              <li>
                <span className="t-num">4</span>
                <span className="t-title">Аялал жуулчлал 2025</span>
                <span className="t-views">760</span>
              </li>
              <li>
                <span className="t-num">5</span>
                <span className="t-title">Ложистик, тээвэр</span>
                <span className="t-views">620</span>
              </li>
            </ul>
            <button className="btn btn-light w-100 py-1" style={{ fontSize: "0.8rem", background: "#f8fafc", border: "1px solid var(--border-color)" }}>Бүгдийг харах</button>
          </div>

          {/* Most Read */}
          <div className="n-widget">
            <h3 className="n-widget-title"><i className="fa-solid fa-book-open text-primary"></i> Их уншсан</h3>
            <ul className="most-read-list">
              <li>
                <div className="mr-img">
                  <span className="mr-num">1</span>
                  <i className="fa-solid fa-bullhorn"></i>
                </div>
                <div className="mr-info">
                  <div className="mr-title">Монголын экспортын үзүүлэлт 2024</div>
                  <div className="mr-views"><i className="fa-regular fa-eye"></i> 2.1K</div>
                </div>
              </li>
              <li>
                <div className="mr-img">
                  <span className="mr-num">2</span>
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <div className="mr-info">
                  <div className="mr-title">Экспортлогчдод зориулсан татварын хөнгөлөлт</div>
                  <div className="mr-views"><i className="fa-regular fa-eye"></i> 1.8K</div>
                </div>
              </li>
              <li>
                <div className="mr-img">
                  <span className="mr-num">3</span>
                  <i className="fa-solid fa-globe"></i>
                </div>
                <div className="mr-info">
                  <div className="mr-title">Хятад зах зээлд гарах алхамууд</div>
                  <div className="mr-views"><i className="fa-regular fa-eye"></i> 1.6K</div>
                </div>
              </li>
            </ul>
            <button className="btn btn-light w-100 py-1" style={{ fontSize: "0.8rem", background: "#f8fafc", border: "1px solid var(--border-color)" }}>Бүгдийг харах</button>
          </div>

          {/* Event Calendar Widget */}
          <div className="n-widget">
            <h3 className="n-widget-title" style={{ marginBottom: "0.5rem" }}>Арга хэмжээний календарь</h3>
            
            <div className="cal-header mt-3">
              <i className="fa-solid fa-chevron-left cal-nav"></i>
              <div className="cal-title">2025 оны 6 сар</div>
              <i className="fa-solid fa-chevron-right cal-nav"></i>
            </div>
            
            <div className="cal-grid">
              <div className="cal-day-name">Да</div>
              <div className="cal-day-name">Мя</div>
              <div className="cal-day-name">Лх</div>
              <div className="cal-day-name">Пү</div>
              <div className="cal-day-name">Ба</div>
              <div className="cal-day-name">Бя</div>
              <div className="cal-day-name">Ня</div>
              
              <div className="cal-day empty"></div>
              <div className="cal-day empty"></div>
              <div className="cal-day empty"></div>
              <div className="cal-day empty"></div>
              <div className="cal-day empty"></div>
              <div className="cal-day empty"></div>
              <div className="cal-day">1</div>
              
              <div className="cal-day">2</div>
              <div className="cal-day">3</div>
              <div className="cal-day">4</div>
              <div className="cal-day">5</div>
              <div className="cal-day active" style={{ background: "#e0f2fe", color: "var(--brand-primary)" }}>6</div>
              <div className="cal-day">7</div>
              <div className="cal-day">8</div>
              
              <div className="cal-day">9</div>
              <div className="cal-day">10</div>
              <div className="cal-day">11</div>
              <div className="cal-day">12</div>
              <div className="cal-day">13</div>
              <div className="cal-day">14</div>
              <div className="cal-day">15</div>
              
              <div className="cal-day">16</div>
              <div className="cal-day active">17</div>
              <div className="cal-day">18</div>
              <div className="cal-day">19</div>
              <div className="cal-day">20</div>
              <div className="cal-day">21</div>
              <div className="cal-day">22</div>
              
              <div className="cal-day">23</div>
              <div className="cal-day">24</div>
              <div className="cal-day">25</div>
              <div className="cal-day">26</div>
              <div className="cal-day">27</div>
              <div className="cal-day">28</div>
              <div className="cal-day">29</div>
              
              <div className="cal-day">30</div>
            </div>

            <div className="event-item">
              <div className="e-date">
                <div className="e-day">17</div>
                <div className="e-month">ИЮН</div>
              </div>
              <div className="e-info">
                <div className="e-title">Экспортын сургалт</div>
                <div className="e-desc">Улаанбаатар, МҮХАҮТ<br/>10:00 - 13:00</div>
              </div>
            </div>
            <button className="btn btn-light w-100 py-1 mt-3" style={{ fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>Дэлгэрэнгүй</button>
          </div>

        </aside>

      </div>

    </main>
  );
}
