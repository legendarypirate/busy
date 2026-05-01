"use client";

import { useState, useEffect } from "react";

export default function PitchDeckEditor() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [zoom, setZoom] = useState(1);

  const initialSlides = [
    `<div class="mb-4"><i class="fa-solid fa-leaf fs-1"></i> EcoRide</div>
     <h1 class="fw-bold mb-4" style="font-size: 3rem;">Тогтвортой ирээдүйн тээврийн шийдэл</h1>
     <p class="lead mb-5">Цахилгаан унааны хамтын хэрэглэгчээр хотын хөдөлгөөнийг хялбарчилна.</p>
     <div class="d-flex gap-5">
         <div>
             <div class="h3 fw-bold mb-0">₮6.0 тэрбум</div>
             <div class="small opacity-75">Хөрөнгө оруулалт</div>
         </div>
         <div>
             <div class="h3 fw-bold mb-0">210%</div>
             <div class="small opacity-75">Жилийн өсөлт (YoY)</div>
         </div>
         <div>
             <div class="h3 fw-bold mb-0">21,500+</div>
             <div class="small opacity-75">Бүртгэлтэй хэрэглэгч</div>
         </div>
     </div>`,
    `<div class="p-4 text-start"><div class="badge bg-light text-muted mb-3">Слайд 2</div><h2 class="fw-bold mb-3" style="font-size:2rem;">Зах зээлийн асуудал</h2><p class="lead text-muted mb-0">Хотын түгжрэл, цэвэр агаарын хүрэлцээний хомсдол зэрэг тогтвортой тээврийн шийдэл шаардлагатай байна.</p></div>`,
    `<div class="p-4 text-start"><div class="badge bg-light text-muted mb-3">Слайд 3</div><h2 class="fw-bold mb-3" style="font-size:2rem;">Шийдэл</h2><p class="lead text-muted mb-0">EcoRide платформ нь цахилгаан унаанд хуваалцах, захиалга, төлбөрийг нэг дор холбоно.</p></div>`,
    `<div class="p-4 text-start"><div class="badge bg-light text-muted mb-3">Слайд 4</div><h2 class="fw-bold mb-3" style="font-size:2rem;">Зах зээлийн боломж</h2><p class="lead text-muted mb-0">Зорилтот зах зээлийн хэмжээ, өсөлтийн хүлээгдэж буй CAGR (жишээ).</p></div>`,
    `<div class="p-4 text-start"><div class="badge bg-light text-muted mb-3">Слайд 5</div><h2 class="fw-bold mb-3" style="font-size:2rem;">Бүтээгдэхүүн</h2><p class="lead text-muted mb-0">Апп, операторын самбар, төлбөрийн интеграци.</p></div>`,
    `<div class="p-4 text-start"><div class="badge bg-light text-muted mb-3">Слайд 6</div><h2 class="fw-bold mb-3" style="font-size:2rem;">Бизнес модель</h2><p class="lead text-muted mb-0">Комисс, захиалгын орлого, түншлэлийн орлого.</p></div>`,
    `<div class="p-4 text-start"><div class="badge bg-light text-muted mb-3">Слайд 7</div><h2 class="fw-bold mb-3" style="font-size:2rem;">Санхүүгийн түүх ба төсөөлөл</h2><p class="lead text-muted mb-0">Орлого, зардал, түүний урсгал — жишээ график энд байрлана.</p></div>`,
    `<div class="p-4 text-start"><div class="badge bg-light text-muted mb-3">Слайд 8</div><h2 class="fw-bold mb-3" style="font-size:2rem;">Баг</h2><p class="lead text-muted mb-0">Гүйцэтгэх удирдлага, зөвлөхүүд (жишээ).</p></div>`
  ];

  const [slides, setSlides] = useState<string[]>(initialSlides);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if (e.key === 'ArrowLeft') renderSlide(slideIdx - 1);
      if (e.key === 'ArrowRight') renderSlide(slideIdx + 1);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [slideIdx, slides.length]);

  const renderSlide = (i: number) => {
    const n = slides.length;
    if (n < 1) return;
    setSlideIdx(Math.max(0, Math.min(n - 1, i)));
  };

  const addSlide = () => {
    const n = slides.length + 1;
    setSlides([...slides, `<div class="p-4 text-center"><div class="badge bg-primary mb-3">Шинэ слайд ${n}</div><p class="lead text-muted mb-0">Гарчиг болон агуулгаа энд оруулна уу.</p></div>`]);
    setSlideIdx(slides.length);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = [...slides];
    newSlides.splice(slideIdx, 1);
    setSlides(newSlides);
    if (slideIdx >= newSlides.length) {
      setSlideIdx(newSlides.length - 1);
    }
  };

  const setZoomLevel = (z: number) => {
    setZoom(Math.max(0.5, Math.min(1.6, z)));
  };

  return (
    <div id="pdDeckRoot" className="container pd-layout mt-4">
      {/* Left Sidebar: Slides */}
      <aside className="pd-sidebar-left">
        <div className="pd-sidebar-header">
          <div className="small fw-bold text-dark" id="pdSlideCountLabel">Слайдууд ({slides.length})</div>
          <button type="button" onClick={addSlide} className="btn btn-sm btn-primary py-0 px-2" style={{ fontSize: "0.65rem" }}><i className="fa-solid fa-plus"></i> Нэмэх</button>
        </div>
        <div className="pd-slide-list">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`pd-slide-thumb ${i === slideIdx ? 'active' : ''}`} 
              onClick={() => renderSlide(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); renderSlide(i); } }}
              role="button" 
              tabIndex={0}
            >
              <div className="pd-slide-num">{i + 1}</div>
              <div className="pd-slide-img" style={
                i === 0 
                  ? { background: "linear-gradient(135deg, #0b2149, #1e293b)", display: "grid", placeItems: "center", color: "#fff", fontSize: "0.5rem", textAlign: "center", padding: "10px" } 
                  : { background: "#f1f5f9", display: "grid", placeItems: "center", color: "#cbd5e1", fontSize: "0.5rem", textAlign: "center", padding: "10px" }
              }>
                {i === 0 ? <>EcoRide<br />Cover Slide</> : <>Slide {i + 1} Content</>}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-top mt-auto">
          <button className="btn btn-sm btn-light border w-100 fw-bold" style={{ fontSize: "0.7rem" }}><i className="fa-solid fa-upload me-1"></i> Слайд импортлох</button>
        </div>
      </aside>

      {/* Main Editor Area */}
      <div className="pd-main">
        <div className="pd-main-header">
          <div className="pd-title-area">
            <button type="button" className="btn btn-sm btn-light border me-2 pd-deck-back" title="Буцах" aria-label="Буцах" onClick={() => history.back()}><i className="fa-solid fa-chevron-left"></i></button>
            <h2 className="h5 fw-bold mb-0">EcoRide Pitch Deck <i className="fa-solid fa-pen small text-muted ms-2" style={{ fontSize: "0.8rem", cursor: "pointer" }}></i></h2>
            <span className="pd-version">v2.4</span>
          </div>
          <div className="d-flex gap-2">
            <button className="dlr-action-btn"><i className="fa-regular fa-floppy-disk"></i> Хадгалах</button>
            <button className="dlr-action-btn"><i className="fa-regular fa-eye"></i> Урьдчилан харах</button>
            <button className="dlr-action-btn dlr-action-btn-primary"><i className="fa-solid fa-paper-plane"></i> Хуваалцах</button>
            <button className="dlr-action-btn"><i className="fa-solid fa-ellipsis"></i></button>
          </div>
        </div>

        <div className="pd-stats-row">
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Нийт слайд</div>
              <div className="pd-stat-val" id="pdStatSlideTotal">{slides.length}</div>
            </div>
            <i className="fa-regular fa-copy pd-stat-icon"></i>
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Бэлэн байдал</div>
              <div className="pd-stat-val">86%</div>
            </div>
            <i className="fa-solid fa-chart-line pd-stat-icon text-success"></i>
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Investor views</div>
              <div className="pd-stat-val">127</div>
            </div>
            <i className="fa-regular fa-eye pd-stat-icon"></i>
          </div>
          <div className="pd-stat-card">
            <div className="pd-stat-info">
              <div className="pd-stat-lbl">Статус</div>
              <div className="pd-stat-val text-success" style={{ fontSize: "0.75rem" }}>Нийтийн линк идэвхтэй</div>
            </div>
            <i className="fa-solid fa-link pd-stat-icon text-success"></i>
          </div>
        </div>

        {/* Preview Canvas & Settings */}
        <div className="pd-preview-area">
          <div className="pd-canvas-wrap">
            <div className="pd-canvas">
              <div className="pd-canvas-content" style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }}>
                <div id="pdCanvasInner" dangerouslySetInnerHTML={{ __html: slides[slideIdx] || '' }}></div>
              </div>
            </div>
            <div className="pd-canvas-nav">
              <button type="button" className="btn btn-sm btn-link text-muted pd-slide-prev" aria-label="Өмнөх слайд" onClick={() => renderSlide(slideIdx - 1)}><i className="fa-solid fa-chevron-left"></i></button>
              <span id="pdSlideCounter">{slideIdx + 1} / {slides.length}</span>
              <button type="button" className="btn btn-sm btn-link text-muted pd-slide-next" aria-label="Дараагийн слайд" onClick={() => renderSlide(slideIdx + 1)}><i className="fa-solid fa-chevron-right"></i></button>
              <button type="button" className="btn btn-sm btn-link text-danger ms-1" title="Энэ слайдыг устгах" aria-label="Слайд устгах" onClick={deleteSlide} disabled={slides.length <= 1}><i className="fa-regular fa-trash-can me-1"></i>Устгах</button>
              <div className="ms-auto d-flex align-items-center gap-3">
                <div className="small"><i className="fa-solid fa-minus cursor-pointer" role="button" tabIndex={0} onClick={() => setZoomLevel(zoom - 0.1)}></i> <span className="mx-2">{Math.round(zoom * 100)}%</span> <i className="fa-solid fa-plus cursor-pointer" role="button" tabIndex={0} onClick={() => setZoomLevel(zoom + 0.1)}></i></div>
                <i className="fa-solid fa-expand text-muted cursor-pointer"></i>
              </div>
            </div>
          </div>

          <div className="pd-settings-pane">
            <div className="pd-setting-group">
              <label className="pd-setting-lbl">Загвар</label>
              <select className="form-select form-select-sm border-light bg-light fw-bold" style={{ fontSize: "0.75rem" }}>
                <option>Modern Pro</option>
                <option>Investor Dark</option>
                <option>Clean Minimal</option>
              </select>
            </div>
            <div className="pd-setting-group">
              <label className="pd-setting-lbl">Өнгөний схем</label>
              <div className="d-flex gap-2">
                <div className="pd-color-swatch active" style={{ background: "linear-gradient(to right, #0b2149, #2563eb)" }}></div>
                <div className="pd-color-swatch" style={{ background: "linear-gradient(to right, #064e3b, #10b981)" }}></div>
                <div className="pd-color-swatch" style={{ background: "linear-gradient(to right, #4338ca, #6366f1)" }}></div>
                <div className="pd-color-swatch" style={{ background: "linear-gradient(to right, #7c2d12, #f97316)" }}></div>
              </div>
            </div>
            <div className="pd-setting-group">
              <label className="pd-setting-lbl">Фонт</label>
              <select className="form-select form-select-sm border-light bg-light" style={{ fontSize: "0.75rem" }}>
                <option>Nunito</option>
                <option>Roboto</option>
                <option>Inter</option>
              </select>
            </div>
            <div className="pd-setting-group border-top pt-3">
              <label className="pd-setting-lbl text-primary"><i className="fa-solid fa-wand-magic-sparkles me-1"></i> AI Сайжруулалт</label>
              <button className="btn btn-sm btn-outline-primary w-100 mb-2 py-2 text-start" style={{ fontSize: "0.7rem" }}><i className="fa-solid fa-pen-nib me-2"></i> Агуулга сайжруулах</button>
              <button className="btn btn-sm btn-outline-primary w-100 py-2 text-start" style={{ fontSize: "0.7rem" }}><i className="fa-solid fa-palette me-2"></i> Дизайн зөвлөмж</button>
            </div>
          </div>
        </div>

        {/* Deck Structure */}
        <div className="small fw-bold text-dark mb-3">Deck бүтэц <span className="text-muted fw-normal" style={{ fontSize: "0.65rem" }}>(Дарааллаар чирж өөрчлөх боломжтой)</span></div>
        <div className="pd-struct-grid">
          <div className="pd-struct-item"><i className="fa-regular fa-building pd-struct-icon text-primary"></i><span className="pd-struct-lbl">Компанийн тойм</span></div>
          <div className="pd-struct-item"><i className="fa-solid fa-chart-pie pd-struct-icon text-success"></i><span className="pd-struct-lbl">Зах зээлийн боломж</span></div>
          <div className="pd-struct-item"><i className="fa-solid fa-cube pd-struct-icon text-info"></i><span className="pd-struct-lbl">Бүтээгдэхүүн</span></div>
          <div className="pd-struct-item"><i className="fa-solid fa-sitemap pd-struct-icon text-warning"></i><span className="pd-struct-lbl">Бизнес модель</span></div>
          <div className="pd-struct-item"><i className="fa-solid fa-money-bill-trend-up pd-struct-icon text-danger"></i><span className="pd-struct-lbl">Санхүүгийн төсөөлөл</span></div>
          <div className="pd-struct-item"><i className="fa-solid fa-users-gear pd-struct-icon text-secondary"></i><span className="pd-struct-lbl">Баг</span></div>
        </div>

        {/* Feedback Area */}
        <div className="pd-activity-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="h6 fw-bold mb-0">Сүүлд хийсэн өөрчлөлт ба санал хүсэлт</h3>
            <a href="#" className="text-primary small fw-bold text-decoration-none">Бүх саналыг харах <i className="fa-solid fa-arrow-right ms-1"></i></a>
          </div>
          
          <div className="pd-activity-item">
            <div className="pd-activity-avatar" style={{ background: "#f97316" }}>AI</div>
            <div className="pd-activity-content">
              <div><span className="pd-activity-user">Angel Investor</span> <span className="badge bg-light text-primary border fw-normal" style={{ fontSize: "0.6rem" }}>Санал</span></div>
              <div className="pd-activity-text mt-1">Санхүүгийн төсөөлөлт хэсгийн тооцоог нарийвчлах хэрэгтэй.</div>
              <div className="pd-activity-time">Өнөөдөр 10:22 • Хариу өгөх</div>
            </div>
          </div>
          <div className="pd-activity-item">
            <div className="pd-activity-avatar" style={{ background: "#7c3aed" }}>VC</div>
            <div className="pd-activity-content">
              <div><span className="pd-activity-user">VC Venture Capital</span> <span className="badge bg-light text-primary border fw-normal" style={{ fontSize: "0.6rem" }}>Санал</span></div>
              <div className="pd-activity-text mt-1">Зах зээлийн хэмжээг харуулсан графикийг илүү ойлгомжтой болгоно уу.</div>
              <div className="pd-activity-time">Өчигдөр 15:45 • Хариу өгөх</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Right */}
      <aside className="pd-sidebar-right">
        <div className="inv-sidebar-left mb-4">
          <div className="dlr-card-title text-uppercase mb-4" style={{ fontSize: "0.75rem" }}>Pitch Deck бэлэн байдал</div>
          
          <div className="dlr-status-circle">
            <svg viewBox="0 0 36 36" className="dlr-status-svg">
              <path className="dlr-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ fill: "none", stroke: "#f1f5f9", strokeWidth: 3 }} />
              <path className="dlr-circle-fill" strokeDasharray="86, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ fill: "none", stroke: "#2563eb", strokeWidth: 3, strokeLinecap: "round" }} />
            </svg>
            <div className="dlr-status-percent">
              <span className="dlr-status-val">86%</span>
              <span className="dlr-status-lbl">Бэлэн</span>
            </div>
          </div>

          <p className="small text-muted text-center mb-4">Deck-ээ илүү хүчтэй болгохын тулд доорх хэсгүүдийг гүйцээнэ үү.</p>
          
          <div className="dlr-checklist mb-4">
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-regular fa-image fs-6"></i> <span>Cover slide</span></div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-lightbulb fs-6"></i> <span>Problem & Solution</span></div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-chart-pie fs-6"></i> <span>Market size</span></div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-sitemap fs-6"></i> <span>Business model</span></div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-money-bill-trend-up fs-6"></i> <span>Financials</span></div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
            <div className="dlr-checklist-item border-0 py-2">
              <div className="small text-muted d-flex align-items-center gap-2"><i className="fa-solid fa-users fs-6"></i> <span>Team</span></div>
              <i className="fa-solid fa-circle-check text-success"></i>
            </div>
          </div>

          <button className="btn btn-primary w-100 mb-2 py-2 fw-bold" style={{ borderRadius: "12px", fontSize: "0.85rem" }}><i className="fa-solid fa-paper-plane me-2"></i> Deck-ээ илгээх</button>
          <button className="btn btn-light border w-100 py-2 fw-bold" style={{ borderRadius: "12px", fontSize: "0.85rem" }}><i className="fa-regular fa-copy me-2"></i> Хуваалцах линкийг хуулах</button>
        </div>

        <div className="inv-advice-card">
          <div className="inv-advice-icon"><i className="fa-solid fa-circle-info"></i></div>
          <div className="small fw-bold text-dark mb-2">Тусламж</div>
          <p className="small text-muted mb-3" style={{ lineHeight: 1.4 }}>Сайн Pitch Deck нь хөрөнгө оруулагчийн сонирхлыг татаж, санхүүжилт босгоход тусална.</p>
          <a href="#" className="text-primary small fw-bold text-decoration-none">Pitch Deck гарын авлага <i className="fa-solid fa-arrow-right ms-1"></i></a>
        </div>
      </aside>
    </div>
  );
}
