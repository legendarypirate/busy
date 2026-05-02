import Link from "next/link";
import PlatformBodyClass from "@/components/platform/PlatformBodyClass";
import DashboardSidebarNav from "./DashboardSidebarNav";
import DashboardSidebarToggle from "./DashboardSidebarToggle";
import "@/styles/dashboard-shell.css";

/** Session reads must not be served from the full-route cache without the real request cookies. */
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PlatformBodyClass />
      <div className="pl-wrapper dash-shell">
        <aside className="pl-sidebar pl-sidebar--drawer" id="dashSidebar">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
            <Link href="/" className="pl-logo text-decoration-none d-block mb-0 py-1">
              BUSY<span>.mn</span>
            </Link>
            <button
              type="button"
              className="btn btn-link d-md-none p-1 text-muted lh-1"
              id="dashSidebarClose"
              aria-label="Хаах"
            >
              <i className="fa-solid fa-xmark fa-lg" aria-hidden="true" />
            </button>
          </div>

          <DashboardSidebarNav />
        </aside>

        <main className="pl-content d-flex flex-column min-vh-100">
          <header className="pl-dash-topbar d-flex align-items-center gap-3 flex-wrap">
            <button type="button" className="btn btn-light d-md-none border" id="dashSidebarOpen" aria-label="Цэс нээх">
              <i className="fa-solid fa-bars" aria-hidden="true" />
            </button>
            <h1 className="h6 fw-bold mb-0 text-truncate">Удирдлагын самбар</h1>

            <div className="ms-auto d-flex align-items-center gap-2">
              <div className="dropdown">
                <button
                  className="btn btn-light rounded-circle position-relative p-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ width: 40, height: 40 }}
                >
                  <i className="fa-regular fa-bell" aria-hidden="true" />
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">Шинэ мэдэгдэл</span>
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" style={{ width: 300 }}>
                  <li>
                    <h6 className="dropdown-header">Мэдэгдлүүд</h6>
                  </li>
                  <li>
                    <span className="dropdown-item py-2 text-muted small">Одоогоор хоосон</span>
                  </li>
                </ul>
              </div>

              <div className="dropdown">
                <button
                  className="btn p-0 d-flex align-items-center gap-2 border-0 bg-transparent"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff"
                    alt=""
                    className="rounded-circle"
                    width={36}
                    height={36}
                  />
                  <div className="text-start d-none d-sm-block">
                    <div className="fw-semibold lh-1 text-dark" style={{ fontSize: "0.85rem" }}>
                      Админ
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                      admin@busy.mn
                    </div>
                  </div>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2">
                  <li>
                    <Link className="dropdown-item py-2" href="/dashboard/profile">
                      <i className="fa-regular fa-user me-2 opacity-50" aria-hidden="true" /> Профайл
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" href="/dashboard/settings">
                      <i className="fa-solid fa-gear me-2 opacity-50" aria-hidden="true" /> Тохиргоо
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <Link className="dropdown-item py-2 text-danger" href="/auth/logout">
                      <i className="fa-solid fa-arrow-right-from-bracket me-2 opacity-50" aria-hidden="true" /> Гарах
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </header>

          <div className="flex-grow-1" style={{ background: "var(--pl-bg, #f8fafc)" }}>
            {children}
          </div>
        </main>

        <div className="pl-dash-overlay" id="dashSidebarOverlay" aria-hidden="true" />
      </div>
      <DashboardSidebarToggle />
    </>
  );
}
