"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { mongoliaBankByCode } from "@/lib/mongolia-banks";
import { prisma } from "@/lib/prisma";
import { getPlatformSessionForAction } from "@/lib/platform-session";
import { setPlatformSessionCookies } from "@/lib/platform-session-cookies";
import { writePlatformUploadImage } from "@/lib/platform-write-image";

export type ProfileSaveState = {
  ok: boolean;
  message: string;
};

function normalizeExternalUrl(url: string): string {
  const t = url.trim();
  if (!t) {
    return "";
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) {
    return t;
  }
  return `https://${t.replace(/^\/+/, "")}`;
}

function asRecord(json: unknown): Record<string, unknown> {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return { ...(json as Record<string, unknown>) };
  }
  return {};
}

async function requireProfileSession(formData: FormData) {
  const resolved = await getPlatformSessionForAction(formData);
  if (!resolved) return null;
  if (!resolved.fromCookie) {
    await setPlatformSessionCookies(resolved.user.id, resolved.user.displayName);
  }
  return resolved.user;
}

export async function saveCompanyProfileAction(_prev: ProfileSaveState | null, formData: FormData): Promise<ProfileSaveState> {
  const session = await requireProfileSession(formData);
  if (!session) {
    return { ok: false, message: "Нэвтэрнэ үү." };
  }

  const displayName = String(formData.get("display_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const businessPhone = String(formData.get("business_phone") ?? "").trim();
  const businessEmail = String(formData.get("business_email") ?? "").trim();
  let website = String(formData.get("website") ?? "").trim();
  const facebook = normalizeExternalUrl(String(formData.get("facebook") ?? ""));
  const instagram = normalizeExternalUrl(String(formData.get("instagram") ?? ""));
  const whatsapp = normalizeExternalUrl(String(formData.get("whatsapp") ?? ""));
  const wechat = normalizeExternalUrl(String(formData.get("wechat") ?? ""));
  const kakaotalk = normalizeExternalUrl(String(formData.get("kakaotalk") ?? ""));
  const viber = normalizeExternalUrl(String(formData.get("viber") ?? ""));
  const addressLine = String(formData.get("address_line") ?? "").trim();
  const addressCountry = String(formData.get("address_country") ?? "").trim();
  const addressCity = String(formData.get("address_city") ?? "").trim();
  const addressDistrict = String(formData.get("address_district") ?? "").trim();
  const addressPostal = String(formData.get("address_postal") ?? "").trim();
  const contactHours = String(formData.get("contact_hours") ?? "").trim();
  const legalForm = String(formData.get("legal_form") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const companySize = String(formData.get("company_size") ?? "").trim();
  let foundedYear = String(formData.get("founded_year") ?? "").trim();
  const slogan = String(formData.get("slogan") ?? "").trim();
  const professionActivity = String(formData.get("profession_activity") ?? "").trim();
  const companyLocation = String(formData.get("company_location") ?? "").trim();
  const yearsInBusiness = String(formData.get("years_in_business") ?? "").trim();
  const previousWork = String(formData.get("previous_work") ?? "").trim();
  const registerNumber = String(formData.get("register_number") ?? "").trim();
  let bankCode = String(formData.get("bank_code") ?? "").trim();
  const bankAccountNumber = String(formData.get("bank_account_number") ?? "").trim();

  if (website !== "" && !/^https?:\/\//i.test(website)) {
    website = `https://${website}`;
  }
  if (!/^[0-9]{4}$/.test(foundedYear)) {
    foundedYear = "";
  }

  let bankName = "";
  if (bankCode !== "") {
    const row = mongoliaBankByCode(bankCode);
    bankName = row?.nameMn ?? "";
    if (!bankName) {
      bankCode = "";
    }
  }

  const existing = await prisma.platformProfile.findUnique({
    where: { accountId: session.id },
  });

  const existingBiz = asRecord(existing?.businessJson);
  const mergedBusiness: Record<string, unknown> = {
    ...existingBiz,
    industry,
    company_size: companySize,
    founded_year: foundedYear,
    slogan,
    profession_activity: professionActivity,
    company_location: companyLocation,
    years_in_business: yearsInBusiness,
    previous_work: previousWork,
    facebook,
    instagram,
    whatsapp,
    wechat,
    kakaotalk,
    viber,
    address_country: addressCountry,
    address_city: addressCity,
    address_district: addressDistrict,
    address_postal: addressPostal,
    contact_hours: contactHours,
    legal_form: legalForm,
    register_number: registerNumber,
    bank_code: bankCode,
    bank_name: bankName,
    bank_account_number: bankAccountNumber,
  };

  const msgs: string[] = [];

  const memberFile = formData.get("profile_photo_file");
  if (memberFile instanceof File && memberFile.size > 0) {
    const up = await writePlatformUploadImage(session.id, memberFile, 5 * 1024 * 1024);
    if (up.ok) {
      mergedBusiness.member_photo_url = up.url;
    } else if (up.error !== "empty") {
      msgs.push(up.error);
    }
  }

  const coverFile = formData.get("cover_photo_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const up = await writePlatformUploadImage(session.id, coverFile, 10 * 1024 * 1024);
    if (up.ok) {
      mergedBusiness.profile_cover_url = up.url;
    } else if (up.error !== "empty") {
      msgs.push(up.error);
    }
  }

  let photoUrl = existing?.photoUrl?.trim() ?? "";
  const logoFile = formData.get("photo_file");
  if (logoFile instanceof File && logoFile.size > 0) {
    const up = await writePlatformUploadImage(session.id, logoFile, 10 * 1024 * 1024);
    if (up.ok) {
      photoUrl = up.url;
    } else if (up.error !== "empty") {
      msgs.push(up.error);
    }
  }

  const businessJson = mergedBusiness as Prisma.InputJsonValue;

  await prisma.platformProfile.upsert({
    where: { accountId: session.id },
    create: {
      accountId: session.id,
      displayName: displayName || session.email,
      companyName: companyName || null,
      businessPhone: businessPhone || null,
      businessEmail: businessEmail || null,
      website: website || null,
      addressLine: addressLine || null,
      bio: bio || null,
      photoUrl: photoUrl || null,
      businessJson,
    },
    update: {
      displayName: displayName || session.email,
      companyName: companyName || null,
      businessPhone: businessPhone || null,
      businessEmail: businessEmail || null,
      website: website || null,
      addressLine: addressLine || null,
      bio: bio || null,
      photoUrl: photoUrl || null,
      businessJson,
    },
  });

  const navDisplay = displayName !== "" ? displayName : session.email;
  await setPlatformSessionCookies(session.id, navDisplay);

  revalidatePath("/platform/profile");

  const baseMsg = msgs.length ? `Хадгалагдлаа. Анхаар: ${msgs.join(" ")}` : "Компанийн профайл амжилттай хадгалагдлаа.";
  return { ok: true, message: baseMsg };
}

export async function saveHeroSlidesAction(_prev: ProfileSaveState | null, formData: FormData): Promise<ProfileSaveState> {
  const session = await requireProfileSession(formData);
  if (!session) {
    return { ok: false, message: "Нэвтэрнэ үү." };
  }

  const existing = await prisma.platformProfile.findUnique({
    where: { accountId: session.id },
  });
  const biz = asRecord(existing?.businessJson);
  let slides: string[] = Array.isArray(biz.hero_slides)
    ? biz.hero_slides.filter((u): u is string => typeof u === "string")
    : [];

  const removeRaw = formData.getAll("remove_slide");
  if (removeRaw.length > 0) {
    const removeSet = new Set(removeRaw.map((v) => String(v)));
    slides = slides.filter((_, idx) => !removeSet.has(String(idx)));
  }

  const files = formData.getAll("hero_files");
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) {
      continue;
    }
    if (slides.length >= 10) {
      break;
    }
    const up = await writePlatformUploadImage(session.id, f, 10 * 1024 * 1024);
    if (up.ok) {
      slides.push(up.url);
    }
  }

  biz.hero_slides = slides;

  await prisma.platformProfile.upsert({
    where: { accountId: session.id },
    create: {
      accountId: session.id,
      displayName: session.email,
      businessJson: biz as Prisma.InputJsonValue,
    },
    update: {
      businessJson: biz as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/platform/media");
  return { ok: true, message: "Hero зураг шинэчлэгдлээ." };
}
