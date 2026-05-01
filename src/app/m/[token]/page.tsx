import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatClockUtc, formatMnDate } from "@/lib/format-date";
import PublicWeeklyRegisterForm from "@/components/weekly-meeting/PublicWeeklyRegisterForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function PublicWeeklyMeetingRegisterPage({ params }: Props) {
  const { token } = await params;
  const t = token.trim();
  if (!t) notFound();

  const meeting = await prisma.busyWeeklyMeeting
    .findUnique({
      where: { publicToken: t },
      include: { group: true },
    })
    .catch(() => null);

  if (!meeting) notFound();

  const registrationOpen =
    meeting.enableMemberRegistration ||
    meeting.enableGuestRegistration ||
    meeting.enableSubstituteRegistration;
  if (!registrationOpen) {
    return (
      <main className="container py-5 text-center">
        <h1 className="h5 fw-bold">Бүртгэл хаалттай</h1>
        <p className="text-muted small mb-0">Энэ хурлын зохион байгуулагч бүртгэлийг идэвгүй болгосон байна.</p>
      </main>
    );
  }

  const feeLabel =
    meeting.feeMnt !== null && meeting.feeMnt !== undefined
      ? `${Number(meeting.feeMnt).toLocaleString("mn-MN")} ₮`
      : "Төлбөр тодорхойлогдоогүй";

  const flags = {
    enableMemberRegistration: meeting.enableMemberRegistration,
    enableGuestRegistration: meeting.enableGuestRegistration,
    enableSubstituteRegistration: meeting.enableSubstituteRegistration,
    enableShortIntroduction: meeting.enableShortIntroduction,
  };

  return (
    <main className="container py-5">
      <div className="mx-auto" style={{ maxWidth: 640 }}>
        <div className="text-center mb-4">
          <div className="text-uppercase small text-muted">BUSY.mn</div>
          <h1 className="h4 fw-bold">{meeting.group.name}</h1>
          <p className="text-muted mb-1">
            {formatMnDate(meeting.meetingDate)} · {formatClockUtc(meeting.startTime)}
            {meeting.endTime ? ` — ${formatClockUtc(meeting.endTime)}` : ""}
          </p>
          <p className="text-muted small mb-0">{meeting.location ?? ""}</p>
          <p className="small mt-2 mb-0">
            <span className="text-muted">Уулзалтын төлбөр:</span> {feeLabel}
          </p>
        </div>
        <PublicWeeklyRegisterForm token={t} flags={flags} />
      </div>
    </main>
  );
}
