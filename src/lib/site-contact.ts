import { DEFAULT_FOOTER_PUBLIC_CONFIG } from "@/lib/footer-public-config";

/** Compile-time defaults (DB байхгүй / footer JSON хоосон үед) — нийтийн footer нь `getFooterPublicConfig()` ашиглана. */
export const SITE_CONTACT = { ...DEFAULT_FOOTER_PUBLIC_CONFIG.contact } as const;
