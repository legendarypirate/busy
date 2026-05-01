import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="platform-layout">
      {/* Sidebar */}
      <aside className="platform-sidebar" id="platformSidebar">
        <div className="platform-sidebar-header">
          <Link href="/" className="platform-logo">BUSY.mn</Link>
          <button className="platform-sidebar-close d-md-none" type="button" id="sidebarCloseBtn">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="platform-sidebar-menu">
          <div className="platform-menu-label">Үндсэн</div>
          <Link href="/dashboard" className="platform-menu-item active">
            <i className="fa-solid fa-chart-pie"></i> Тойм
          </Link>
          <Link href="/dashboard/trips" className="platform-menu-item">
            <i className="fa-solid fa-paper-plane"></i> Аялалууд
          </Link>
          <Link href="/dashboard/events" className="platform-menu-item">
            <i className="fa-solid fa-calendar-days"></i> Хурал, эвентүүд
          </Link>
          <Link href="/dashboard/registrations" className="platform-menu-item">
            <i className="fa-solid fa-user-check"></i> Бүртгэлүүд
          </Link>
          
          <div className="platform-menu-label mt-4">Санхүү</div>
          <Link href="/dashboard/payments" className="platform-menu-item">
            <i className="fa-solid fa-credit-card"></i> Төлбөр, нэхэмжлэх
          </Link>
          
          <div className="platform-menu-label mt-4">Тохиргоо</div>
          <Link href="/dashboard/profile" className="platform-menu-item">
            <i className="fa-solid fa-building"></i> Байгууллагын профайл
          </Link>
          <Link href="/dashboard/settings" className="platform-menu-item">
            <i className="fa-solid fa-gear"></i> Тохиргоо
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="platform-main">
        {/* Header */}
        <header className="platform-header">
          <div className="d-flex align-items-center gap-3">
            <button className="platform-mobile-toggle d-md-none" type="button" id="sidebarOpenBtn">
              <i className="fa-solid fa-bars"></i>
            </button>
            <h2 className="platform-page-title mb-0 d-none d-sm-block">Удирдлагын самбар</h2>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <div className="dropdown">
              <button className="btn btn-light rounded-circle position-relative p-2" type="button" data-bs-toggle="dropdown" aria-expanded="false" style={{ width: "40px", height: "40px" }}>
                <i className="fa-regular fa-bell"></i>
                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                  <span className="visually-hidden">Шинэ мэдэгдэл</span>
                </span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" style={{ width: "300px" }}>
                <li><h6 className="dropdown-header">Мэдэгдлүүд</h6></li>
                <li><a className="dropdown-item py-2" href="#">Шинэ захиалга орж ирлээ</a></li>
                <li><a className="dropdown-item py-2" href="#">Аялал амжилттай үүслээ</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item text-center text-primary small" href="#">Бүгдийг харах</a></li>
              </ul>
            </div>
            
            <div className="dropdown">
              <button className="btn p-0 d-flex align-items-center gap-2 border-0 bg-transparent" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Profile" className="rounded-circle" width="40" height="40" />
                <div className="text-start d-none d-md-block">
                  <div className="fw-semibold lh-1 text-dark" style={{ fontSize: "0.9rem" }}>Админ</div>
                  <div className="text-muted small">admin@busy.mn</div>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2">
                <li><Link className="dropdown-item py-2" href="/dashboard/profile"><i className="fa-regular fa-user me-2 opacity-50"></i> Профайл</Link></li>
                <li><Link className="dropdown-item py-2" href="/dashboard/settings"><i className="fa-solid fa-gear me-2 opacity-50"></i> Тохиргоо</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item py-2 text-danger"><i className="fa-solid fa-arrow-right-from-bracket me-2 opacity-50"></i> Гарах</button></li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="platform-content p-3 p-md-4">
          {children}
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      <div className="platform-sidebar-overlay" id="sidebarOverlay"></div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
            var sidebar = document.getElementById('platformSidebar');
            var overlay = document.getElementById('sidebarOverlay');
            var openBtn = document.getElementById('sidebarOpenBtn');
            var closeBtn = document.getElementById('sidebarCloseBtn');

            function toggleSidebar() {
                sidebar.classList.toggle('show');
                overlay.classList.toggle('show');
                document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
            }

            if (openBtn) openBtn.addEventListener('click', toggleSidebar);
            if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
            if (overlay) overlay.addEventListener('click', toggleSidebar);
        });
      ` }} />
    </div>
  );
}
