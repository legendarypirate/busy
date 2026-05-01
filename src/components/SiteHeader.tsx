import { cookies } from "next/headers";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";
import { isBniLang } from "@/lib/nav-php-parity";

function legacyBase(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_LEGACY_SITE_URL?.trim();
  if (!raw) {
    return undefined;
  }
  return raw.replace(/\/$/, "");
}

/** Server wrapper reads lang cookie + optional demo auth cookie; markup lives in `SiteHeaderNav` (PHP parity). */
export async function SiteHeader() {
  const jar = await cookies();
  const langRaw = jar.get("bni_lang")?.value ?? "mn";
  const lang = isBniLang(langRaw) ? langRaw : "mn";
  const platformDisplay = jar.get("bni_platform_nav_display")?.value?.trim();
  const platformUser = platformDisplay ? { displayName: platformDisplay } : null;

  return (
    <SiteHeaderNav initialLang={lang} legacySiteUrl={legacyBase()} platformUser={platformUser} />
  );
}
