import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPlatformSession } from "@/lib/platform-session";
import { accountCanManageWeeklyMeeting } from "@/lib/busy-rbac";
import { formatClockUtc, formatMnDate } from "@/lib/format-date";
import { rosterFeeCollectedMnt } from "@/lib/roster-export";
import PrintTrigger from "./PrintTrigger";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function WeeklyMeetingPrintPage({ params }: Props) {
  const user = await getPlatformSession();
  if (!user) return null;

  const { id } = await params;
  let meetingId: bigint;
  try {
    meetingId = BigInt(id);
  } catch {
    notFound();
  }

  const meeting = await prisma.busyWeeklyMeeting
    .findUnique({
      where: { id: meetingId },
      include: { group: true, registrations: { orderBy: [{ participantType: "asc" }, { displayName: "asc" }] } },
    })
    .catch(() => null);

  if (!meeting) notFound();
  const allowed = await accountCanManageWeeklyMeeting(user.id, meeting.group.organizerAccountId);
  if (!allowed) notFound();

  const members = meeting.registrations.filter((r) => r.participantType === "member");
  const guests = meeting.registrations.filter((r) => r.participantType === "guest");
  const subs = meeting.registrations.filter((r) => r.participantType === "substitute");
  const collected = rosterFeeCollectedMnt(meeting, meeting.registrations);

  const mapRow = (r: (typeof meeting.registrations)[number]) => ({
    id: r.id.toString(),
    displayName: r.displayName,
    companyName: r.companyName,
    position: r.position,
    businessCategory: r.businessCategory,
    phone: r.phone,
    paymentStatus: r.paymentStatus,
    attendanceStatus: r.attendanceStatus,
    shortIntroduction: r.shortIntroduction,
  });

  return (
    <div className="container py-4">
      <div className="d-print-none mb-3 d-flex gap-2">
        <Link href={`/dashboard/weekly-meetings/${meeting.id.toString()}`} className="btn btn-sm btn-outline-secondary">
          Буцах
        </Link>
        <PrintTrigger />
      </div>

      <div className="busy-roster-print card border-0 shadow-sm rounded-4 p-4">
        <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
          <div>
            <div className="text-uppercase small text-muted">BUSY.mn — Roster</div>
            <h1 className="h4 fw-bold mb-1">{meeting.group.name}</h1>
            <div className="small">
              {formatMnDate(meeting.meetingDate)} · {formatClockUtc(meeting.startTime)}
              {meeting.endTime ? ` — ${formatClockUtc(meeting.endTime)}` : ""}
            </div>
            <div className="small mt-1">{meeting.location ?? ""}</div>
          </div>
          <div className="text-end small">
            <div>Нийт бүртгэл: {meeting.registrations.length}</div>
            <div>Гишүүн: {members.length}</div>
            <div>Зочин: {guests.length}</div>
            <div>Орлогч: {subs.length}</div>
            <div className="fw-semibold mt-1">Төлбөр төлөгдсөн (MVP): {collected.toLocaleString("mn-MN")} ₮</div>
          </div>
        </div>

        <RosterTable title="Гишүүд" rows={members.map(mapRow)} showIntro={meeting.enableShortIntroduction} />
        <RosterTable title="Зочид" rows={guests.map(mapRow)} showIntro={meeting.enableShortIntroduction} />
        <RosterTable title="Орлогчид" rows={subs.map(mapRow)} showIntro={meeting.enableShortIntroduction} />
      </div>
    </div>
  );
}

function RosterTable({
  title,
  rows,
  showIntro,
}: {
  title: string;
  rows: {
    id: string;
    displayName: string;
    companyName: string | null;
    position: string | null;
    businessCategory: string | null;
    phone: string | null;
    paymentStatus: string;
    attendanceStatus: string;
    shortIntroduction: string | null;
  }[];
  showIntro: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mb-4">
      <h2 className="h6 fw-bold">{title}</h2>
      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>Нэр</th>
              <th>Компани</th>
              <th>Албан тушаал</th>
              <th>Ангилал</th>
              <th>Утас</th>
              <th>Төлбөр</th>
              <th>Ирц</th>
              {showIntro ? <th>Танилцуулга</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.displayName}</td>
                <td>{r.companyName ?? ""}</td>
                <td>{r.position ?? ""}</td>
                <td>{r.businessCategory ?? ""}</td>
                <td>{r.phone ?? ""}</td>
                <td>{r.paymentStatus}</td>
                <td>{r.attendanceStatus}</td>
                {showIntro ? <td className="small">{r.shortIntroduction ?? ""}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
