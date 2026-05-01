'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/img/bsy.png" alt="BUSY.mn" height="32" />
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto align-items-lg-center">
            <li className="nav-item">
              <Link className={`nav-link ${pathname === '/' ? 'active' : ''}`} href="/">Нүүр</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname?.startsWith('/trips') ? 'active' : ''}`} href="/trips">Бизнес аялал</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname?.startsWith('/events') ? 'active' : ''}`} href="/events">Хурал/Эвент</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname?.startsWith('/companies') ? 'active' : ''}`} href="/companies">Үйлдвэр холболт</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname?.startsWith('/investments') ? 'active' : ''}`} href="/investments">Хөрөнгө оруулалт</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname?.startsWith('/members') ? 'active' : ''}`} href="/members">Гишүүд</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname?.startsWith('/news') ? 'active' : ''}`} href="/news">Мэдлэг</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname?.startsWith('/busy-ai') ? 'active' : ''}`} href="/busy-ai">BUSY AI</Link>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-2 ms-lg-auto">
            <div className="dropdown">
                <button className="btn btn-light btn-sm rounded-pill border px-2 px-md-3 d-flex align-items-center gap-1" type="button" data-bs-toggle="dropdown">
                    <span aria-hidden="true">🇲🇳</span>
                    <span className="fw-semibold small">MN</span>
                    <i className="fa-solid fa-chevron-down small opacity-50 d-none d-sm-inline"></i>
                </button>
            </div>
            <Link href="/auth/login" className="btn btn-light px-4 fw-medium rounded-pill border">Нэвтрэх</Link>
            <Link href="/auth/register" className="btn btn-brand px-4 fw-medium rounded-pill">Бүртгүүлэх</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
