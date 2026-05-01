/** Mirrors PHP `bni_mongolia_banks_catalog()` / `bni_mongolia_bank_logo_url()`. */

export type MongoliaBank = {
  code: string;
  nameMn: string;
  domain: string;
};

export const MONGOLIA_BANKS_CATALOG: MongoliaBank[] = [
  { code: "khan", nameMn: "Хаан банк", domain: "khanbank.com" },
  { code: "state", nameMn: "Төрийн банк", domain: "statebank.mn" },
  { code: "golomt", nameMn: "Голомт банк", domain: "golomtbank.com" },
  { code: "tdb", nameMn: "Худалдаа, хөгжлийн банк", domain: "tdbm.mn" },
  { code: "xac", nameMn: "Хас банк", domain: "xacbank.mn" },
  { code: "capitron", nameMn: "Капитрон банк", domain: "capitronbank.mn" },
  { code: "nibank", nameMn: "Үндэсний хөрөнгө оруулалтын банк", domain: "nibank.mn" },
  { code: "ckbank", nameMn: "Чингис хаан банк", domain: "ckbank.mn" },
  { code: "credit", nameMn: "Кредит банк", domain: "creditbank.mn" },
  { code: "trans", nameMn: "Транс банк", domain: "transbank.mn" },
  { code: "arig", nameMn: "Ариг банк", domain: "arigbank.mn" },
  { code: "bogd", nameMn: "Богд банк", domain: "bogdbank.com" },
  { code: "mbank", nameMn: "М банк", domain: "m-bank.mn" },
  { code: "dbm", nameMn: "Хөгжлийн банк", domain: "dbm.mn" },
];

export function mongoliaBankLogoUrl(domain: string): string {
  const d = domain.trim();
  if (!d) {
    return "";
  }
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(d)}`;
}

export function mongoliaBankByCode(code: string): MongoliaBank | null {
  const c = code.trim();
  return MONGOLIA_BANKS_CATALOG.find((b) => b.code === c) ?? null;
}

export const PROFILE_INDUSTRY_OPTIONS = [
  "Мэдээллийн технологи, Жижиг дунд үйлдвэрлэл",
  "Үйлдвэрлэл",
  "Худалдаа",
  "Үйлчилгээ",
] as const;
