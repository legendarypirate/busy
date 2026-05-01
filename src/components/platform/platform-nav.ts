export type PlatformNavItem = {
  key: string;
  href: string;
  label: string;
  iconClass: string;
  /** Section heading (shown once when it changes); mirrors PHP sidebar blocks. */
  group: string;
};

/** Same order/labels as PHP `platform-home.php` sidebar (Mongolian). */
export const PLATFORM_SIDEBAR_NAV: PlatformNavItem[] = [
  { key: "dashboard", href: "/platform", label: "Хянах самбар", iconClass: "fa-solid fa-table-cells-large", group: "Үндсэн" },
  { key: "profile", href: "/platform/profile", label: "Бизнес Профайл", iconClass: "fa-regular fa-user", group: "Үндсэн" },
  { key: "media", href: "/platform/media", label: "Медиа сан", iconClass: "fa-regular fa-image", group: "Үндсэн" },
  { key: "trips", href: "/platform/trips", label: "Аялал", iconClass: "fa-solid fa-plane-departure", group: "Менежмент" },
  { key: "jobs", href: "/platform/jobs", label: "Ажлын зар", iconClass: "fa-solid fa-briefcase", group: "Менежмент" },
  { key: "shop", href: "/platform/shop", label: "Дэлгүүр", iconClass: "fa-solid fa-cart-shopping", group: "Менежмент" },
  { key: "shop_orders_in", href: "/platform/shop_orders_in", label: "Ирсэн захиалга", iconClass: "fa-solid fa-inbox", group: "Менежмент" },
  { key: "shop_orders", href: "/platform/shop_orders", label: "Өгсөн захиалга", iconClass: "fa-solid fa-receipt", group: "Менежмент" },
  { key: "news", href: "/platform/news", label: "Мэдээ", iconClass: "fa-regular fa-newspaper", group: "Менежмент" },
  { key: "opportunities", href: "/platform/opportunities", label: "Боломжууд", iconClass: "fa-regular fa-lightbulb", group: "Сүлжээ" },
  { key: "partners", href: "/platform/partners", label: "Түншлэл", iconClass: "fa-solid fa-handshake", group: "Сүлжээ" },
  { key: "events", href: "/platform/events", label: "Хурал / Эвент", iconClass: "fa-regular fa-calendar-check", group: "Сүлжээ" },
  { key: "premium", href: "/platform/premium", label: "Премиум", iconClass: "fa-solid fa-crown", group: "Сүлжээ" },
];

export const PLATFORM_PANEL_SLUGS = new Set(
  PLATFORM_SIDEBAR_NAV.map((n) => n.key).filter((k) => k !== "dashboard")
);
