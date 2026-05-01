"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getPlatformSession } from "@/lib/platform-session";
import { prisma } from "@/lib/prisma";

function parseDatetimeLocal(raw: string): Date | null {
  const t = raw.trim();
  if (!t) {
    return null;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseMoney(raw: string): Prisma.Decimal | null {
  const t = raw.trim();
  if (t === "" || !Number.isFinite(Number(t))) {
    return null;
  }
  return new Prisma.Decimal(t);
}

function parseRegistrationJson(raw: string): Prisma.InputJsonValue | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v) && v.length > 0) {
      return v as Prisma.InputJsonValue;
    }
    return null;
  } catch {
    return null;
  }
}

function parseSections(raw: string): Record<string, unknown>[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

export async function saveEventAction(formData: FormData): Promise<void> {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/events");
  }

  const eventIdRaw = String(formData.get("event_id") ?? "0").trim();
  let eventId = BigInt(0);
  try {
    eventId = BigInt(eventIdRaw === "" ? "0" : eventIdRaw);
  } catch {
    eventId = BigInt(0);
  }

  const chapterId = Math.max(0, Number(String(formData.get("chapter_id") ?? "0")));
  const eventType = String(formData.get("event_type") ?? "weekly_meeting").trim() || "weekly_meeting";
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = parseDatetimeLocal(String(formData.get("starts_at") ?? ""));
  const endsAt = parseDatetimeLocal(String(formData.get("ends_at") ?? ""));
  const location = String(formData.get("location") ?? "").trim() || null;
  const isOnline = formData.get("is_online") === "1";
  const scheduleId = Math.max(0, Number(String(formData.get("schedule_id") ?? "0")));
  const curriculumId = Math.max(0, Number(String(formData.get("curriculum_id") ?? "0")));

  const introBody = String(formData.get("event_intro_body") ?? "").trim();
  const audienceText = String(formData.get("audience_text") ?? "").trim();

  const speakerNames = formData.getAll("speaker_name").map(String);
  const speakerRoles = formData.getAll("speaker_role").map(String);
  const speakerPhotos = formData.getAll("speaker_photo_url").map(String);
  const speakersOut: { name: string; role: string; photo_url: string }[] = [];
  const spkLen = Math.max(speakerNames.length, speakerRoles.length, speakerPhotos.length);
  for (let si = 0; si < spkLen; si++) {
    const sn = speakerNames[si]?.trim() ?? "";
    const sr = speakerRoles[si]?.trim() ?? "";
    const sp = speakerPhotos[si]?.trim() ?? "";
    if (sn === "" && sr === "" && sp === "") {
      continue;
    }
    speakersOut.push({ name: sn, role: sr, photo_url: sp });
  }

  const faqQs = formData.getAll("faq_question").map(String);
  const faqAs = formData.getAll("faq_answer").map(String);
  const faqOut: { question: string; answer: string }[] = [];
  const faqLen = Math.max(faqQs.length, faqAs.length);
  for (let fi = 0; fi < faqLen; fi++) {
    const fq = faqQs[fi]?.trim() ?? "";
    const fa = faqAs[fi]?.trim() ?? "";
    if (fq === "" && fa === "") {
      continue;
    }
    faqOut.push({ question: fq, answer: fa });
  }

  const agendaSections = parseSections(String(formData.get("event_sections_json") ?? ""));

  const envelope: Record<string, unknown> = {};
  if (agendaSections.length > 0) {
    envelope.sections = agendaSections;
  }
  if (speakersOut.length > 0) {
    envelope.speakers = speakersOut;
  }
  if (faqOut.length > 0) {
    envelope.faq = faqOut;
  }
  if (introBody !== "") {
    envelope.intro_body = introBody;
  }
  if (audienceText !== "") {
    envelope.audience_text = audienceText;
  }

  const curriculumOverrideJson: Prisma.InputJsonValue | typeof Prisma.DbNull =
    Object.keys(envelope).length > 0 ? (envelope as Prisma.InputJsonValue) : Prisma.DbNull;

  const regParsedRaw = parseRegistrationJson(String(formData.get("event_registration_form_json") ?? ""));
  const registrationFormJson: Prisma.InputJsonValue | typeof Prisma.DbNull =
    regParsedRaw === null ? Prisma.DbNull : regParsedRaw;
  const priceMnt = parseMoney(String(formData.get("price_mnt") ?? ""));
  const advanceOrderMnt = parseMoney(String(formData.get("advance_order_mnt") ?? ""));

  if (!startsAt || !endsAt || endsAt <= startsAt || chapterId < 1 || title === "") {
    redirect("/platform/events?error=missing");
  }

  const row = {
    chapterId,
    scheduleId: scheduleId > 0 ? scheduleId : null,
    curriculumId: curriculumId > 0 ? curriculumId : null,
    eventType,
    title,
    startsAt,
    endsAt,
    location,
    isOnline,
    curriculumOverrideJson,
    registrationFormJson,
    priceMnt,
    advanceOrderMnt,
  };

  if (eventId > BigInt(0)) {
    const exists = await prisma.bniEvent.findUnique({ where: { id: eventId } });
    if (!exists) {
      redirect("/platform/events?error=notfound");
    }
    await prisma.bniEvent.update({
      where: { id: eventId },
      data: row,
    });
  } else {
    await prisma.bniEvent.create({
      data: row,
    });
  }

  revalidatePath("/platform/events");
  revalidatePath("/events");
  redirect("/platform/events");
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/events");
  }

  const raw = String(formData.get("event_id") ?? "0").trim();
  let eventId = BigInt(0);
  try {
    eventId = BigInt(raw === "" ? "0" : raw);
  } catch {
    redirect("/platform/events");
  }

  if (eventId < BigInt(1)) {
    redirect("/platform/events");
  }

  await prisma.bniEvent.delete({ where: { id: eventId } }).catch(() => null);

  revalidatePath("/platform/events");
  revalidatePath("/events");
  redirect("/platform/events");
}
