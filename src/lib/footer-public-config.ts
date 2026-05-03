import { getSiteSetting } from "@/lib/site-settings";

/** `site_settings.setting_name` — JSON for public marketing footer + contact sidebar. */
export const FOOTER_PUBLIC_JSON_KEY = "footer_public_json";

/** Админ форм дээрх хамгийн их мөрүүд (хадгалахдаа хоосныг алгасна). */
export const FOOTER_ADMIN_USEFUL_LINK_SLOTS = 12;
export const FOOTER_ADMIN_SOCIAL_LINK_SLOTS = 8;

export type FooterUsefulLink = { label: string; href: string };
export type FooterSocialLink = { href: string; label: string; iconClass: string };

export type FooterPublicConfig = {
  brandName: string;
  tagline: string;
  contactColumnTitle: string;
  contact: {
    phoneDisplay: string;
    phoneTel: string;
    email: string;
    addressLine: string;
  };
  usefulLinksColumnTitle: string;
  usefulLinks: FooterUsefulLink[];
  platformColumnTitle: string;
  platformBlurb: string;
  copyrightName: string;
  socialLinks: FooterSocialLink[];
};

export const DEFAULT_FOOTER_PUBLIC_CONFIG: FooterPublicConfig = {
  brandName: "BUSY.mn",
  tagline: "Бизнес аялал, хурал, эвент үүсгэхэд зориулагдсан платформ",
  contactColumnTitle: "Холбоо барих",
  contact: {
    phoneDisplay: "+976 7000 1010",
    phoneTel: "+97670001010",
    email: "info@busy.mn",
    addressLine: "Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, Olympic Street 19/1",
  },
  usefulLinksColumnTitle: "Хэрэгтэй холбоосууд",
  usefulLinks: [
    { label: "Нууцлалын бодлого", href: "#" },
    { label: "Нөхцөл, болзол", href: "#" },
    { label: "Тусламж, дэмжлэг", href: "#" },
    { label: "Хамтран ажиллах", href: "#" },
  ],
  platformColumnTitle: "Платформ",
  platformBlurb: "Аялал, хурал, эвентын бүртгэл болон удирдлагыг нэг дороос.",
  copyrightName: "BUSY",
  socialLinks: [
    { href: "#", label: "Facebook", iconClass: "fa-brands fa-facebook-f" },
    { href: "#", label: "LinkedIn", iconClass: "fa-brands fa-linkedin-in" },
    { href: "#", label: "YouTube", iconClass: "fa-brands fa-youtube" },
    { href: "#", label: "X", iconClass: "fa-brands fa-twitter" },
  ],
};

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function mergeContact(raw: Record<string, unknown> | undefined): FooterPublicConfig["contact"] {
  const d = DEFAULT_FOOTER_PUBLIC_CONFIG.contact;
  if (!raw || typeof raw !== "object") return { ...d };
  const c = raw as Record<string, unknown>;
  return {
    phoneDisplay: trimStr(c.phoneDisplay) || d.phoneDisplay,
    phoneTel: trimStr(c.phoneTel) || d.phoneTel,
    email: trimStr(c.email) || d.email,
    addressLine: trimStr(c.addressLine) || d.addressLine,
  };
}

function mergeUsefulLinks(raw: unknown): FooterUsefulLink[] {
  if (!Array.isArray(raw)) return [...DEFAULT_FOOTER_PUBLIC_CONFIG.usefulLinks];
  const out: FooterUsefulLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = trimStr(o.label);
    const href = trimStr(o.href);
    if (label === "" && href === "") continue;
    out.push({ label: label || href || "Холбоос", href: href || "#" });
  }
  return out.length > 0 ? out : [...DEFAULT_FOOTER_PUBLIC_CONFIG.usefulLinks];
}

function mergeSocialLinks(raw: unknown): FooterSocialLink[] {
  if (!Array.isArray(raw)) return [...DEFAULT_FOOTER_PUBLIC_CONFIG.socialLinks];
  const out: FooterSocialLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const href = trimStr(o.href);
    const label = trimStr(o.label);
    const iconClass = trimStr(o.iconClass);
    if (href === "" && label === "" && iconClass === "") continue;
    out.push({
      href: href || "#",
      label: label || "Сошиал",
      iconClass: iconClass || "fa-solid fa-link",
    });
  }
  return out.length > 0 ? out : [...DEFAULT_FOOTER_PUBLIC_CONFIG.socialLinks];
}

export function parseFooterPublicConfigJson(raw: string | null | undefined): FooterPublicConfig {
  const d = DEFAULT_FOOTER_PUBLIC_CONFIG;
  if (raw == null || raw.trim() === "") {
    return structuredClone(d);
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return structuredClone(d);
    const o = parsed as Record<string, unknown>;
    return {
      brandName: trimStr(o.brandName) || d.brandName,
      tagline: trimStr(o.tagline) || d.tagline,
      contactColumnTitle: trimStr(o.contactColumnTitle) || d.contactColumnTitle,
      contact: mergeContact(o.contact as Record<string, unknown> | undefined),
      usefulLinksColumnTitle: trimStr(o.usefulLinksColumnTitle) || d.usefulLinksColumnTitle,
      usefulLinks: mergeUsefulLinks(o.usefulLinks),
      platformColumnTitle: trimStr(o.platformColumnTitle) || d.platformColumnTitle,
      platformBlurb: trimStr(o.platformBlurb) || d.platformBlurb,
      copyrightName: trimStr(o.copyrightName) || d.copyrightName,
      socialLinks: mergeSocialLinks(o.socialLinks),
    };
  } catch {
    return structuredClone(d);
  }
}

export async function getFooterPublicConfig(): Promise<FooterPublicConfig> {
  const raw = await getSiteSetting(FOOTER_PUBLIC_JSON_KEY);
  return parseFooterPublicConfigJson(raw || null);
}

export function serializeFooterPublicConfig(cfg: FooterPublicConfig): string {
  return JSON.stringify(cfg, null, 0);
}
