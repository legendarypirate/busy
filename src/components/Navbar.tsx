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

/** Marketing top bar — same primary links as `SiteHeaderNav` / PHP header. */
export default function Navbar() {
  const pathname = usePathname() ?? "/";
  const [navLang, setNavLang] = useState<BniLangCode>("mn");

  useEffect(() => {
    const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )bni_lang=([^;]*)/) : null;
    const raw = m?.[1] ? decodeURIComponent(m[1]) : "mn";
    setNavLang(isBniLang(raw) ? raw : "mn");
  }, []);

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

  const curLang = BNI_LANGUAGES[navLang];
  const langHref = (code: BniLangCode) => {
    const next = encodeURIComponent(pathname || "/");
    return `/api/set-lang?lang=${encodeURIComponent(code)}&next=${next}`;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/finallogo.png" alt="BUSY.mn" style={{ height: 32, width: "auto" }} />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={mobileNavOpen}
          aria-label="Цэс нээх, хаах"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div
          id="navbarNav"
          className={`navbar-collapse flex-column flex-lg-row flex-grow-1 align-items-stretch align-items-lg-center w-100 mt-2 mt-lg-0 ${
            mobileNavOpen ? "d-flex" : "d-none"
          } d-lg-flex`}
        >
          <ul className="navbar-nav mx-auto align-items-lg-center">
            <li className="nav-item">
              <Link className={`nav-link${pathname === "/" ? " active" : ""}`} href="/">
                Нүүр
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link${pathname.startsWith("/trips") ? " active" : ""}`} href="/trips">
                Бизнес аялал
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link${pathname.startsWith("/events") ? " active" : ""}`} href="/events">
                Хурал/Эвент
              </Link>
            </li>
            {SHOW_PUBLIC_NAV_COMPANIES ? (
              <li className="nav-item">
                <Link className={`nav-link${pathname.startsWith("/companies") ? " active" : ""}`} href="/companies">
                  Үйлдвэр холболт
                </Link>
              </li>
            ) : null}
            {SHOW_PUBLIC_NAV_INVESTMENTS ? (
              <li className="nav-item">
                <Link className={`nav-link${pathname.startsWith("/investments") ? " active" : ""}`} href="/investments">
                  Хөрөнгө оруулалт
                </Link>
              </li>
            ) : null}
            {SHOW_PUBLIC_NAV_MEMBERS ? (
              <li className="nav-item">
                <Link
                  className={`nav-link${pathname.startsWith("/members") || pathname.startsWith("/company") ? " active" : ""}`}
                  href="/members"
                >
                  Гишүүд
                </Link>
              </li>
            ) : null}
            <li className="nav-item">
              <Link className={`nav-link${pathname.startsWith("/news") ? " active" : ""}`} href="/news">
                Мэдээлэл
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link${pathname.startsWith("/contact") ? " active" : ""}`} href="/contact">
                Холбоо барих
              </Link>
            </li>
            {SHOW_PUBLIC_NAV_BUSY_AI ? (
              <li className="nav-item">
                <Link className={`nav-link${pathname.startsWith("/busy-ai") ? " active" : ""}`} href="/busy-ai">
                  BUSY AI
                </Link>
              </li>
            ) : null}
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
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 py-2" style={{ borderRadius: 12, minWidth: "11rem" }}>
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
            {SHOW_PUBLIC_HEADER_LOGIN_REGISTER ? (
              <>
                <Link href="/auth/login" className="btn btn-light px-4 fw-medium rounded-pill border">
                  Нэвтрэх
                </Link>
                <Link href="/auth/register" className="btn btn-brand px-4 fw-medium rounded-pill">
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
