import { Prisma, type BusinessTrip } from "@prisma/client";
import { destroyCloudinaryBySecureUrl, writePlatformUploadImage } from "@/lib/platform-write-image";
import type {
  TripExtrasBookingTier,
  TripExtrasFaq,
  TripExtrasPaymentStep,
} from "@/components/platform/trips/trip-editor-helpers";
import { readExtras } from "@/components/platform/trips/trip-editor-helpers";
import { dbBusinessTrip, prisma } from "@/lib/prisma";
import { syncTripRegistrationFormFromLegacyJson } from "@/lib/trip-registration-form/sync-registration-form-from-json";

async function persistBusinessTripJsonColumns(
  tripId: number,
  extras: Prisma.InputJsonValue,
  registration: Prisma.InputJsonValue | null,
  itinerary: Prisma.InputJsonValue | null,
): Promise<void> {
  const ex = JSON.stringify(extras);
  await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET extras_json = ${ex}::jsonb WHERE id = ${tripId}`);

  if (registration !== null) {
    const r = JSON.stringify(registration);
    await prisma.$executeRaw(
      Prisma.sql`UPDATE business_trips SET registration_form_json = ${r}::jsonb WHERE id = ${tripId}`,
    );
  } else {
    await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET registration_form_json = NULL WHERE id = ${tripId}`);
  }

  if (itinerary !== null) {
    const i = JSON.stringify(itinerary);
    await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET itinerary_json = ${i}::jsonb WHERE id = ${tripId}`);
  } else {
    await prisma.$executeRaw(Prisma.sql`UPDATE business_trips SET itinerary_json = NULL WHERE id = ${tripId}`);
  }
}

function parseDateOnly(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return null;
  }
  const d = new Date(`${t}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDecimal(raw: string): Prisma.Decimal | null {
  const t = raw.trim();
  if (t === "" || !Number.isFinite(Number(t))) {
    return null;
  }
  return new Prisma.Decimal(t);
}

function parseHeroUrls(existingRaw: string | null | undefined): string[] {
  if (!existingRaw?.trim()) {
    return [];
  }
  try {
    const j = JSON.parse(existingRaw) as unknown;
    if (!Array.isArray(j)) {
      return [];
    }
    return j.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseJsonRegistration(raw: string): Prisma.InputJsonValue | null {
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

function parseItinerary(raw: string): Prisma.InputJsonValue | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object" && Array.isArray((v as { days?: unknown }).days)) {
      return v as Prisma.InputJsonValue;
    }
    return null;
  } catch {
    return null;
  }
}

function parseBookingTiersFormJson(raw: string): TripExtrasBookingTier[] {
  try {
    const v = JSON.parse(raw.trim() || "[]") as unknown;
    return readExtras({ booking_tiers: Array.isArray(v) ? v : [] }).booking_tiers;
  } catch {
    return [];
  }
}

function cloneExtrasJson(raw: unknown): Record<string, unknown> {
  if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

type TripDetailsHeroFlag =
  | { mode: "unchanged" }
  | { mode: "set"; url: string }
  | { mode: "clear" };

function buildExtrasPayload(
  base: Record<string, unknown>,
  shortDesc: string,
  tripLoc: string,
  tripManagerPhone: string,
  tripHelpEmail: string,
  tripHelpChatUrl: string,
  tripRegistrationCloseDate: string,
  tripIncludedItems: string[],
  tripExcludedItems: string[],
  tripNotes: string[],
  tripNotesHtml: string,
  tripFaqs: TripExtrasFaq[],
  tripPaymentSteps: TripExtrasPaymentStep[],
  totalSeats: number,
  advancePercent: number,
  bookingTiers: TripExtrasBookingTier[],
  bookingStatusNote: string,
  tripDetailsHero: TripDetailsHeroFlag,
): Prisma.InputJsonValue {
  const payload: Record<string, unknown> = { ...base };
  payload.short_description = shortDesc.trim() || null;
  payload.location = tripLoc.trim() || null;
  if (tripManagerPhone.trim()) {
    payload.trip_manager_phone = tripManagerPhone.trim();
  } else {
    delete payload.trip_manager_phone;
  }
  if (tripHelpEmail.trim()) {
    payload.trip_help_email = tripHelpEmail.trim();
  } else {
    delete payload.trip_help_email;
  }
  if (tripHelpChatUrl.trim()) {
    payload.trip_help_chat_url = tripHelpChatUrl.trim();
  } else {
    delete payload.trip_help_chat_url;
  }
  const closeD = tripRegistrationCloseDate.trim();
  if (closeD && /^\d{4}-\d{2}-\d{2}$/.test(closeD) && parseDateOnly(closeD)) {
    payload.trip_registration_close_date = closeD;
  } else {
    delete payload.trip_registration_close_date;
  }
  if (tripIncludedItems.length > 0) {
    payload.trip_included_items = tripIncludedItems;
  } else {
    delete payload.trip_included_items;
  }
  if (tripExcludedItems.length > 0) {
    payload.trip_excluded_items = tripExcludedItems;
  } else {
    delete payload.trip_excluded_items;
  }
  if (tripNotes.length > 0) {
    payload.trip_notes = tripNotes;
  } else {
    delete payload.trip_notes;
  }
  if (tripNotesHtml.trim()) {
    payload.trip_notes_html = tripNotesHtml.trim();
  } else {
    delete payload.trip_notes_html;
  }
  if (tripFaqs.length > 0) {
    payload.trip_faqs = tripFaqs.map((row) => ({
      question: row.question.trim(),
      answer: row.answer.trim(),
    }));
  } else {
    delete payload.trip_faqs;
  }
  if (tripPaymentSteps.length > 0) {
    payload.trip_payment_steps = tripPaymentSteps.map((row) => ({
      title: row.title.trim(),
      note: row.note.trim() || null,
    }));
  } else {
    delete payload.trip_payment_steps;
  }
  payload.total_seats = Number.isFinite(totalSeats) ? totalSeats : 30;
  payload.advance_percent = Number.isFinite(advancePercent) ? advancePercent : 20;

  if (bookingTiers.length > 0) {
    payload.booking_tiers = bookingTiers.map((t, idx) => ({
      id: (t.id || "").trim() || `t_${idx}`,
      label: t.label.trim(),
      subtitle: t.subtitle.trim() || null,
      price_mnt: Math.max(0, Math.round(t.price_mnt)),
    }));
  } else {
    delete payload.booking_tiers;
  }

  if (bookingStatusNote.trim()) {
    payload.booking_status_note = bookingStatusNote.trim();
  } else {
    delete payload.booking_status_note;
  }

  if (tripDetailsHero.mode === "set") {
    payload.trip_details_hero_url = tripDetailsHero.url;
  } else if (tripDetailsHero.mode === "clear") {
    delete payload.trip_details_hero_url;
  }

  return payload as Prisma.InputJsonValue;
}

export type SaveTripCoreResult =
  | { kind: "saved" }
  | { kind: "redirect"; to: string };

export type ExecuteSaveTripOptions = {
  /** Base path for validation/error redirects (no query). Default `/platform/trips`. */
  errorRedirectBase?: string;
};

/**
 * Shared trip upsert used by Server Action and `POST /api/platform/trips/save` (multipart + cookies).
 */
export async function executeSaveTrip(
  accountId: bigint,
  formData: FormData,
  options?: ExecuteSaveTripOptions,
): Promise<SaveTripCoreResult> {
  const errBase = (options?.errorRedirectBase ?? "/platform/trips").replace(/\/$/, "") || "/platform/trips";

  const tripId = Math.max(0, Number(String(formData.get("trip_id") ?? "0")));

  const destination = String(formData.get("trip_destination") ?? "").trim();
  const start = parseDateOnly(String(formData.get("trip_start_date") ?? ""));
  const end = parseDateOnly(String(formData.get("trip_end_date") ?? ""));
  const focus = String(formData.get("trip_focus") ?? "").trim() || null;
  const description = String(formData.get("trip_description") ?? "").trim() || null;
  const statusLabel = String(formData.get("trip_status_label") ?? "").trim() || null;

  const shortDesc = String(formData.get("trip_short_description") ?? "").trim();
  const tripLoc = String(formData.get("trip_location") ?? "").trim();
  const tripManagerPhone = String(formData.get("trip_manager_phone") ?? "").trim();
  const tripHelpEmail = String(formData.get("trip_help_email") ?? "").trim();
  const tripHelpChatUrl = String(formData.get("trip_help_chat_url") ?? "").trim();
  const tripRegistrationCloseDate = String(formData.get("trip_registration_close_date") ?? "").trim();
  const tripIncludedItems = formData
    .getAll("trip_included_items[]")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const tripExcludedItems = formData
    .getAll("trip_excluded_items[]")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const tripNotes = formData
    .getAll("trip_notes[]")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const tripNotesHtml = String(formData.get("trip_notes_html") ?? "").trim();
  const faqQuestions = formData.getAll("trip_faq_question[]").map((v) => String(v).trim());
  const faqAnswers = formData.getAll("trip_faq_answer[]").map((v) => String(v).trim());
  const tripFaqs: TripExtrasFaq[] = [];
  const faqLen = Math.max(faqQuestions.length, faqAnswers.length);
  for (let i = 0; i < faqLen; i++) {
    const question = faqQuestions[i] ?? "";
    const answer = faqAnswers[i] ?? "";
    if (!question || !answer) continue;
    tripFaqs.push({ question, answer });
  }
  const paymentStepTitles = formData.getAll("trip_payment_step_title[]").map((v) => String(v).trim());
  const paymentStepNotes = formData.getAll("trip_payment_step_note[]").map((v) => String(v).trim());
  const tripPaymentSteps: TripExtrasPaymentStep[] = [];
  const stepLen = Math.max(paymentStepTitles.length, paymentStepNotes.length);
  for (let i = 0; i < stepLen; i++) {
    const title = paymentStepTitles[i] ?? "";
    const note = paymentStepNotes[i] ?? "";
    if (!title) continue;
    tripPaymentSteps.push({ title, note });
  }
  const totalSeats = Math.max(0, Number(String(formData.get("trip_total_seats") ?? "30")) || 30);
  const advancePct = Math.max(0, Number(String(formData.get("trip_advance_percent") ?? "20")) || 20);

  const priceMnt = parseDecimal(String(formData.get("trip_price_mnt") ?? ""));
  const advanceOrderMnt = parseDecimal(String(formData.get("trip_advance_order_mnt") ?? ""));

  const seatsLabel = `${totalSeats} суудал`;

  const regRaw = String(formData.get("trip_registration_form_json") ?? "");
  const itineraryRaw = String(formData.get("trip_itinerary_json") ?? "");

  if (destination === "" || !start || !end) {
    return { kind: "redirect", to: `${errBase}?error=missing` };
  }
  if (end < start) {
    return { kind: "redirect", to: `${errBase}?error=dates` };
  }

  let existing: BusinessTrip | null = null;
  const trips = dbBusinessTrip();
  if (tripId > 0) {
    existing = await trips.findUnique({ where: { id: tripId } });
    if (!existing) {
      return { kind: "redirect", to: `${errBase}?error=notfound` };
    }
  }

  const previousCoverUrl = existing?.coverImageUrl?.trim() || null;
  const previousHeroUrls = existing?.heroSliderJson ? parseHeroUrls(existing.heroSliderJson) : [];

  let coverImageUrl = previousCoverUrl;
  const coverFile = formData.get("trip_cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const up = await writePlatformUploadImage(accountId, coverFile, 10 * 1024 * 1024);
    if (up.ok) {
      coverImageUrl = up.url;
    }
  }

  const keptSlides = formData
    .getAll("trip_existing_slides")
    .map((x) => String(x).trim())
    .filter(Boolean);

  let slides = [...keptSlides];

  const heroParts = formData.getAll("trip_hero_files");
  for (const part of heroParts) {
    if (part instanceof File && part.size > 0) {
      const up = await writePlatformUploadImage(accountId, part, 10 * 1024 * 1024);
      if (up.ok) {
        slides.push(up.url);
      }
    }
  }

  if (slides.length === 0 && existing?.heroSliderJson) {
    slides = parseHeroUrls(existing.heroSliderJson);
  }

  const heroSliderJson = slides.length > 0 ? JSON.stringify(slides) : null;

  if (tripId > 0 && existing) {
    const coverReplaced =
      coverFile instanceof File &&
      coverFile.size > 0 &&
      coverImageUrl &&
      previousCoverUrl &&
      coverImageUrl !== previousCoverUrl;
    if (coverReplaced) {
      await destroyCloudinaryBySecureUrl(previousCoverUrl);
    }
    for (const u of previousHeroUrls) {
      if (!slides.includes(u)) {
        await destroyCloudinaryBySecureUrl(u);
      }
    }
  }

  const registrationParsed = parseJsonRegistration(regRaw);
  const itineraryParsed = parseItinerary(itineraryRaw);
  const bookingTiersParsed = parseBookingTiersFormJson(String(formData.get("trip_booking_tiers_json") ?? "[]"));
  const bookingStatusNote = String(formData.get("trip_booking_status_note") ?? "").trim();

  const extrasBase = cloneExtrasJson(existing?.extrasJson);
  const previousDetailHeroUrl = String(extrasBase.trip_details_hero_url ?? "").trim();
  const detailHeroFile = formData.get("trip_detail_hero_file");
  const heroClear = String(formData.get("trip_details_hero_clear") ?? "") === "on";

  let tripDetailsHeroFlag: TripDetailsHeroFlag = { mode: "unchanged" };
  if (detailHeroFile instanceof File && detailHeroFile.size > 0) {
    const up = await writePlatformUploadImage(accountId, detailHeroFile, 10 * 1024 * 1024);
    if (up.ok) {
      tripDetailsHeroFlag = { mode: "set", url: up.url };
      if (tripId > 0 && previousDetailHeroUrl && previousDetailHeroUrl !== up.url) {
        await destroyCloudinaryBySecureUrl(previousDetailHeroUrl);
      }
    }
  } else if (heroClear) {
    tripDetailsHeroFlag = { mode: "clear" };
    if (tripId > 0 && previousDetailHeroUrl) {
      await destroyCloudinaryBySecureUrl(previousDetailHeroUrl);
    }
  }

  const tripExtras = buildExtrasPayload(
    extrasBase,
    shortDesc,
    tripLoc,
    tripManagerPhone,
    tripHelpEmail,
    tripHelpChatUrl,
    tripRegistrationCloseDate,
    tripIncludedItems,
    tripExcludedItems,
    tripNotes,
    tripNotesHtml,
    tripFaqs,
    tripPaymentSteps,
    totalSeats,
    advancePct,
    bookingTiersParsed,
    bookingStatusNote,
    tripDetailsHeroFlag,
  );

  const common = {
    destination,
    startDate: start,
    endDate: end,
    focus,
    description,
    statusLabel,
    seatsLabel,
    priceMnt,
    advanceOrderMnt,
    coverImageUrl,
    heroSliderJson,
  };

  if (tripId > 0) {
    await trips.update({
      where: { id: tripId },
      data: {
        ...common,
        isFeatured: existing!.isFeatured,
      },
    });
    await persistBusinessTripJsonColumns(tripId, tripExtras, registrationParsed, itineraryParsed);
    try {
      await syncTripRegistrationFormFromLegacyJson(tripId, registrationParsed);
    } catch (e) {
      console.error("[executeSaveTrip] syncTripRegistrationFormFromLegacyJson", e);
    }
  } else {
    const created = await trips.create({
      data: {
        ...common,
        managerAccountId: null,
        isFeatured: 0,
      },
    });
    await persistBusinessTripJsonColumns(created.id, tripExtras, registrationParsed, itineraryParsed);
    try {
      await syncTripRegistrationFormFromLegacyJson(created.id, registrationParsed);
    } catch (e) {
      console.error("[executeSaveTrip] syncTripRegistrationFormFromLegacyJson", e);
    }
  }

  return { kind: "saved" };
}
