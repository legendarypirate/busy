"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BUSY_MISSION_LINES } from "@/lib/busy-platform-vision";
import { PLATFORM_SIDEBAR_NAV } from "./platform-nav";

function isActive(pathname: string, itemKey: string, href: string): boolean {
  if (itemKey === "dashboard") {
    return pathname === "/platform" || pathname === "/platform/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PlatformSidebar() {
  const pathname = usePathname() ?? "";

  let lastGroup: string | null = null;

  return (
    <aside className="pl-sidebar">
      <Link href="/platform" className="pl-logo text-decoration-none d-block">
        BUSY<span>.mn</span>
      </Link>

      <nav className="pl-nav">
        {PLATFORM_SIDEBAR_NAV.map((item) => {
          const showLabel = item.group !== lastGroup;
          lastGroup = item.group;
          const active = isActive(pathname, item.key, item.href);
          return (
            <div key={item.key}>
              {showLabel ? <div className="pl-nav-label">{item.group}</div> : null}
              <Link href={item.href} className={`pl-nav-item${active ? " active" : ""}`}>
                <i className={item.iconClass} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="pl-sidebar-footer mt-auto pt-4">
        <div className="pl-sidebar-mission px-2 mb-3" aria-label="BUSY.mn үндсэн санаа">
          {BUSY_MISSION_LINES.map((line) => (
            <span key={line} className="d-block">
              {line}
            </span>
          ))}
        </div>
        <div className="pl-help-box">
          <div className="pl-help-title">Тусламж хэрэгтэй юу?</div>
          <a href="mailto:support@busy.mn" className="pl-btn-support text-center text-decoration-none d-block">
            Холбоо барих
          </a>
        </div>
      </div>
    </aside>
  );
}
