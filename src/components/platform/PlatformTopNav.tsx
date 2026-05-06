"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SHOW_PUBLIC_NAV_BUSY_AI,
  SHOW_PUBLIC_NAV_COMPANIES,
  SHOW_PUBLIC_NAV_INVESTMENTS,
  SHOW_PUBLIC_NAV_MEMBERS,
  SHOW_PUBLIC_NAV_NEWS,
} from "@/lib/public-marketing-flags";

type Props = {
  displayName: string;
  photoUrl: string | null;
};

export default function PlatformTopNav({ displayName, photoUrl }: Props) {
  const pathname = usePathname() ?? "";
  const top = [
    { href: "/platform", label: "Нүүр", match: /^\/platform\/?$/ },
    { href: "/platform/trips", label: "Бизнес аялал", match: /^\/platform\/trips/ },
    { href: "/platform/events", label: "Хурал эвент", match: /^\/platform\/events/ },
    ...(SHOW_PUBLIC_NAV_COMPANIES
      ? [{ href: "/platform/partners", label: "Үйлдвэр холболт", match: /^\/platform\/partners/ }]
      : []),
    ...(SHOW_PUBLIC_NAV_INVESTMENTS
      ? [{ href: "/platform/opportunities", label: "Хөрөнгө оруулалт", match: /^\/platform\/opportunities/ }]
      : []),
  ];

  const avatarSrc =
    photoUrl && photoUrl.startsWith("http")
      ? photoUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || "U")}&background=2563eb&color=fff&size=64`;

  return (
    <header className="pl-top-nav">
      <div className="pl-top-links">
        {top.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`pl-top-link${t.match.test(pathname) ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
        {SHOW_PUBLIC_NAV_MEMBERS ? (
          <Link
            href="/members"
            className={`pl-top-link${pathname.startsWith("/members") || pathname.startsWith("/company") ? " active" : ""}`}
          >
            Гишүүд
          </Link>
        ) : null}
        {SHOW_PUBLIC_NAV_NEWS ? (
          <Link href="/news" className={`pl-top-link${pathname.startsWith("/news") ? " active" : ""}`}>
            Мэдээлэл
          </Link>
        ) : null}
        <Link href="/contact" className={`pl-top-link${pathname.startsWith("/contact") ? " active" : ""}`}>
          Холбоо барих
        </Link>
        {SHOW_PUBLIC_NAV_BUSY_AI ? (
          <Link href="/busy-ai" className={`pl-top-link${pathname.startsWith("/busy-ai") ? " active" : ""}`}>
            BUSY AI
          </Link>
        ) : null}
      </div>
      <div className="ms-auto d-flex align-items-center gap-3">
        <button type="button" className="btn btn-link text-muted p-1" title="Хайх">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
        <div className="position-relative">
          <button type="button" className="btn btn-link text-muted p-1">
            <i className="fa-regular fa-bell" />
          </button>
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.5rem", padding: "3px 5px" }}
          >
            2
          </span>
        </div>
        <button type="button" className="btn btn-link text-muted p-1">
          <i className="fa-regular fa-comment-dots" />
        </button>
        <div className="d-flex align-items-center gap-2 border-start ps-3">
          <div className="text-end d-none d-xl-block">
            <div style={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Зохион байгуулагч</div>
          </div>
          <Image
            src={avatarSrc}
            alt=""
            width={32}
            height={32}
            className="rounded-circle"
            style={{ objectFit: "cover" }}
            unoptimized={avatarSrc.includes("ui-avatars.com")}
          />
          <Link href="/auth/logout" className="btn btn-sm btn-outline-secondary ms-1">
            Гарах
          </Link>
        </div>
      </div>
    </header>
  );
}
