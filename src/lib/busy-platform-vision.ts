/**
 * BUSY.mn product vision — single source of truth for copy and product rules.
 * Use these constants in marketing UI, platform chrome, and docs; extend with EN strings when i18n lands.
 */

export const BUSY_MISSION_LINES = [
  "Бизнес боломжоо үүсгэ.",
  "Зөв хүмүүстэй холбогд.",
  "Үр дүнгээ удирд.",
] as const;

/** Drives architecture and prioritization for every feature. */
export const BUSY_ARCHITECTURE_RULE =
  "Энэ байршуулалт платформын бүх архитектурыг удирдана.";

/** UX principle: goal-oriented entry, minimal friction to the user’s task. */
export const BUSY_PLATFORM_GOAL =
  "Хэрэглэгч бүр өөрийн зорилгоор орж ирээд, өөрт хэрэгтэй үйлдлээ хурдан хийдэг байх.";

export type BusyAudienceId =
  | "participant"
  | "organizer"
  | "business_member"
  | "supplier"
  | "investor_partner";

export type BusyAudience = {
  id: BusyAudienceId;
  title: string;
  description: string;
  /** Optional Font Awesome icon class (solid). */
  iconClass: string;
};

/** Five primary audiences BUSY.mn serves. Order is intentional. */
export const BUSY_AUDIENCES: readonly BusyAudience[] = [
  {
    id: "participant",
    title: "Оролцогч",
    description: "Бизнес аялал, хурал, эвентэд оролцох хүн.",
    iconClass: "fa-solid fa-user-check",
  },
  {
    id: "organizer",
    title: "Зохион байгуулагч",
    description: "Аялал, хурал, эвент, B2B уулзалт үүсгэх хүн.",
    iconClass: "fa-solid fa-calendar-plus",
  },
  {
    id: "business_member",
    title: "Бизнес гишүүн",
    description: "Өөрийн компани, үйлчилгээ, бүтээгдэхүүнээ танилцуулах хүн.",
    iconClass: "fa-solid fa-building",
  },
  {
    id: "supplier",
    title: "Нийлүүлэгч / үйлдвэр",
    description: "Бүтээгдэхүүн, үйлдвэр, боломж санал болгох тал.",
    iconClass: "fa-solid fa-industry",
  },
  {
    id: "investor_partner",
    title: "Хөрөнгө оруулагч / түнш",
    description: "Төсөл, хамтын ажиллагаа, хөрөнгө оруулалт хайх тал.",
    iconClass: "fa-solid fa-handshake",
  },
] as const;

export function busyMissionHeadline(): string {
  return BUSY_MISSION_LINES.join(" ");
}

/** Canonical funnel for the **Оролцогч** audience — product and UX should preserve this order. */
export const BUSY_PARTICIPANT_JOURNEY_TITLE = "Оролцогчийн замнал";

export const BUSY_PARTICIPANT_JOURNEY_LEAD =
  "Нүүрээс эхлээд аялал дуусах хүртэлх алхмууд — навигаци, бүртгэл, төлбөр, dashboard-ийг энэ дарааллаар уялдуулна.";

export type BusyParticipantJourneyStep = {
  /** Stable key for analytics / future step state. */
  id:
    | "home"
    | "pick_trip_event"
    | "detail"
    | "register"
    | "profile"
    | "pay"
    | "participant_dashboard"
    | "program_notifications"
    | "follow_up";
  label: string;
};

export const BUSY_PARTICIPANT_JOURNEY_STEPS: readonly BusyParticipantJourneyStep[] = [
  { id: "home", label: "Нүүр хуудас" },
  { id: "pick_trip_event", label: "Аялал/эвент сонгох" },
  { id: "detail", label: "Дэлгэрэнгүй мэдээлэл харах" },
  { id: "register", label: "Бүртгүүлэх" },
  { id: "profile", label: "Профайл бөглөх" },
  { id: "pay", label: "Төлбөр төлөх" },
  { id: "participant_dashboard", label: "Оролцогчийн dashboard" },
  { id: "program_notifications", label: "Уулзалт, хөтөлбөр, мэдэгдэл харах" },
  { id: "follow_up", label: "Аяллын дараа follow-up авах" },
] as const;
