import Image from "next/image";
import Link from "next/link";

/** Mirrors legacy `platform-home.php` dashboard (`?panel=dashboard`) — demo metrics + table + widgets. */
export default function DashboardPanel() {
  return (
    <div className="pl-main-grid">
      <div className="pl-main-content">
        <h1 className="pl-main-title">Зохион байгуулагчийн булан</h1>
        <p className="pl-main-desc mb-4">
          Арга хэмжээ үүсгэх, оролцогч бүртгэх, хуваарь удирдах, тайлан авах цогц удирдлагын систем.
        </p>
        <div className="pl-org-metric-grid">
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-calendar-check" /> Нийт арга хэмжээ
            </div>
            <div className="pl-org-metric-val">128</div>
            <div className="pl-org-metric-meta up">
              <i className="fa-solid fa-caret-up" /> 18%{" "}
              <span className="text-muted fw-normal">сүүлийн 30 хоногт</span>
            </div>
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-clock" /> Удахгүй болох
            </div>
            <div className="pl-org-metric-val">24</div>
            <div className="pl-org-metric-meta text-muted">Дараагийн 30 хоногт</div>
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-user" /> Нийт бүртгэл
            </div>
            <div className="pl-org-metric-val">2,458</div>
            <div className="pl-org-metric-meta up">
              <i className="fa-solid fa-caret-up" /> 24%{" "}
              <span className="text-muted fw-normal">нийт өсөлт</span>
            </div>
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-circle-check" /> Ирц бүртгэсэн
            </div>
            <div className="pl-org-metric-val">1,783</div>
            <div className="pl-org-metric-meta" style={{ color: "#10b981" }}>
              <b>72%</b> <span className="text-muted fw-normal">ирцийн хувь</span>
            </div>
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-solid fa-coins" /> Нийт орлого
            </div>
            <div className="pl-org-metric-val" style={{ fontSize: "1rem" }}>
              327,450,000₮
            </div>
            <div className="pl-org-metric-meta up">
              <i className="fa-solid fa-caret-up" /> 32%{" "}
              <span className="text-muted fw-normal">сүүлийн 30 хоногт</span>
            </div>
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-hourglass-half" /> Хүлээгдэж буй
            </div>
            <div className="pl-org-metric-val">16</div>
            <div className="pl-org-metric-meta text-warning">Зөвшөөрөл хүлээгдэж буй</div>
          </div>
        </div>
        <div className="pl-btn-row">
          <Link href="/platform/events" className="btn-pl btn-pl-primary text-decoration-none">
            <i className="fa-solid fa-plus" /> Шинэ арга хэмжээ үүсгэх
          </Link>
          <Link href="/platform/events" className="btn-pl text-decoration-none">
            <i className="fa-solid fa-b" style={{ color: "#e63946" }} /> BNI хурал үүсгэх
          </Link>
          <Link href="/platform/events" className="btn-pl text-decoration-none">
            <i className="fa-solid fa-m" style={{ color: "#7c3aed" }} /> MEGA Visitor үүсгэх
          </Link>
          <Link href="/platform/events" className="btn-pl text-decoration-none">
            <i className="fa-solid fa-store" /> Экспо үүсгэх
          </Link>
          <Link href="/platform/trips" className="btn-pl text-decoration-none">
            <i className="fa-solid fa-plane-up" /> Аялал нэмэх
          </Link>
        </div>
        <div className="pl-table-card">
          <div className="pl-table-header">
            <div className="pl-table-title">Арга хэмжээний удирдлага</div>
            <div className="pl-filter-row">
              <select className="pl-filter-select">
                <option>Төрөл: Бүх</option>
              </select>
              <select className="pl-filter-select">
                <option>Огноо: Бүх</option>
              </select>
              <select className="pl-filter-select">
                <option>Статус: Бүх</option>
              </select>
              <div className="pl-search-wrap">
                <i className="fa-solid fa-magnifying-glass pl-search-icon" />
                <input type="text" className="pl-search-input" placeholder="Хайх..." />
              </div>
              <button type="button" className="pl-filter-btn" title="Шүүлтүүр">
                <i className="fa-solid fa-sliders" />
              </button>
              <div className="pl-view-toggle">
                <button className="active" type="button">
                  <i className="fa-solid fa-list" />
                </button>
                <button type="button">
                  <i className="fa-solid fa-table-cells-large" />
                </button>
              </div>
            </div>
          </div>
          <table className="pl-table">
            <thead>
              <tr>
                <th>Арга хэмжээ</th>
                <th>Төрөл</th>
                <th>Огноо</th>
                <th>Байршил</th>
                <th>Бүртгэл</th>
                <th>Статус</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="pl-event-item">
                    <Image
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=80&auto=format&fit=crop"
                      alt=""
                      width={56}
                      height={56}
                      className="pl-event-img"
                      unoptimized
                    />
                    <div>
                      <div className="fw-bold">BNI 7 хоногийн бизнес хурал</div>
                      <div className="smaller text-muted">#EVT-2025-058</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="pl-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                    BNI
                  </span>
                </td>
                <td>
                  <div className="fw-bold">2025.05.23 (Ба)</div>
                  <div className="smaller text-muted">07:00–09:00</div>
                </td>
                <td>
                  <div className="fw-bold">Shangri-La Hotel</div>
                  <div className="smaller text-muted">Улаанбаатар</div>
                </td>
                <td>
                  <div className="smaller fw-bold mb-1">128 / 150</div>
                  <div className="progress" style={{ height: 4, borderRadius: 2 }}>
                    <div className="progress-bar bg-primary" style={{ width: "85%" }} />
                  </div>
                </td>
                <td>
                  <span className="pl-badge" style={{ background: "#ecfdf5", color: "#10b981" }}>
                    Идэвхтэй
                  </span>
                </td>
                <td>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-user-plus" />
                    </button>
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-ellipsis-vertical" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="pl-event-item">
                    <Image
                      src="https://images.unsplash.com/photo-1540575861501-7ce05b47ab71?w=80&auto=format&fit=crop"
                      alt=""
                      width={56}
                      height={56}
                      className="pl-event-img"
                      unoptimized
                    />
                    <div>
                      <div className="fw-bold">MEGA Visitor хурал</div>
                      <div className="smaller text-muted">#EVT-2025-057</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="pl-badge" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                    MEGA Visitor
                  </span>
                </td>
                <td>
                  <div className="fw-bold">2025.05.29 (Пү)</div>
                  <div className="smaller text-muted">14:00–17:00</div>
                </td>
                <td>
                  <div className="fw-bold">Corporate Hotel</div>
                  <div className="smaller text-muted">Улаанбаатар</div>
                </td>
                <td>
                  <div className="smaller fw-bold mb-1">96 / 120</div>
                  <div className="progress" style={{ height: 4, borderRadius: 2 }}>
                    <div className="progress-bar bg-primary" style={{ width: "80%" }} />
                  </div>
                </td>
                <td>
                  <span className="pl-badge" style={{ background: "#ecfdf5", color: "#10b981" }}>
                    Идэвхтэй
                  </span>
                </td>
                <td>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-user-plus" />
                    </button>
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-ellipsis-vertical" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="pl-event-item">
                    <Image
                      src="https://images.unsplash.com/photo-1561489422-45027f1cbc13?w=80&auto=format&fit=crop"
                      alt=""
                      width={56}
                      height={56}
                      className="pl-event-img"
                      unoptimized
                    />
                    <div>
                      <div className="fw-bold">Mongolia Mining Expo Meetup</div>
                      <div className="smaller text-muted">#EVT-2025-056</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="pl-badge" style={{ background: "#fff7ed", color: "#ea580c" }}>
                    Экспо
                  </span>
                </td>
                <td>
                  <div className="fw-bold">2025.06.12 (Пү)</div>
                  <div className="smaller text-muted">10:00–16:00</div>
                </td>
                <td>
                  <div className="fw-bold">Blue Sky Tower</div>
                  <div className="smaller text-muted">Улаанбаатар</div>
                </td>
                <td>
                  <div className="smaller fw-bold mb-1">210 / 250</div>
                  <div className="progress" style={{ height: 4, borderRadius: 2 }}>
                    <div className="progress-bar bg-warning" style={{ width: "84%" }} />
                  </div>
                </td>
                <td>
                  <span className="pl-badge" style={{ background: "#fff7ed", color: "#f59e0b" }}>
                    Хүлээгдэж буй
                  </span>
                </td>
                <td>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-user-plus" />
                    </button>
                    <button type="button" className="pl-act-btn">
                      <i className="fa-solid fa-ellipsis-vertical" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="p-3 border-top d-flex justify-content-between align-items-center">
            <div className="smaller text-muted">Нийт 5 арга хэмжээ</div>
            <div className="d-flex gap-2 align-items-center">
              <div className="d-flex border rounded overflow-hidden">
                <button type="button" className="btn btn-sm btn-light">
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button type="button" className="btn btn-sm btn-primary px-3">
                  1
                </button>
                <button type="button" className="btn btn-sm btn-light">
                  2
                </button>
                <button type="button" className="btn btn-sm btn-light">
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
              <select className="form-select form-select-sm" style={{ width: 110 }}>
                <option>10 / хуудас</option>
              </select>
            </div>
          </div>
        </div>
        <div className="pl-analytics-grid">
          <div className="pl-analytics-card">
            <div className="pl-widget-head">
              <span>Бүртгэлийн суваг (Funnel)</span>
            </div>
            <div className="pl-funnel-layout">
              <div className="pl-funnel-visual">
                <div className="pl-funnel-layer l1" />
                <div className="pl-funnel-layer l2" />
                <div className="pl-funnel-layer l3" />
                <div className="pl-funnel-layer l4" />
              </div>
              <div className="pl-funnel-legend">
                <div className="pl-funnel-legend-item">
                  <span>Нийт сонирхсон</span>
                  <b>3,245</b>
                </div>
                <div className="pl-funnel-legend-item">
                  <span>Бүртгүүлсэн</span>
                  <b>2,458 (75.7%)</b>
                </div>
                <div className="pl-funnel-legend-item">
                  <span>Төлбөр төлсөн</span>
                  <b>1,942 (59.8%)</b>
                </div>
                <div className="pl-funnel-legend-item">
                  <span>Ирц бүртгэсэн</span>
                  <b>1,783 (54.9%)</b>
                </div>
              </div>
            </div>
          </div>
          <div className="pl-analytics-card">
            <div className="pl-widget-head">
              <span>Оролцогчийн статус</span>
            </div>
            <div className="pl-donut-wrap">
              <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto" }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="50 50"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="25 75"
                    strokeDashoffset="-50"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="22 78"
                    strokeDashoffset="-75"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="3 97"
                    strokeDashoffset="-97"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                    2,458
                  </div>
                  <div className="smaller text-muted">Нийт</div>
                </div>
              </div>
              <div className="pl-donut-legend">
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#10b981" }} />
                    Баталгаажсан
                  </span>
                  <span>1,246 (50.7%)</span>
                </div>
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#f59e0b" }} />
                    Хүлээгдэж буй
                  </span>
                  <span>612 (24.9%)</span>
                </div>
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#3b82f6" }} />
                    Ирц бүртгэсэн
                  </span>
                  <span>528 (21.5%)</span>
                </div>
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#ef4444" }} />
                    Цуцлагдсан
                  </span>
                  <span>72 (2.9%)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pl-analytics-card">
            <div className="pl-split-card">
              <div>
                <div className="pl-widget-head">
                  <span>Сүүлийн оролцогчид</span>
                  <Link href="#" className="smaller text-primary text-decoration-none">
                    Бүгдийг харах
                  </Link>
                </div>
                <div className="pl-attendee-list">
                  <div className="pl-attendee-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://i.pravatar.cc/32?u=10" className="rounded-circle" width={32} height={32} alt="" />
                    <div className="flex-grow-1">
                      <div className="fw-bold smaller">Энхбаяр С.</div>
                      <div className="smaller text-muted">Monpolyment Group</div>
                    </div>
                    <span className="pl-badge" style={{ background: "#ecfdf5", color: "#10b981", fontSize: "0.65rem" }}>
                      Баталгаажсан
                    </span>
                  </div>
                  <div className="pl-attendee-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://i.pravatar.cc/32?u=11" className="rounded-circle" width={32} height={32} alt="" />
                    <div className="flex-grow-1">
                      <div className="fw-bold smaller">Болормаа Д.</div>
                      <div className="smaller text-muted">Golomt Bank</div>
                    </div>
                    <span className="pl-badge" style={{ background: "#fff7ed", color: "#f97316", fontSize: "0.65rem" }}>
                      Хүлээгдэж буй
                    </span>
                  </div>
                  <div className="pl-attendee-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://i.pravatar.cc/32?u=12" className="rounded-circle" width={32} height={32} alt="" />
                    <div className="flex-grow-1">
                      <div className="fw-bold smaller">Отгонбаяр Н.</div>
                      <div className="smaller text-muted">3 хоногийн өмнө</div>
                    </div>
                    <span className="pl-badge" style={{ background: "#fef2f2", color: "#ef4444", fontSize: "0.65rem" }}>
                      Цуцлагдсан
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="pl-widget-head">
                  <span>Хуваарь бүтээгч</span>
                  <Link href="#" className="smaller text-primary text-decoration-none">
                    + Нэмэх
                  </Link>
                </div>
                <div className="pl-schedule-list">
                  <div className="pl-schedule-item">
                    <div className="pl-schedule-time">09:00–09:30</div>
                    <div className="pl-schedule-title">Бүртгэл & Кофе</div>
                    <div className="pl-schedule-btn">
                      <i className="fa-solid fa-pen-to-square" />
                    </div>
                  </div>
                  <div className="pl-schedule-item">
                    <div className="pl-schedule-time">09:30–10:15</div>
                    <div className="pl-schedule-title">Нээлтийн үг</div>
                    <div className="pl-schedule-btn">
                      <i className="fa-solid fa-pen-to-square" />
                    </div>
                  </div>
                  <div className="pl-schedule-item">
                    <div className="pl-schedule-time">10:15–11:00</div>
                    <div className="pl-schedule-title">Илтгэл: Бизнес давуу тал</div>
                    <div className="pl-schedule-btn">
                      <i className="fa-solid fa-pen-to-square" />
                    </div>
                  </div>
                  <div className="pl-schedule-item">
                    <div className="pl-schedule-time">11:00–12:00</div>
                    <div className="pl-schedule-title">Панел хэлэлцүүлэг</div>
                    <div className="pl-schedule-btn">
                      <i className="fa-solid fa-pen-to-square" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pl-widgets-sidebar">
        <div className="pl-widget">
          <div className="pl-widget-head">
            <span>Түргэн үйлдлүүд</span>
          </div>
          <div className="pl-quick-action-list">
            <div className="pl-quick-action">
              <div className="pl-icon-box">
                <i className="fa-regular fa-envelope" />
              </div>
              <div>
                <div className="fw-bold smaller">Сануулга илгээх</div>
                <div className="smaller text-muted">И-мэйл, SMS-ээр илгээх</div>
              </div>
            </div>
            <div className="pl-quick-action">
              <div className="pl-icon-box">
                <i className="fa-solid fa-file-export" />
              </div>
              <div>
                <div className="fw-bold smaller">Жагсаалт экспортлох</div>
                <div className="smaller text-muted">Excel, CSV файл татах</div>
              </div>
            </div>
            <div className="pl-quick-action">
              <div className="pl-icon-box">
                <i className="fa-solid fa-qrcode" />
              </div>
              <div>
                <div className="fw-bold smaller">QR ирц бүртгэл</div>
                <div className="smaller text-muted">QR код уншуулж бүртгэх</div>
              </div>
            </div>
            <div className="pl-quick-action">
              <div className="pl-icon-box">
                <i className="fa-solid fa-print" />
              </div>
              <div>
                <div className="fw-bold smaller">Бэйж хэвлэх</div>
                <div className="smaller text-muted">Оролцогчийн бэйж хэвлэх</div>
              </div>
            </div>
            <div className="pl-quick-action">
              <div className="pl-icon-box">
                <i className="fa-solid fa-share-nodes" />
              </div>
              <div>
                <div className="fw-bold smaller">Нийтлэх / Хуваалцах</div>
                <div className="smaller text-muted">Сошиал медиад нийтлэх</div>
              </div>
            </div>
          </div>
        </div>
        <div className="pl-widget">
          <div className="pl-widget-head">
            <span>Шуурхай тойм</span>
            <select className="smaller border-0 bg-transparent fw-bold text-muted">
              <option>7 хоног</option>
              <option>30 хоног</option>
            </select>
          </div>
          <svg viewBox="0 0 280 80" width="100%" height="80">
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,70 35,50 70,60 105,30 140,45 175,20 210,35 245,15 280,25"
            />
            <g fill="#2563eb">
              <circle cx="105" cy="30" r="3" />
              <circle cx="175" cy="20" r="3" />
              <circle cx="245" cy="15" r="3" />
            </g>
          </svg>
          <div className="d-flex justify-content-between mt-2">
            <div>
              <div className="smaller text-muted fw-bold">Шинэ бүртгэл</div>
              <div className="fw-bold">
                432{" "}
                <span className="smaller" style={{ color: "#10b981" }}>
                  <i className="fa-solid fa-caret-up" /> 18%
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="smaller text-muted fw-bold">Ирцийн хувь</div>
              <div className="fw-bold">
                71%{" "}
                <span className="smaller" style={{ color: "#10b981" }}>
                  <i className="fa-solid fa-caret-up" /> 6%
                </span>
              </div>
            </div>
          </div>
          <hr className="my-3 opacity-10" />
          <div className="smaller fw-bold text-muted mb-2">Топ арга хэмжээ</div>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-between smaller fw-bold">
              <span>1. BNI 7 хоногийн бизнес хурал</span>
              <span>128</span>
            </div>
            <div className="d-flex justify-content-between smaller fw-bold">
              <span>2. Mongolia Mining Expo...</span>
              <span>108</span>
            </div>
            <div className="d-flex justify-content-between smaller fw-bold">
              <span>3. MEGA Visitor хурал</span>
              <span>96</span>
            </div>
          </div>
        </div>
        <div className="pl-widget">
          <div className="pl-widget-head">
            <span>Төлбөр & Тикет</span>
            <Link href="#" className="smaller text-primary text-decoration-none">
              + Нэмэх
            </Link>
          </div>
          <div className="pl-ticket-box">
            <div className="pl-ticket-row">
              <span>Ticket - Ерөнхий оролцогч</span>
              <span className="text-success">
                <i className="fa-solid fa-circle-check" /> Идэвхтэй
              </span>
            </div>
            <div className="pl-ticket-row">
              <span className="text-muted">Үнэ: 150,000₮</span>
              <span className="smaller text-muted">Төлбөртэй</span>
            </div>
            <hr className="my-2 opacity-10" />
            <div className="pl-ticket-row">
              <span>Ticket - BNI гишүүн</span>
              <span className="text-success">
                <i className="fa-solid fa-circle-check" /> Идэвхтэй
              </span>
            </div>
            <div className="pl-ticket-row">
              <span className="text-muted">Үнэ: Үнэгүй</span>
              <span className="smaller text-muted">Төлбөргүй</span>
            </div>
          </div>
          <div className="d-flex justify-content-between mt-3 align-items-end">
            <div>
              <div className="smaller text-muted fw-bold">Нийт орлого</div>
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                23,450,000₮
              </div>
            </div>
            <div className="text-end">
              <div className="smaller text-muted fw-bold">Төлбөрийн төрөл</div>
              <div className="d-flex gap-1 justify-content-end mt-1">
                <span className="pl-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  QPay
                </span>
                <span className="pl-badge" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                  Invoice
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
