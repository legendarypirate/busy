import type { NextRequest } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { accountCanManageWeeklyMeeting } from "@/lib/busy-rbac";

function absoluteRegisterUrl(req: Request, token: string): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (!host) return `/m/${token}`;
  return `${proto}://${host}/m/${token}`;
}

export async function renderWeeklyMeetingQrPng(
  req: NextRequest,
  meetingId: bigint,
  userId: bigint,
): Promise<{ ok: true; body: Uint8Array } | { ok: false; status: 403 | 404 }> {
  const meeting = await prisma.busyWeeklyMeeting.findUnique({
    where: { id: meetingId },
    include: { group: true },
  });
  if (!meeting) return { ok: false, status: 404 };

  const allowed = await accountCanManageWeeklyMeeting(userId, meeting.group.organizerAccountId);
  if (!allowed) return { ok: false, status: 403 };

  const url = absoluteRegisterUrl(req, meeting.publicToken);
  const buf = await QRCode.toBuffer(url, { type: "png", width: 512, margin: 2 });
  return { ok: true, body: new Uint8Array(buf) };
}
