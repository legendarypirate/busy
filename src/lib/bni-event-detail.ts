import { mediaUrl } from "@/lib/media-url";

export type BniEventDetailEnvelope = {
  sections: unknown[];
  intro_body: string;
  audience_text: string;
  /** Optional hero image (URL or site-relative path); shown on public event detail. */
  hero_image_url: string;
  speakers: { name: string; role: string; photo_url: string }[];
  faq: { question: string; answer: string }[];
  /** Public `/events/:id` — «Тусламж» tiles (same idea as trip-details). */
  event_manager_phone: string;
  event_help_email: string;
  event_help_chat_url: string;
};

export type AgendaDisplayRow = { time: string; title: string; note: string };

const DESC_DEFAULT =
  "Долоо хоног бүрийн гишүүдийн уулзалт, зочдын танилцуулга, бизнес танилцуулга, сүлжээ холбоо тогтоох албан ёсны хурал.";

const AUDIENCE_DEFAULT = "Бизнес эрхлэгчид, шийдвэр гаргагчид, хөрөнгө оруулагчид, салбарын төлөөллүүд.";

export function parseBniEventDetailEnvelope(raw: unknown): BniEventDetailEnvelope {
  const base: BniEventDetailEnvelope = {
    sections: [],
    intro_body: "",
    audience_text: "",
    hero_image_url: "",
    speakers: [],
    faq: [],
    event_manager_phone: "",
    event_help_email: "",
    event_help_chat_url: "",
  };
  let obj: Record<string, unknown> | null = null;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const j = JSON.parse(raw) as unknown;
      if (j && typeof j === "object" && !Array.isArray(j)) {
        obj = j as Record<string, unknown>;
      }
    } catch {
      return base;
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  }
  if (!obj) {
    return base;
  }
  if (Array.isArray(obj.sections)) {
    base.sections = obj.sections;
  }
  base.intro_body = String(obj.intro_body ?? "").trim();
  base.audience_text = String(obj.audience_text ?? "").trim();
  base.hero_image_url = String(obj.hero_image_url ?? obj.heroImageUrl ?? "").trim();
  if (Array.isArray(obj.speakers)) {
    for (const sp of obj.speakers) {
      if (!sp || typeof sp !== "object") {
        continue;
      }
      const r = sp as Record<string, unknown>;
      const name = String(r.name ?? "").trim();
      const role = String(r.role ?? "").trim();
      const photo_url = String(r.photo_url ?? "").trim();
      if (name === "" && role === "" && photo_url === "") {
        continue;
      }
      base.speakers.push({ name, role, photo_url });
    }
  }
  base.event_manager_phone = String(obj.event_manager_phone ?? obj.eventManagerPhone ?? "").trim();
  base.event_help_email = String(obj.event_help_email ?? obj.eventHelpEmail ?? "").trim();
  base.event_help_chat_url = String(obj.event_help_chat_url ?? obj.eventHelpChatUrl ?? "").trim();

  if (Array.isArray(obj.faq)) {
    for (const f of obj.faq) {
      if (!f || typeof f !== "object") {
        continue;
      }
      const r = f as Record<string, unknown>;
      const question = String(r.question ?? r.q ?? "").trim();
      const answer = String(r.answer ?? r.a ?? "").trim();
      if (question === "" && answer === "") {
        continue;
      }
      base.faq.push({ question, answer });
    }
  }
  return base;
}

type CurriculumAgendaItem = {
  title: string;
  minutes: number | null;
  description: string;
};

function parseCurriculumAgendaJson(agendaJson: unknown): CurriculumAgendaItem[] {
  let text = "";
  if (agendaJson == null) {
    return [];
  }
  if (typeof agendaJson === "string") {
    text = agendaJson.trim();
  } else {
    try {
      text = JSON.stringify(agendaJson);
    } catch {
      return [];
    }
  }
  if (!text) {
    return [];
  }
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    return [];
  }
  if (!data || typeof data !== "object") {
    return [];
  }
  const sections = (
    Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>).sections)
        ? (data as Record<string, unknown>).sections
        : []
  ) as unknown[];
  const out: CurriculumAgendaItem[] = [];
  for (const s of sections) {
    if (!s || typeof s !== "object") {
      continue;
    }
    const row = s as Record<string, unknown>;
    const title = String(row.title ?? row.name ?? "").trim();
    let minutes: number | null = null;
    if (row.duration_minutes != null && Number.isFinite(Number(row.duration_minutes))) {
      minutes = Number(row.duration_minutes);
    } else if (row.minutes != null && Number.isFinite(Number(row.minutes))) {
      minutes = Number(row.minutes);
    }
    const description = String(row.description ?? row.detail ?? "").trim();
    if (title !== "") {
      out.push({ title, minutes: minutes && minutes > 0 ? minutes : null, description });
    }
  }
  return out;
}

export function buildAgendaDisplayRows(
  envelope: BniEventDetailEnvelope,
  curriculumAgendaJson: unknown,
): AgendaDisplayRow[] {
  const sections = envelope.sections;
  if (Array.isArray(sections) && sections.length > 0) {
    const rows: AgendaDisplayRow[] = [];
    for (const sec of sections) {
      if (!sec || typeof sec !== "object") {
        continue;
      }
      const s = sec as Record<string, unknown>;
      const time = String(s.time ?? "").trim();
      const title = String(s.title ?? "").trim();
      const note = String(s.note ?? s.description ?? "").trim();
      if (title === "" && time === "" && note === "") {
        continue;
      }
      rows.push({ time, title: title !== "" ? title : "—", note });
    }
    if (rows.length > 0) {
      return rows;
    }
  }
  const parsed = parseCurriculumAgendaJson(curriculumAgendaJson);
  if (parsed.length > 0) {
    return parsed.map((p) => ({
      time: p.minutes != null && p.minutes > 0 ? `~${p.minutes} мин` : "",
      title: p.title,
      note: p.description,
    }));
  }
  return [];
}

export function resolvedEventDescription(envelope: BniEventDetailEnvelope): string {
  const t = envelope.intro_body.trim();
  if (t !== "") {
    return t;
  }
  return DESC_DEFAULT;
}

export function resolvedAudienceText(envelope: BniEventDetailEnvelope): string {
  const t = envelope.audience_text.trim();
  if (t !== "") {
    return t;
  }
  return AUDIENCE_DEFAULT;
}

/** Up to 3 short lines for /events listing «Товч» (location, intro, audience/chapter). */
export function eventListingSummaryBullets(input: {
  location: string | null;
  isOnline: boolean;
  curriculumOverrideJson: unknown;
  chapterName: string | null;
}): string[] {
  const env = parseBniEventDetailEnvelope(input.curriculumOverrideJson ?? undefined);
  const out: string[] = [];
  const loc = input.location?.trim() ?? "";
  if (input.isOnline) {
    out.push(loc ? `Онлайн · ${loc.slice(0, 120)}` : "Онлайн арга хэмжээ");
  } else if (loc) {
    out.push(loc.slice(0, 140));
  } else {
    out.push("Байршил удахгүй тодорно.");
  }
  const intro = resolvedEventDescription(env).trim();
  const defaultIntro = intro === DESC_DEFAULT;
  if (!defaultIntro) {
    const one = intro.length > 180 ? `${intro.slice(0, 177)}…` : intro;
    out.push(one);
  }
  const aud = resolvedAudienceText(env).trim();
  const defaultAud = aud === AUDIENCE_DEFAULT;
  if (out.length < 3 && !defaultAud) {
    out.push(aud.length > 130 ? `${aud.slice(0, 127)}…` : aud);
  } else if (out.length < 3 && input.chapterName?.trim()) {
    out.push(`Бүлэг: ${input.chapterName.trim()}`);
  }
  return out.slice(0, 3);
}

/** Hero for event detail: absolute URL, media helper path, or empty → caller uses default asset. */
export function resolvedEventHeroImageUrl(envelope: BniEventDetailEnvelope): string {
  const raw = envelope.hero_image_url.trim();
  if (raw === "") {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const u = mediaUrl(raw);
  if (u.startsWith("http://") || u.startsWith("https://")) {
    return u;
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/** Card / listing image: hero from envelope or default asset. */
export function eventListingCardImageUrl(curriculumOverrideJson: unknown): string {
  const env = parseBniEventDetailEnvelope(curriculumOverrideJson ?? undefined);
  const hero = resolvedEventHeroImageUrl(env);
  if (hero !== "") {
    return hero;
  }
  return "/assets/img/meeting-hero.png";
}

/** Speaker portrait: remote URL, media base for uploads, or ui-avatars fallback (matches PHP). */
export function speakerPortraitUrl(name: string, photoUrl: string): string {
  const raw = photoUrl.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  if (raw !== "") {
    const u = mediaUrl(raw);
    if (u.startsWith("http://") || u.startsWith("https://")) {
      return u;
    }
  }
  const initial = name.trim().slice(0, 1) || "?";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=1d4ed8&color=fff&size=128`;
}

export function eventTypeBadgeMn(eventType: string): string {
  switch (eventType) {
    case "visitor_day":
      return "Visitor";
    case "training":
      return "Сургалт";
    case "social":
      return "Social";
    case "event":
      return "Event";
    default:
      return "BNI";
  }
}
