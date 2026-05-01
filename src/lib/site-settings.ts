import { prisma } from "@/lib/prisma";

export async function getSiteSetting(name: string): Promise<string> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { settingName: name },
      select: { settingValue: true },
    });
    return (row?.settingValue ?? "").trim();
  } catch {
    return "";
  }
}

export async function getSiteTitle(): Promise<string> {
  const t = await getSiteSetting("site_title");
  return t || "BUSY.mn";
}

export async function getSiteDescription(): Promise<string> {
  const d = await getSiteSetting("site_description");
  return d || "Бизнес аялал, хурал, эвент — BUSY.mn";
}
