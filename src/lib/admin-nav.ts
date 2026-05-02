/** Mirrors `admin/includes/sidebar.php` — hrefs are Next `/admin/...` routes (no `.php`). */
export type AdminNavItem = {
  key: string;
  href: string;
  label: string;
  iconClass: string;
  group?: "bni";
};

export const ADMIN_NAV_MAIN: AdminNavItem[] = [
  { key: "dashboard", href: "/admin/dashboard", label: "Хяналтын самбар", iconClass: "fas fa-tachometer-alt" },
  { key: "meetings", href: "/admin/meetings", label: "Уулзалтууд", iconClass: "fas fa-calendar-alt" },
  { key: "trips", href: "/admin/trips", label: "Бизнес аялал", iconClass: "fas fa-plane-departure" },
  { key: "payment_orders", href: "/admin/payment-orders", label: "QPay төлбөрүүд", iconClass: "fas fa-money-bill-wave" },
  { key: "members", href: "/admin/members", label: "Гишүүд", iconClass: "fas fa-users" },
  { key: "news", href: "/admin/news", label: "Мэдээ", iconClass: "fas fa-newspaper" },
  { key: "investment_stats", href: "/admin/investment-stats", label: "Хөрөнгө оруулалт (график)", iconClass: "fas fa-chart-pie" },
  { key: "about", href: "/admin/about", label: "Бидний тухай", iconClass: "fas fa-info-circle" },
  { key: "settings", href: "/admin/settings", label: "Footer / Site тохиргоо", iconClass: "fas fa-sliders-h" },
  { key: "users", href: "/admin/users", label: "Хэрэглэгчид", iconClass: "fas fa-user-shield" },
];

export const ADMIN_NAV_BNI: AdminNavItem[] = [
  { key: "bni_regions", href: "/admin/bni-regions", label: "Бүс нутаг", iconClass: "fas fa-map", group: "bni" },
  { key: "bni_chapters", href: "/admin/bni-chapters", label: "Бүлгүүд", iconClass: "fas fa-layer-group", group: "bni" },
  { key: "bni_events", href: "/admin/bni-events", label: "Хурлууд", iconClass: "fas fa-calendar-check", group: "bni" },
  { key: "bni_users", href: "/admin/bni-platform-users", label: "Платформ хэрэглэгчид", iconClass: "fas fa-id-badge", group: "bni" },
  { key: "bni_memberships", href: "/admin/bni-memberships", label: "Гишүүн эрх", iconClass: "fas fa-handshake", group: "bni" },
  { key: "bni_applications", href: "/admin/bni-applications", label: "Өргөдөл", iconClass: "fas fa-inbox", group: "bni" },
  { key: "bni_content", href: "/admin/bni-content", label: "Контент (slug)", iconClass: "fas fa-file-alt", group: "bni" },
  { key: "db_translations", href: "/admin/db-translations", label: "DB орчуулга (AI)", iconClass: "fas fa-language", group: "bni" },
];
