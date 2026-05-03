"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BNI_ALLOWED_LANGS,
  BNI_LANGUAGES,
  type BniLangCode,
  isBniLang,
} from "@/lib/nav-php-parity";
import {
  SHOW_PUBLIC_HEADER_LOGIN_REGISTER,
  SHOW_PUBLIC_NAV_BUSY_AI,
  SHOW_PUBLIC_NAV_COMPANIES,
  SHOW_PUBLIC_NAV_INVESTMENTS,
  SHOW_PUBLIC_NAV_MEMBERS,
} from "@/lib/public-marketing-flags";

/** Matches `includes/header.php` `<nav>` children (paths adapted for Next App Router). */
const NAV = [
  { href: "/", label: "Нүүр", id: "home" },
  { href: "/trips", label: "Бизнес аялал", id: "trips" },
  { href: "/events", label: "Хурал/Эвент", id: "events" },
  { href: "/companies", label: "Үйлдвэр холболт", id: "companies" },
  { href: "/investments", label: "Хөрөнгө оруулалт", id: "investments" },
  { href: "/members", label: "Гишүүд", id: "members" },
  { href: "/news", label: "Мэдээлэл", id: "news" },
  { href: "/busy-ai", label: "BUSY AI", id: "busy_ai" },
  { href: "/contact", label: "Холбоо барих", id: "contact" },
] as const;

function isNavItemVisible(pageId: (typeof NAV)[number]["id"]): boolean {
  if (pageId === "companies") return SHOW_PUBLIC_NAV_COMPANIES;
  if (pageId === "investments") return SHOW_PUBLIC_NAV_INVESTMENTS;
  if (pageId === "members") return SHOW_PUBLIC_NAV_MEMBERS;
  if (pageId === "busy_ai") return SHOW_PUBLIC_NAV_BUSY_AI;
  return true;
}

function navActive(pathname: string, href: string, pageId: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  if (pageId === "events" && pathname.startsWith("/events")) {
    return true;
  }
  if (pageId === "trips" && pathname.startsWith("/trips")) {
    return true;
  }
  if (pageId === "news" && pathname.startsWith("/news")) {
    return true;
  }
  if (pageId === "busy_ai" && pathname.startsWith("/busy-ai")) {
    return true;
  }
  if (pageId === "contact" && pathname.startsWith("/contact")) {
    return true;
  }
  if (pageId === "members" && (pathname.startsWith("/members") || pathname.startsWith("/company"))) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type SiteHeaderNavProps = {
  initialLang: string;
  legacySiteUrl?: string;
  /**
   * When true (default if no legacy URL), login/register/dashboard/logout use Next routes.
   * When legacy is on the **same hostname** as `NEXT_PUBLIC_APP_URL`, this must be true so
   * Google/email set Next platform cookies; PHP `auth/login.php` only sets `PHPSESSID`.
   */
  headerAuthUseNext?: boolean;
  /** Optional cookie-backed preview until Next auth — same menus as PHP logged-in navbar */
  platformUser?: { displayName: string } | null;
};

export function SiteHeaderNav({
  initialLang,
  legacySiteUrl,
  headerAuthUseNext = true,
  platformUser,
}: SiteHeaderNavProps) {
  const pathname = usePathname() ?? "/";
  const navLang: BniLangCode = isBniLang(initialLang) ? initialLang : "mn";
  const curLang = BNI_LANGUAGES[navLang];

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 992px)");
    const onMq = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  const langHref = (code: BniLangCode) => {
    if (legacySiteUrl && !headerAuthUseNext) {
      return `${legacySiteUrl}/scripts/change-lang.php?lang=${encodeURIComponent(code)}`;
    }
    const next = encodeURIComponent(pathname || "/");
    return `/api/set-lang?lang=${encodeURIComponent(code)}&next=${next}`;
  };

  const loginHref =
    headerAuthUseNext || !legacySiteUrl ? "/auth/login" : `${legacySiteUrl}/auth/login.php`;
  const registerHref =
    headerAuthUseNext || !legacySiteUrl ? "/auth/register" : `${legacySiteUrl}/auth/register.php`;
  const dashboardHref =
    headerAuthUseNext || !legacySiteUrl ? "/platform" : `${legacySiteUrl}/platform-home.php`;
  const logoutHref =
    headerAuthUseNext || !legacySiteUrl ? "/auth/logout" : `${legacySiteUrl}/auth/platform-logout.php`;

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/finallogo.png" alt="BUSY.mn" className="h-auto" style={{ height: 32, width: "auto" }} />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNavSite"
          aria-expanded={mobileNavOpen}
          aria-label="Цэс нээх, хаах"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse${mobileNavOpen ? " show" : ""}`} id="navbarNavSite">
          <ul className="navbar-nav mx-auto align-items-lg-center">
            {NAV.filter((item) => isNavItemVisible(item.id)).map((item) => (
              <li className="nav-item" key={item.href}>
                <Link
                  className={`nav-link${navActive(pathname, item.href, item.id) ? " active" : ""}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center gap-2 ms-lg-auto flex-wrap mt-3 mt-lg-0">
            <div className="dropdown">
              <button
                className="btn btn-light btn-sm rounded-pill border px-2 px-md-3 d-flex align-items-center gap-1"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Хэл солих"
              >
                <span aria-hidden>{curLang.flag}</span>
                <span className="fw-semibold small">{navLang.toUpperCase()}</span>
                <i className="fa-solid fa-chevron-down small opacity-50 d-none d-sm-inline" aria-hidden />
              </button>
              <ul
                className="dropdown-menu dropdown-menu-end shadow border-0 py-2"
                style={{ borderRadius: 12, minWidth: "11rem" }}
              >
                {BNI_ALLOWED_LANGS.map((lc) => {
                  const row = BNI_LANGUAGES[lc];
                  return (
                    <li key={lc}>
                      <a
                        className={`dropdown-item py-2 d-flex align-items-center gap-2${navLang === lc ? " active" : ""}`}
                        href={langHref(lc)}
                      >
                        <span aria-hidden>{row.flag}</span>
                        <span>{row.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            {platformUser ? (
              <div className="dropdown">
                <button
                  className="btn btn-light rounded-circle p-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="Профайлын цэс"
                >
                  <i className="fa-solid fa-user" aria-hidden />
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end shadow border-0"
                  style={{ borderRadius: 12, minWidth: "15rem" }}
                >
                  <li className="px-3 pt-3 pb-2 border-bottom border-light">
                    <div className="fw-semibold text-truncate">{platformUser.displayName}</div>
                  </li>
                  <li>
                    <Link className="dropdown-item py-2" href={dashboardHref}>
                      <i className="fa-solid fa-gauge-high me-2 text-muted" aria-hidden />
                      Миний самбар
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item py-2 text-danger" href={logoutHref}>
                      <i className="fa-solid fa-right-from-bracket me-2" aria-hidden />
                      Гарах
                    </a>
                  </li>
                </ul>
              </div>
            ) : SHOW_PUBLIC_HEADER_LOGIN_REGISTER ? (
              <>
                <Link href={loginHref} className="btn btn-light px-4 fw-medium rounded-pill border">
                  Нэвтрэх
                </Link>
                <Link href={registerHref} className="btn btn-brand px-4 fw-medium rounded-pill">
                  Бүртгүүлэх
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
