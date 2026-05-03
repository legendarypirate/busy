"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-session";
import {
  DEFAULT_FOOTER_PUBLIC_CONFIG,
  FOOTER_ADMIN_SOCIAL_LINK_SLOTS,
  FOOTER_ADMIN_USEFUL_LINK_SLOTS,
  FOOTER_PUBLIC_JSON_KEY,
  type FooterPublicConfig,
  type FooterSocialLink,
  type FooterUsefulLink,
  parseFooterPublicConfigJson,
  serializeFooterPublicConfig,
} from "@/lib/footer-public-config";
import { prisma } from "@/lib/prisma";

async function upsertSetting(name: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { settingName: name },
    create: { settingName: name, settingValue: value },
    update: { settingValue: value },
  });
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function saveFooterPublicSettingsAction(formData: FormData) {
  await requireAdminUser("/admin/settings");

  const usefulLinks: FooterUsefulLink[] = [];
  for (let i = 0; i < FOOTER_ADMIN_USEFUL_LINK_SLOTS; i++) {
    const label = str(formData, `useful_label_${i}`);
    const href = str(formData, `useful_href_${i}`);
    if (label === "" && href === "") continue;
    usefulLinks.push({
      label: label || href || "Холбоос",
      href: href || "#",
    });
  }

  const socialLinks: FooterSocialLink[] = [];
  for (let i = 0; i < FOOTER_ADMIN_SOCIAL_LINK_SLOTS; i++) {
    const href = str(formData, `social_href_${i}`);
    const label = str(formData, `social_label_${i}`);
    const iconClass = str(formData, `social_icon_${i}`);
    if (href === "" && label === "" && iconClass === "") continue;
    socialLinks.push({
      href: href || "#",
      label: label || "Сошиал",
      iconClass: iconClass || "fa-solid fa-link",
    });
  }

  const cfg: FooterPublicConfig = {
    brandName: str(formData, "brand_name") || DEFAULT_FOOTER_PUBLIC_CONFIG.brandName,
    tagline: str(formData, "tagline") || DEFAULT_FOOTER_PUBLIC_CONFIG.tagline,
    contactColumnTitle: str(formData, "contact_col_title") || DEFAULT_FOOTER_PUBLIC_CONFIG.contactColumnTitle,
    contact: {
      phoneDisplay: str(formData, "phone_display") || DEFAULT_FOOTER_PUBLIC_CONFIG.contact.phoneDisplay,
      phoneTel: str(formData, "phone_tel") || DEFAULT_FOOTER_PUBLIC_CONFIG.contact.phoneTel,
      email: str(formData, "contact_email") || DEFAULT_FOOTER_PUBLIC_CONFIG.contact.email,
      addressLine: str(formData, "address_line") || DEFAULT_FOOTER_PUBLIC_CONFIG.contact.addressLine,
    },
    usefulLinksColumnTitle:
      str(formData, "useful_col_title") || DEFAULT_FOOTER_PUBLIC_CONFIG.usefulLinksColumnTitle,
    usefulLinks: usefulLinks.length > 0 ? usefulLinks : [...DEFAULT_FOOTER_PUBLIC_CONFIG.usefulLinks],
    platformColumnTitle: str(formData, "platform_col_title") || DEFAULT_FOOTER_PUBLIC_CONFIG.platformColumnTitle,
    platformBlurb: str(formData, "platform_blurb") || DEFAULT_FOOTER_PUBLIC_CONFIG.platformBlurb,
    copyrightName: str(formData, "copyright_name") || DEFAULT_FOOTER_PUBLIC_CONFIG.copyrightName,
    socialLinks: socialLinks.length > 0 ? socialLinks : [...DEFAULT_FOOTER_PUBLIC_CONFIG.socialLinks],
  };

  await upsertSetting(FOOTER_PUBLIC_JSON_KEY, serializeFooterPublicConfig(cfg));

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function resetFooterPublicDefaultsAction() {
  await requireAdminUser("/admin/settings");
  await upsertSetting(
    FOOTER_PUBLIC_JSON_KEY,
    serializeFooterPublicConfig(parseFooterPublicConfigJson("")),
  );
  revalidatePath("/", "layout");
  redirect("/admin/settings?reset=1");
}
