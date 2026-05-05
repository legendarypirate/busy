"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getPlatformSession } from "@/lib/platform-session";
import { prisma } from "@/lib/prisma";
import { parseEventDatetimeWireUb } from "@/lib/event-datetime-ub";
import { syncEventRegistrationFormFromLegacyJson } from "@/lib/trip-registration-form/sync-event-registration-form-from-json";

const ADMIN_EVENTS_PATH = "/admin/meetings";
const PLATFORM_EVENTS_PATH = "/platform/events";

function eventListPathFromFormData(formData: FormData): typeof ADMIN_EVENTS_PATH | typeof PLATFORM_EVENTS_PATH {
  return String(formData.get("return_context") ?? "").trim() === "admin" ? ADMIN_EVENTS_PATH : PLATFORM_EVENTS_PATH;
}

async function assertAdminForEventCrud(accountId: bigint): Promise<void> {
  const row = await prisma.platformAccount.findUnique({
    where: { id: accountId },
    select: { role: true, status: true },
  });
  const okRole =
    row &&
    row.status === "active" &&
    (row.role === "admin" ||
      row.role === "super_admin" ||
      row.role === "event_manager");
  if (!okRole) {
    redirect(`/admin/login?next=${encodeURIComponent(ADMIN_EVENTS_PATH)}`);
  }
}

function parseMoney(raw: string): Prisma.Decimal | null {
  const t = raw.trim();
  if (t === "" || !Number.isFinite(Number(t))) {
    return null;
  }
  return new Prisma.Decimal(t);
}

function parseRegistrationJson(raw: string): Prisma.InputJsonValue | null {
  let v: unknown = raw.trim();
  if (v === "") return null;
  for (let depth = 0; depth < 3 && typeof v === "string"; depth++) {
    try {
      v = JSON.parse(v as string) as unknown;
    } catch {
      return null;
    }
  }
  if (Array.isArray(v) && v.length > 0) {
    return v as Prisma.InputJsonValue;
  }
  return null;
}

function parseSections(raw: string): Record<string, unknown>[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function parseExistingEnvelopeObject(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "string" && raw.trim()) {
    try {
      const j = JSON.parse(raw) as unknown;
      if (j && typeof j === "object" && !Array.isArray(j)) {
        return { ...(j as Record<string, unknown>) };
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

export async function saveEventAction(formData: FormData): Promise<void> {
  const listPath = eventListPathFromFormData(formData);
  const session = await getPlatformSession();
  if (!session) {
    redirect(
      listPath === ADMIN_EVENTS_PATH
        ? `/admin/login?next=${encodeURIComponent(ADMIN_EVENTS_PATH)}`
        : "/auth/login?next=/platform/events",
    );
  }
  if (listPath === ADMIN_EVENTS_PATH) {
    await assertAdminForEventCrud(session.id);
  }

  const eventIdRaw = String(formData.get("event_id") ?? "0").trim();
  let eventId = BigInt(0);
  try {
    eventId = BigInt(eventIdRaw === "" ? "0" : eventIdRaw);
  } catch {
    eventId = BigInt(0);
  }

  const chapterIdRaw = String(formData.get("chapter_id") ?? "").trim();
  const chapterIdNum = Math.max(0, Number(chapterIdRaw === "" ? "0" : chapterIdRaw));
  const chapterId = chapterIdNum > 0 ? chapterIdNum : null;
  const eventType = String(formData.get("event_type") ?? "event").trim() || "event";
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = parseEventDatetimeWireUb(String(formData.get("starts_at") ?? ""));
  const endsAt = parseEventDatetimeWireUb(String(formData.get("ends_at") ?? ""));
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

  let existingRegistrationJson: unknown | undefined;
  let existingEnvelope: Record<string, unknown> = {};
  if (eventId > BigInt(0)) {
    const exists = await prisma.bniEvent.findUnique({
      where: { id: eventId },
      select: { id: true, curriculumOverrideJson: true, registrationFormJson: true },
    });
    if (!exists) {
      redirect(`${listPath}?error=notfound`);
    }
    existingRegistrationJson = exists.registrationFormJson ?? undefined;
    existingEnvelope = parseExistingEnvelopeObject(exists.curriculumOverrideJson);
  }

  const envelope: Record<string, unknown> =
    eventId > BigInt(0) ? { ...existingEnvelope } : {};
  envelope.sections = agendaSections;
  envelope.speakers = speakersOut;
  envelope.faq = faqOut;
  if (introBody !== "") {
    envelope.intro_body = introBody;
  } else {
    delete envelope.intro_body;
  }
  if (audienceText !== "") {
    envelope.audience_text = audienceText;
  } else {
    delete envelope.audience_text;
  }

  const heroImageUrl = String(formData.get("hero_image_url") ?? "").trim();
  if (heroImageUrl !== "") {
    envelope.hero_image_url = heroImageUrl;
  }

  const eventManagerPhone = String(formData.get("event_manager_phone") ?? "").trim();
  const eventHelpEmail = String(formData.get("event_help_email") ?? "").trim();
  const eventHelpChatUrl = String(formData.get("event_help_chat_url") ?? "").trim();
  if (eventManagerPhone !== "") {
    envelope.event_manager_phone = eventManagerPhone;
  } else {
    delete envelope.event_manager_phone;
  }
  if (eventHelpEmail !== "") {
    envelope.event_help_email = eventHelpEmail;
  } else {
    delete envelope.event_help_email;
  }
  if (eventHelpChatUrl !== "") {
    envelope.event_help_chat_url = eventHelpChatUrl;
  } else {
    delete envelope.event_help_chat_url;
  }

  const curriculumOverrideJson: Prisma.InputJsonValue | typeof Prisma.DbNull =
    Object.keys(envelope).length > 0 ? (envelope as Prisma.InputJsonValue) : Prisma.DbNull;

  const regParsedRaw = parseRegistrationJson(String(formData.get("event_registration_form_json") ?? ""));
  const priceMnt = parseMoney(String(formData.get("price_mnt") ?? ""));
  const advanceOrderMnt = parseMoney(String(formData.get("advance_order_mnt") ?? ""));

  if (!startsAt || !endsAt || endsAt <= startsAt || title === "") {
    redirect(`${listPath}?error=missing`);
  }

  const rowBase = {
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
    priceMnt,
    advanceOrderMnt,
  };

  const registrationFormJson: Prisma.InputJsonValue | typeof Prisma.DbNull =
    regParsedRaw === null ? Prisma.DbNull : regParsedRaw;

  let savedEventId = eventId;
  if (eventId > BigInt(0)) {
    const updateData: typeof rowBase & { registrationFormJson?: Prisma.InputJsonValue | typeof Prisma.DbNull } = {
      ...rowBase,
    };
    if (regParsedRaw !== null) {
      updateData.registrationFormJson = registrationFormJson;
    }
    await prisma.bniEvent.update({
      where: { id: eventId },
      data: updateData,
    });
    savedEventId = eventId;
  } else {
    const created = await prisma.bniEvent.create({
      data: { ...rowBase, registrationFormJson },
      select: { id: true },
    });
    savedEventId = created.id;
  }

  let regForSync: unknown = regParsedRaw as unknown;
  if (eventId > BigInt(0) && regParsedRaw === null) {
    regForSync = existingRegistrationJson ?? null;
  } else if (regParsedRaw === null) {
    regForSync = null;
  }
  await syncEventRegistrationFormFromLegacyJson(savedEventId, regForSync);

  revalidatePath("/platform/events");
  revalidatePath(ADMIN_EVENTS_PATH);
  revalidatePath("/events");
  revalidatePath(`/events/${savedEventId.toString()}`);
  redirect(listPath);
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const listPath = eventListPathFromFormData(formData);
  const session = await getPlatformSession();
  if (!session) {
    redirect(
      listPath === ADMIN_EVENTS_PATH
        ? `/admin/login?next=${encodeURIComponent(ADMIN_EVENTS_PATH)}`
        : "/auth/login?next=/platform/events",
    );
  }
  if (listPath === ADMIN_EVENTS_PATH) {
    await assertAdminForEventCrud(session.id);
  }

  const raw = String(formData.get("event_id") ?? "0").trim();
  let eventId = BigInt(0);
  try {
    eventId = BigInt(raw === "" ? "0" : raw);
  } catch {
    redirect(listPath);
  }

  if (eventId < BigInt(1)) {
    redirect(listPath);
  }

  await prisma.bniEvent.delete({ where: { id: eventId } }).catch(() => null);

  revalidatePath("/platform/events");
  revalidatePath(ADMIN_EVENTS_PATH);
  revalidatePath("/events");
  revalidatePath(`/events/${eventId.toString()}`);
  redirect(listPath);
}
