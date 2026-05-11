"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { AdminNavItem } from "@/lib/admin-nav";

function navClass(active: boolean): string {
  return `list-group-item list-group-item-action${active ? " active" : ""}`;
}

function NavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const atRoot = pathname === "/admin" || pathname === "/admin/";
  const active =
    pathname === item.href ||
    (item.key === "dashboard" && atRoot) ||
    (item.key !== "dashboard" && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
  return (
    <Link href={item.href} className={navClass(active)} prefetch={false}>
      <i className={`${item.iconClass} me-2`} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export default function AdminChromeClient({
  children,
  userName,
  userEmail,
  navMain,
  navBni,
  showBniHeader,
}: {
  children: ReactNode;
  userName: string;
  userEmail: string;
  navMain: AdminNavItem[];
  navBni: AdminNavItem[];
  showBniHeader: boolean;
}) {
  const pathname = usePathname() ?? "";
  const [toggled, setToggled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (localStorage.getItem("sidebar-toggled") === "true") setToggled(true);
  }, []);

  const toggle = () => {
    setToggled((v) => {
      const next = !v;
      try {
        if (next) localStorage.setItem("sidebar-toggled", "true");
        else localStorage.removeItem("sidebar-toggled");
      } catch {
        /* */
      }
      return next;
    });
  };

  const wrapperClass = `d-flex${toggled ? " toggled" : ""}`;
  const toggleLabel = toggled ? "Цэсийг нээх" : "Цэсийг хаах";
  const toggleIcon = toggled ? "fas fa-angles-right" : "fas fa-bars";

  return (
    <div className={wrapperClass} id="wrapper">
        {toggled ? (
          <button
            type="button"
            className="btn btn-sm btn-primary admin-sidebar-floating-expand"
            id="sidebarFloatingExpand"
            aria-label="Цэсийг нээх"
            title="Цэсийг нээх"
            onClick={toggle}
          >
            <i className="fas fa-angles-right" aria-hidden="true" />
          </button>
        ) : null}
        <div className="bg-white border-end" id="sidebar-wrapper" role="navigation">
          <div className="sidebar-heading text-center py-4 border-bottom">
            <Link href="/" prefetch={false} className="text-decoration-none fw-bold text-dark d-block">
              BUSY<span className="text-danger">.mn</span>
            </Link>
          </div>
          <div className="list-group list-group-flush">
            {navMain.map((item) => (
              <NavLink key={item.key} item={item} pathname={pathname} />
            ))}
            {showBniHeader ? (
              <div className="list-group-item small text-uppercase text-muted fw-bold py-2 px-3 bg-light">
                BNI платформ
              </div>
            ) : null}
            {navBni.map((item) => (
              <NavLink key={item.key} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
        <div id="page-content-wrapper">
          <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
            <div className="container-fluid">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary admin-sidebar-toggle"
                id="sidebarToggle"
                aria-label={toggleLabel}
                aria-pressed={toggled}
                title={toggleLabel}
                onClick={toggle}
              >
                <i className={toggleIcon} aria-hidden="true" />
              </button>
              <ul className="navbar-nav ms-auto">
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="fas fa-user-circle me-1" aria-hidden="true" />
                    {userName}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className="dropdown-item" href="/" prefetch={false}>
                        Вэб рүү
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <a className="dropdown-item" href="/auth/logout">
                        Гарах
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </nav>
          <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="m-0 small text-muted fw-normal">Админ</h2>
              <div className="small text-muted text-end">{userEmail}</div>
            </div>
            {children}
          </div>
        </div>
    </div>
  );
}
