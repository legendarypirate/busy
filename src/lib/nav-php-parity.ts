/**
 * Mirrors `includes/i18n.php` — language codes & labels used by PHP navbar dropdown.
 */
export const BNI_ALLOWED_LANGS = ["mn", "en", "cn", "kr", "jp"] as const;

export type BniLangCode = (typeof BNI_ALLOWED_LANGS)[number];

export const BNI_LANGUAGES: Record<BniLangCode, { flag: string; name: string }> = {
  mn: { flag: "🇲🇳", name: "MN" },
  en: { flag: "🇺🇸", name: "EN" },
  cn: { flag: "🇨🇳", name: "CN" },
  kr: { flag: "🇰🇷", name: "KR" },
  jp: { flag: "🇯🇵", name: "JP" },
};

export function isBniLang(code: string): code is BniLangCode {
  return (BNI_ALLOWED_LANGS as readonly string[]).includes(code);
}
