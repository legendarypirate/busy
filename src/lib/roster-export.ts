import type { BusyMeetingGroup, BusyMeetingRegistration, BusyWeeklyMeeting } from "@prisma/client";

export type RosterMeetingBundle = {
  group: BusyMeetingGroup;
  meeting: BusyWeeklyMeeting;
  registrations: BusyMeetingRegistration[];
};

function csvEscape(value: string): string {
  const v = value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  if (/[",\n]/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
}

function moneyToNumber(fee: BusyWeeklyMeeting["feeMnt"]): number {
  if (fee === null || fee === undefined) return 0;
  return Number(fee);
}

/** Collected fee: sum of rows marked paid × meeting fee (MVP; per-seat amount can extend later). */
export function rosterFeeCollectedMnt(meeting: BusyWeeklyMeeting, registrations: BusyMeetingRegistration[]): number {
  const unit = moneyToNumber(meeting.feeMnt);
  if (!unit) return 0;
  const paidCount = registrations.filter((r) => r.paymentStatus === "paid").length;
  return paidCount * unit;
}

export function buildMeetingRosterCsv(bundle: RosterMeetingBundle): string {
  const { group, meeting, registrations } = bundle;
  const feeUnit = moneyToNumber(meeting.feeMnt);
  const members = registrations.filter((r) => r.participantType === "member");
  const guests = registrations.filter((r) => r.participantType === "guest");
  const subs = registrations.filter((r) => r.participantType === "substitute");

  const headerLines = [
    ["BUSY.mn — Weekly meeting roster"],
    ["Group / chapter", group.name],
    ["Date", meeting.meetingDate.toISOString().slice(0, 10)],
    ["Start (UTC time field)", meeting.startTime.toISOString().slice(11, 19)],
    meeting.endTime ? ["End (UTC time field)", meeting.endTime.toISOString().slice(11, 19)] : ["End", ""],
    ["Location", meeting.location ?? ""],
    ["Total registered", String(registrations.length)],
    ["Total members", String(members.length)],
    ["Total guests", String(guests.length)],
    ["Total substitutes", String(subs.length)],
    ["Fee per seat (MNT)", String(feeUnit)],
    ["Total fee collected (MNT, MVP)", String(rosterFeeCollectedMnt(meeting, registrations))],
    [],
  ];

  const cols = [
    "participant_type",
    "display_name",
    "company",
    "position",
    "business_category",
    "phone",
    "email",
    "invited_by",
    "payment_status",
    "attendance_status",
    ...(meeting.enableShortIntroduction ? (["short_introduction"] as const) : []),
  ];

  const body = registrations.map((r) => {
    const base = [
      r.participantType,
      r.displayName,
      r.companyName ?? "",
      r.position ?? "",
      r.businessCategory ?? "",
      r.phone ?? "",
      r.email ?? "",
      r.invitedBy ?? "",
      r.paymentStatus,
      r.attendanceStatus,
    ];
    if (meeting.enableShortIntroduction) base.push(r.shortIntroduction ?? "");
    return base.map((c) => csvEscape(String(c))).join(",");
  });

  const headerCsv = headerLines.map((line) => line.map(csvEscape).join(",")).join("\n");
  return `${headerCsv}\n${cols.join(",")}\n${body.join("\n")}\n`;
}
