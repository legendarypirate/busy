"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navClass(pathname: string, href: string, exact?: boolean): string {
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return `pl-nav-item${active ? " active" : ""}`;
}

export default function DashboardSidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="pl-nav flex-grow-1">
      <div className="pl-nav-label">Үндсэн</div>
      <Link href="/dashboard" className={navClass(pathname, "/dashboard", true)}>
        <i className="fa-solid fa-chart-pie" aria-hidden="true" />
        <span>Тойм</span>
      </Link>
      <Link href="/dashboard/trips" className={navClass(pathname, "/dashboard/trips")}>
        <i className="fa-solid fa-paper-plane" aria-hidden="true" />
        <span>Аялалууд</span>
      </Link>
      <Link href="/dashboard/events" className={navClass(pathname, "/dashboard/events")}>
        <i className="fa-solid fa-calendar-days" aria-hidden="true" />
        <span>Хурал, эвентүүд</span>
      </Link>
      <Link href="/dashboard/weekly-meetings" className={navClass(pathname, "/dashboard/weekly-meetings")}>
        <i className="fa-solid fa-users-line" aria-hidden="true" />
        <span>7 хоногийн хурал</span>
      </Link>
      <Link href="/dashboard/registrations" className={navClass(pathname, "/dashboard/registrations")}>
        <i className="fa-solid fa-user-check" aria-hidden="true" />
        <span>Бүртгэлүүд</span>
      </Link>

      <div className="pl-nav-label">Санхүү</div>
      <Link href="/dashboard/payments" className={navClass(pathname, "/dashboard/payments")}>
        <i className="fa-solid fa-credit-card" aria-hidden="true" />
        <span>Төлбөр, нэхэмжлэх</span>
      </Link>

      <div className="pl-nav-label">Тохиргоо</div>
      <Link href="/dashboard/profile" className={navClass(pathname, "/dashboard/profile")}>
        <i className="fa-solid fa-building" aria-hidden="true" />
        <span>Байгууллагын профайл</span>
      </Link>
      <Link href="/dashboard/settings" className={navClass(pathname, "/dashboard/settings")}>
        <i className="fa-solid fa-gear" aria-hidden="true" />
        <span>Тохиргоо</span>
      </Link>
    </nav>
  );
}
