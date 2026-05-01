import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BusyAIPage({ searchParams }: { searchParams: { tab?: string } }) {
  const currentTab = searchParams.tab?.trim() || 'factory';

  return (
    <main className="page-content" style={{ backgroundColor: "#f1f5f9" }}>
      <div className="container pt-4">
        
        {/* High-Fidelity Header */}
        <div className="bai-header-card">
          <div className="bai-header-bg"></div>
          <div className="bai-header-content">
            <h1 className="fw-bold mb-2" style={{ fontSize: "3rem", color: "#0b2149" }}>BUSY AI</h1>
            <p className="lead text-muted mb-0" style={{ maxWidth: 600 }}>Бизнес аялал, үйлдвэр хайлт, захидал, танилцуулга, зөвлөмж боловсруулах ухаалаг туслах</p>
          </div>
          <div className="bai-mascot-wrap">
            <div className="bai-mascot">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="#eff6ff" />
                <rect x="60" y="70" width="80" height="60" rx="30" fill="#2563eb" />
                <circle cx="85" cy="100" r="8" fill="#fff" />
                <circle cx="115" cy="100" r="8" fill="#fff" />
                <rect x="80" y="140" width="40" height="10" rx="5" fill="#cbd5e1" />
                <path d="M40 100 Q 20 100 20 80" stroke="#2563eb" strokeWidth="8" fill="none" strokeLinecap="round" />
                <path d="M160 100 Q 180 100 180 80" stroke="#2563eb" strokeWidth="8" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Task Specific Tabs */}
        <div className="bai-task-tabs">
          <Link href="/busy-ai?tab=factory" className={`bai-task-tab ${currentTab === 'factory' ? 'active' : ''}`}>
            <i className="fa-solid fa-industry"></i> Үйлдвэр хайх
          </Link>
          <Link href="/busy-ai?tab=email" className={`bai-task-tab ${currentTab === 'email' ? 'active' : ''}`}>
            <i className="fa-regular fa-envelope"></i> И-мэйл бичих
          </Link>
          <Link href="/busy-ai?tab=pitch" className={`bai-task-tab ${currentTab === 'pitch' ? 'active' : ''}`}>
            <i className="fa-regular fa-file-powerpoint"></i> Pitch deck
          </Link>
          <Link href="/busy-ai?tab=trip" className={`bai-task-tab ${currentTab === 'trip' ? 'active' : ''}`}>
            <i className="fa-solid fa-plane-departure"></i> Аялал санал болгох
          </Link>
          <Link href="/busy-ai?tab=translate" className={`bai-task-tab ${currentTab === 'translate' ? 'active' : ''}`}>
            <i className="fa-solid fa-language"></i> Орчуулга
          </Link>
        </div>

        {currentTab === 'factory' && (
          <div className="bai-grid">
            {/* AI Chat Interface */}
            <div className="bai-chat-box">
              <div className="bai-chat-header">
                <div className="small fw-bold text-dark"><i className="fa-solid fa-robot text-primary me-2"></i> AI туслах</div>
                <div className="d-flex gap-3 text-muted">
                  <i className="fa-solid fa-rotate-right cursor-pointer" style={{ fontSize: "0.8rem" }}></i>
                  <i className="fa-solid fa-ellipsis-vertical cursor-pointer" style={{ fontSize: "0.8rem" }}></i>
                </div>
              </div>
              <div className="bai-chat-history">
                <div className="bai-msg user">
                  <div className="bai-msg-avatar">U</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Надад БНХАУ-аас сав баглаа боодлын үйлдвэр олж өг</div>
                    <span className="bai-msg-time">10:25 <i className="fa-solid fa-check-double text-primary ms-1"></i></span>
                  </div>
                </div>
                <div className="bai-msg">
                  <div className="bai-msg-avatar">AI</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Таны хүсэлтээр БНХАУ-д байрладаг сав баглаа боодлын үйлдвэрүүдээс шаардлагад нийцсэн 3 нийлүүлэгчийг санал болгож байна. Доор байршил, гэрчилгээ, MOQ мэдээллийг харуулав.</div>
                    <span className="bai-msg-time">10:26</span>
                  </div>
                </div>
                <div className="bai-msg user">
                  <div className="bai-msg-avatar">U</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Pitch deck бүтэц гарга</div>
                    <span className="bai-msg-time">10:29 <i className="fa-solid fa-check-double text-primary ms-1"></i></span>
                  </div>
                </div>
                <div className="bai-msg">
                  <div className="bai-msg-avatar">AI</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Pitch deck-ийн санал болгож буй бүтцийг доор харуулав. Та салбар болон зорилтот зах зээлээ хэлбэл илүү нарийвчлан тохируулж өгье.</div>
                    <span className="bai-msg-time">10:29</span>
                  </div>
                </div>
              </div>
              <div className="bai-input-area">
                <div className="bai-quick-tags">
                  <span className="bai-quick-tag">Сав баглаа боодлын үйлдвэр хайх</span>
                  <span className="bai-quick-tag">MOQ &lt; 10,000</span>
                  <span className="bai-quick-tag">ISO 9001, BRC</span>
                  <span className="bai-quick-tag">И-мэйл бичих</span>
                  <span className="bai-quick-tag"><i className="fa-solid fa-plus"></i></span>
                </div>
                <div className="bai-input-wrap">
                  <input type="text" className="bai-input" placeholder="Асуулт асууна уу..." />
                  <i className="fa-solid fa-paperclip text-muted cursor-pointer"></i>
                  <i className="fa-solid fa-microphone text-muted cursor-pointer"></i>
                  <button className="bai-send-btn"><i className="fa-solid fa-paper-plane"></i></button>
                </div>
              </div>
            </div>

            {/* Structured Results Panel */}
            <aside className="bai-panel">
              <div className="bai-panel-title"><i className="fa-solid fa-sparkles"></i> AI туслахын үр дүн, санал</div>
              
              <div className="bai-output-block">
                <div className="bai-output-header">
                  <div className="bai-output-title"><i className="fa-solid fa-industry text-muted"></i> Recommended Suppliers</div>
                  <a href="#" className="text-primary small text-decoration-none">Бүгдийг харах <i className="fa-solid fa-chevron-right ms-1"></i></a>
                </div>
                <div className="bai-supplier-scroller">
                  <div className="bai-supplier-card">
                    <div className="bai-supplier-logo" style={{ background: "#1e293b" }}>P</div>
                    <div className="bai-supplier-name">Packaging Pro Co., Ltd.</div>
                    <div className="bai-supplier-meta">Гэрчилгээ: ISO 9001, BRC, FSC<br/>MOQ: 10,000 ширхэг</div>
                  </div>
                  <div className="bai-supplier-card">
                    <div className="bai-supplier-logo" style={{ background: "#10b981" }}>G</div>
                    <div className="bai-supplier-name">GreenPack Industrial</div>
                    <div className="bai-supplier-meta">Гэрчилгээ: ISO 9001, BRC<br/>MOQ: 5,000 ширхэг</div>
                  </div>
                </div>
              </div>

              <div className="bai-output-block">
                <div className="bai-output-header">
                  <div className="bai-output-title"><i className="fa-regular fa-envelope text-muted"></i> Draft Email</div>
                  <a href="#" className="text-primary small text-decoration-none">Бүгдийг харах <i className="fa-solid fa-chevron-right ms-1"></i></a>
                </div>
                <div className="bai-email-preview">
                  <div className="small mb-1">To: <span className="fw-bold">sales@packkorea.co.kr</span></div>
                  <div className="small mb-2">Subject: <span className="text-muted">협력 가능성 관련 문의 드립니다. - INTRODUCTION</span></div>
                  <div className="bai-email-body">
                    안녕하세요, Pack Korea 담당자님,<br/>
                    저희는 몽골의 BUSY.mn 비즈니스 커뮤니티로, 아시아 지역의 신뢰할 수 있는 제조사와의 협력을 지원하고 있습니다...
                  </div>
                </div>
              </div>

              <div className="bai-output-block mb-0">
                <div className="bai-output-header">
                  <div className="bai-output-title"><i className="fa-solid fa-list-check text-muted"></i> Tasks</div>
                  <a href="#" className="text-primary small text-decoration-none">Бүгдийг харах <i className="fa-solid fa-chevron-right ms-1"></i></a>
                </div>
                <div className="d-flex flex-column gap-2">
                  <div className="small d-flex align-items-center justify-content-between p-2 rounded bg-light border">
                    <span className="d-flex align-items-center gap-2"><i className="fa-regular fa-square"></i> Шинэ нийлүүлэгчдэд и-мэйл илгээх</span>
                    <span className="badge bg-warning-subtle text-warning" style={{ fontSize: "0.6rem" }}>Хүлээгдэж буй</span>
                  </div>
                  <div className="small d-flex align-items-center justify-content-between p-2 rounded bg-light border">
                    <span className="d-flex align-items-center gap-2"><i className="fa-regular fa-square-check text-success"></i> Сөүлийн аяллын төлөвлөгөө баталгаажуулах</span>
                    <span className="badge bg-success-subtle text-success" style={{ fontSize: "0.6rem" }}>Дууссан</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {currentTab === 'pitch' && (
          <div className="pd-grid">
            {/* AI Assistant */}
            <div className="bai-chat-box">
              <div className="bai-chat-header">
                <div className="small fw-bold text-dark"><i className="fa-solid fa-robot text-primary me-2"></i> AI туслах</div>
                <div className="d-flex gap-3 text-muted">
                  <i className="fa-solid fa-rotate-right cursor-pointer" style={{ fontSize: "0.8rem" }}></i>
                </div>
              </div>
              <div className="bai-chat-history">
                <div className="bai-msg">
                  <div className="bai-msg-avatar">AI</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Таны төслийн талаар товч мэдээлэл ирүүлнэ үү. Би таны pitch deck-ийн бүтэц, агуулгыг санал болгоход бэлэн.</div>
                    <span className="bai-msg-time">10:24</span>
                  </div>
                </div>
                <div className="bai-msg user">
                  <div className="bai-msg-avatar">U</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">EcoRide - цахилгаан дугуй түрээсийн платформ. Хотын богино зайны зорчих шийдэл.</div>
                    <span className="bai-msg-time">10:25 <i className="fa-solid fa-check-double text-primary ms-1"></i></span>
                  </div>
                </div>
                <div className="bai-msg">
                  <div className="bai-msg-avatar">AI</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Баярлалаа! Төслийнхөө pitch deck-ийн бүтцийг санал болгож байна.<br/><br/>Санал болгож буй бүтэц (9 слайд):<br/>1. Cover<br/>2. Problem<br/>3. Solution<br/>4. Market Size<br/>5. Business Model<br/>6. Traction<br/>7. Team<br/>8. Financials<br/>9. Ask</div>
                    <span className="bai-msg-time">10:25</span>
                  </div>
                </div>
              </div>
              <div className="bai-input-area">
                <div className="bai-input-wrap">
                  <input type="text" className="bai-input" placeholder="Асуулт асууна уу..." />
                  <button className="bai-send-btn"><i className="fa-solid fa-paper-plane"></i></button>
                </div>
                <div className="bai-quick-tags mt-2">
                  <span className="bai-quick-tag">Слайд нэмэх</span>
                  <span className="bai-quick-tag">Агуулга сайжруулах</span>
                  <span className="bai-quick-tag">Сонголт өөрчлөх</span>
                </div>
              </div>
            </div>

            {/* Slide Navigator */}
            <div className="pd-nav-col">
              <div className="pd-nav-list">
                <div className="pd-nav-item active">
                  <div className="pd-nav-num">1</div>
                  <div className="pd-nav-thumb">
                    <div className="p-2 small text-center" style={{ fontSize: "0.4rem" }}>
                      <div className="fw-bold mb-1" style={{ fontSize: "0.6rem", color: "#10b981" }}>EcoRide</div>
                      <div className="text-muted" style={{ fontSize: "0.35rem" }}>Хотын хөдөлгөөнийг...</div>
                      <i className="fa-solid fa-bicycle mt-1 text-primary" style={{ fontSize: "0.8rem" }}></i>
                    </div>
                  </div>
                  <div className="pd-nav-label">1. Cover</div>
                </div>
                <div className="pd-nav-item">
                  <div className="pd-nav-num">2</div>
                  <div className="pd-nav-thumb">
                    <div className="p-2">
                      <div style={{ width: "20px", height: "2px", background: "#e2e8f0", marginBottom: "4px" }}></div>
                      <div style={{ width: "15px", height: "2px", background: "#e2e8f0" }}></div>
                    </div>
                  </div>
                  <div className="pd-nav-label">2. Problem</div>
                </div>
                <div className="pd-nav-item">
                  <div className="pd-nav-num">3</div>
                  <div className="pd-nav-thumb"></div>
                  <div className="pd-nav-label">3. Solution</div>
                </div>
                <div className="pd-nav-item">
                  <div className="pd-nav-num">4</div>
                  <div className="pd-nav-thumb"></div>
                  <div className="pd-nav-label">4. Market Size</div>
                </div>
              </div>
            </div>

            {/* Slide Editor */}
            <div className="pd-editor-col">
              <div className="pd-main-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="fw-bold">Pitch deck бүтээгч</div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-light"><i className="fa-solid fa-expand"></i></button>
                    <button className="btn btn-sm btn-light"><i className="fa-solid fa-pencil"></i></button>
                  </div>
                </div>
                <div className="pd-preview">
                  <div className="row align-items-center h-100">
                    <div className="col-6">
                      <div className="d-flex align-items-center gap-2 mb-4">
                        <div style={{ width: 40, height: 40, background: "#10b981", borderRadius: 8, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800 }}>E</div>
                        <h2 className="fw-bold mb-0">EcoRide</h2>
                      </div>
                      <h1 className="fw-bold mb-3" style={{ fontSize: "2.2rem", lineHeight: 1.2 }}>Хотын хөдөлгөөнийг<br/><span className="text-success">Ногоон, Хялбар</span> болгоё</h1>
                      <p className="text-muted small">Цахилгаан дугуй түрээсийн платформ</p>
                    </div>
                    <div className="col-6 text-center">
                      <i className="fa-solid fa-bicycle text-primary" style={{ fontSize: "8rem", opacity: 0.1, position: "absolute", right: 20, bottom: 20 }}></i>
                      <div className="p-4 rounded-4 bg-light d-inline-block">
                        <i className="fa-solid fa-bicycle text-primary" style={{ fontSize: "5rem" }}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <aside className="d-flex flex-column gap-4">
              <div className="bai-panel" style={{ maxHeight: "none" }}>
                <div className="bai-panel-title">Pitch Deck Structure</div>
                <div className="pd-struct-list">
                  <div className="pd-struct-item">1. Cover <i className="fa-solid fa-check"></i></div>
                  <div className="pd-struct-item">2. Problem <i className="fa-solid fa-check"></i></div>
                  <div className="pd-struct-item">3. Solution <i className="fa-solid fa-check"></i></div>
                </div>
              </div>
              <div className="bai-panel pd-readiness-box" style={{ maxHeight: "none" }}>
                <div className="bai-panel-title">Deck readiness</div>
                <div className="eml-score-circle mx-auto">
                  <svg viewBox="0 0 36 36" className="circular-chart" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="2" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="82, 100" />
                  </svg>
                  <div className="eml-score-val" style={{ color: "var(--bai-text)" }}>82</div>
                </div>
                <div className="small fw-bold">Сайн түвшин</div>
                <div className="text-muted mb-3" style={{ fontSize: "0.65rem" }}>Их сайн байна! Хөрөнгө оруулагчид танилцуулахад бэлэн болж байна.</div>
              </div>
            </aside>
          </div>
        )}

        {currentTab === 'trip' && (
          <div className="tr-grid">
            {/* AI Assistant */}
            <div className="bai-chat-box">
              <div className="bai-chat-header">
                <div className="small fw-bold text-dark"><i className="fa-solid fa-robot text-primary me-2"></i> AI туслах</div>
              </div>
              <div className="bai-chat-history">
                <div className="bai-msg">
                  <div className="bai-msg-avatar">AI</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Сеүл ба Бусан хот руу 4 өдрийн бизнес аялал төлөвлөж өгнө үү. Үйлдвэр уулзалт, B2B networking болон форумд оролцохоор төлөвлөж байна.</div>
                    <span className="bai-msg-time">10:15</span>
                  </div>
                </div>
                <div className="bai-panel mt-3 p-3" style={{ maxHeight: "none", background: "#f8fafc", border: "1px solid #eef0f3" }}>
                  <div className="fw-bold mb-2 small">Аяллын тойм</div>
                  <div className="small mb-1"><i className="fa-solid fa-plane text-muted me-2"></i> Очих хот: <span className="fw-bold">Сеүл -&gt; Бусан (KOR)</span></div>
                  <div className="small mb-1"><i className="fa-regular fa-calendar text-muted me-2"></i> Хугацаа: <span className="text-muted">2025.06.16 - 06.19 (4ө)</span></div>
                  <div className="small mb-2"><i className="fa-solid fa-wallet text-muted me-2"></i> Төсөв: <span className="fw-bold">3,250,000 ₮</span></div>
                  <button className="btn btn-primary btn-sm w-100">Хөтөлбөрийг харуулах</button>
                </div>
              </div>
              <div className="bai-input-area">
                <div className="bai-input-wrap">
                  <input type="text" className="bai-input" placeholder="Асуулт асууна уу..." />
                  <button className="bai-send-btn"><i className="fa-solid fa-paper-plane"></i></button>
                </div>
              </div>
            </div>

            {/* Itinerary */}
            <div className="tr-center-col d-flex flex-column gap-4">
              <div className="bai-panel" style={{ maxHeight: "none" }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="fw-bold">Хөтөлбөрийн төлөвлөгөө</div>
                </div>
                <div className="tr-itinerary">
                  <div className="tr-day-card">
                    <div className="tr-day-meta">
                      <div className="tr-day-num">Өдөр</div>
                      <div className="tr-day-val">1</div>
                      <div className="tr-day-date">06/16 Да</div>
                    </div>
                    <div className="tr-day-content">
                      <div className="tr-event active">
                        <div className="tr-event-time">09:30 Сеүлд ирэх &amp; Үйлдвэр уулзалт</div>
                        <div className="tr-event-title text-muted small">ICN нисэх буудалд ирэх, Hyundai Motor Studio уулзалт</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <aside className="d-flex flex-column gap-4">
              <div className="bai-panel" style={{ maxHeight: "none" }}>
                <div className="bai-panel-title">Төсөв (MNT)</div>
                <div className="tr-budget-list">
                  <div className="tr-budget-row"><span className="tr-budget-lbl">Онгоцны тийз</span> <span className="tr-budget-val">1,280,000 ₮</span></div>
                  <div className="tr-budget-row"><span className="tr-budget-lbl">Зочид буудал</span> <span className="tr-budget-val">960,000 ₮</span></div>
                  <div className="tr-budget-row fw-bold"><span className="text-dark">Нийт дүн</span> <span className="text-primary">3,250,000 ₮</span></div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {currentTab === 'translate' && (
          <div className="ts-grid">
            {/* Translation Workspace */}
            <div className="ts-workspace">
              <div className="ts-sub-tabs">
                <div className="ts-sub-tab active">Мэссэж</div>
                <div className="ts-sub-tab">Имэйл</div>
                <div className="ts-sub-tab">Баримт бичиг</div>
              </div>
              <div className="ts-pane-container">
                <div className="ts-pane">
                  <div className="ts-pane-header">
                    <div className="small fw-bold text-muted">Эх хэл</div>
                    <div className="ts-lang-select">
                      <div className="ts-lang-opt active">MN</div>
                      <div className="ts-lang-opt">EN</div>
                    </div>
                  </div>
                  <textarea className="ts-text-area" placeholder="Орчуулах текстээ энд оруулна уу..." defaultValue={"Эрхэм хүндэт харилцагч танд...\nНийт үнэ: 45,000,000₮"}></textarea>
                </div>
                <div className="ts-pane">
                  <div className="ts-pane-header">
                    <div className="ts-lang-select">
                      <div className="ts-lang-opt active">EN</div>
                      <div className="ts-lang-opt">KR</div>
                    </div>
                    <div className="small fw-bold text-primary">Орчуулах хэл</div>
                  </div>
                  <div className="ts-text-area" style={{ background: "#fcfdfe" }}>
                    <div className="fw-bold mb-2">Dear Valued Customer,</div>
                    Thank you for your continued trust...
                  </div>
                </div>
              </div>
            </div>

            {/* Translation Intelligence Panel */}
            <aside className="d-flex flex-column gap-4">
              <div className="bai-panel" style={{ maxHeight: "none" }}>
                <div className="bai-panel-title">Translation Memory</div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="small text-muted">Нийт өгүүлбэр: <span className="fw-bold text-dark">2,458</span></div>
                  <div className="small text-muted">Давхардал: <span className="fw-bold text-dark">68%</span></div>
                </div>
                <div className="ts-score-bar"><div className="ts-score-fill" style={{ width: "68%" }}></div></div>
              </div>
              <div className="bai-panel" style={{ maxHeight: "none" }}>
                <div className="bai-panel-title">Quality check</div>
                <div className="d-flex justify-content-between align-items-end">
                  <div>
                    <div className="small text-muted">Ерөнхий үнэлгээ</div>
                    <div className="h3 fw-bold mb-0">97 <span className="small text-muted" style={{ fontSize: "0.8rem" }}>/ 100</span></div>
                  </div>
                  <div className="text-success small fw-bold mb-1">Маш сайн</div>
                </div>
                <div className="ts-score-bar"><div className="ts-score-fill" style={{ width: "97%" }}></div></div>
              </div>
            </aside>
          </div>
        )}

        {currentTab === 'email' && (
          <div className="eml-grid">
            <div className="bai-chat-box">
              <div className="bai-chat-header">
                <div className="small fw-bold text-dark"><i className="fa-solid fa-robot text-primary me-2"></i> AI туслах</div>
              </div>
              <div className="bai-chat-history">
                <div className="bai-msg user">
                  <div className="bai-msg-avatar">U</div>
                  <div className="bai-msg-content">
                    <div className="bai-msg-bubble">Бид тоног төхөөрөмж нийлүүлэх түншлэл тогтоох зорилгоор анхны албан ёсны и-мэйл илгээх гэж байна.</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="eml-editor-card">
              <div className="bai-panel-title mb-4">И-мэйл бичих</div>
              <div className="eml-field">
                <div className="eml-field-lbl">To</div>
                <input type="text" className="eml-input" defaultValue="Mr. Kim Jaehoon <jaehoon.kim@greenpack.co.kr>" />
              </div>
              <div className="eml-field">
                <div className="eml-field-lbl">Subject</div>
                <input type="text" className="eml-input" defaultValue="Түншлэл боломжийн талаар танилцах хүсэлт / Introduction to explore partnership" />
              </div>
              <div className="eml-content-area" contentEditable="true" suppressContentEditableWarning={true}>
                Эрхэм хүндэт ноён Ким Жэхүүн танд,<br/><br/>
                Би PACK KOREA ХХК-ийн борлуулалтын менежер Мөнхбаяр байна...
              </div>
            </div>
            
            <aside className="d-flex flex-column gap-4">
              <div className="bai-panel" style={{ maxHeight: "none" }}>
                <div className="bai-output-header">
                  <div className="bai-output-title"><i className="fa-solid fa-file-export text-muted"></i> Draft Email</div>
                  <span className="text-success small fw-bold">AI <i className="fa-solid fa-check"></i></span>
                </div>
                <button className="btn btn-primary w-100 mb-2 py-2 fw-bold" style={{ fontSize: "0.8rem" }}>Хуулах</button>
              </div>
            </aside>
          </div>
        )}

        {/* Value Features */}
        <div className="bai-feature-row mt-5">
          <div className="bai-feature-card">
            <div className="bai-feature-icon"><i className="fa-regular fa-clock"></i></div>
            <div>
              <div className="fw-bold small">Цаг хэмнэлт</div>
              <div className="text-muted" style={{ fontSize: "0.7rem" }}>Хүсэлтээ хэлэхэд мэдээлэл, захидал, төлөвлөгөөг хурдан бэлдэнэ.</div>
            </div>
          </div>
          <div className="bai-feature-card">
            <div className="bai-feature-icon"><i className="fa-solid fa-globe"></i></div>
            <div>
              <div className="fw-bold small">Олон хэлний дэмжлэг</div>
              <div className="text-muted" style={{ fontSize: "0.7rem" }}>Монгол, Англи, Хятад, Солонгос хэлээр харилцаж, орчуулж тусална.</div>
            </div>
          </div>
          <div className="bai-feature-card">
            <div className="bai-feature-icon"><i className="fa-solid fa-user-check"></i></div>
            <div>
              <div className="fw-bold small">Хүнээр хянагдсан</div>
              <div className="text-muted" style={{ fontSize: "0.7rem" }}>AI санал болгосон контентыг манай баг хянаж, чанарыг баталгаажуулна.</div>
            </div>
          </div>
        </div>

        {/* Utilities Row */}
        <div className="bai-utility-grid">
          <div className="bai-upload-box">
            <div className="fw-bold small text-start">Баримт хавсаргах</div>
            <div className="bai-upload-zone">
              <i className="fa-solid fa-cloud-arrow-up fs-2 text-muted mb-3"></i><br/>
              <span className="small">Файл чирж оруулна уу<br/>эсвэл <span className="text-primary fw-bold">сонгох</span></span>
            </div>
          </div>

          <div className="bai-lang-box">
            <div className="fw-bold small text-start mb-3">Хэл сонгох</div>
            <div className="bai-lang-grid">
              <button className="bai-lang-btn active">MN</button>
              <button className="bai-lang-btn">EN</button>
              <button className="bai-lang-btn">CN</button>
              <button className="bai-lang-btn">KR</button>
            </div>
          </div>

          <div className="bai-history-box">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fw-bold small"><i className="fa-regular fa-clock me-2"></i> Сүүлд ашигласан асуултууд</div>
              <a href="#" className="text-primary small text-decoration-none">Бүгдийг харах <i className="fa-solid fa-chevron-right ms-1" style={{ fontSize: "0.6rem" }}></i></a>
            </div>
            <div className="bai-history-list">
              <div className="bai-history-item">
                <span className="text-truncate" style={{ maxWidth: 250 }}>БНХАУ-аас сав баглаа боодлын үйлдвэр...</span>
                <span className="text-muted small">10:25</span>
              </div>
              <div className="bai-history-item">
                <span className="text-truncate">Pitch deck бүтэц гарга</span>
                <span className="text-muted small">10:29</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
