import { MembershipStatus, TripFormResponseWorkflowStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type GrowthHint = {
  pctLabel: string;
  tone: "up" | "down" | "neutral";
  sublabel: string;
};

export type PlatformDashboardStats = {
  totalEvents: number;
  eventGrowth: GrowthHint;
  upcomingNext30d: number;
  totalRegistrations: number;
  registrationGrowth: GrowthHint;
  attendancePresent: number;
  attendanceTotal: number;
  attendancePct: number | null;
  revenueTotalMnt: number;
  revenueGrowth: GrowthHint;
  pendingApprovals: number;
};

const MS_DAY = 24 * 60 * 60 * 1000;

function growthHint(current: number, previous: number, sublabel: string): GrowthHint {
  if (previous <= 0) {
    if (current <= 0) {
      return { pctLabel: "0%", tone: "neutral", sublabel };
    }
    return { pctLabel: "Шинэ", tone: "up", sublabel };
  }
  const raw = Math.round(((current - previous) / previous) * 100);
  if (raw === 0) {
    return { pctLabel: "0%", tone: "neutral", sublabel };
  }
  return {
    pctLabel: `${Math.abs(raw)}%`,
    tone: raw > 0 ? "up" : "down",
    sublabel,
  };
}

function formatMnt(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return "0₮";
  }
  return `${Math.round(n).toLocaleString("mn-MN")}₮`;
}

export function formatPlatformRevenue(n: number): string {
  return formatMnt(n);
}

export async function loadPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * MS_DAY);
  const d60 = new Date(now.getTime() - 60 * MS_DAY);
  const d30Ahead = new Date(now.getTime() + 30 * MS_DAY);

  const [
    totalEvents,
    eventsLast30,
    eventsPrev30,
    upcomingNext30d,
    meetingRegsTotal,
    tripResponsesTotal,
    meetingRegsLast30,
    meetingRegsPrev30,
    tripRegsLast30,
    tripRegsPrev30,
    attendancePresent,
    attendanceTotal,
    paidOrdersSum,
    tripPaidSum,
    revenueLast30,
    revenuePrev30,
    pendingTripReviews,
    pendingMemberships,
    pendingPayments,
  ] = await Promise.all([
    prisma.bniEvent.count().catch(() => 0),
    prisma.bniEvent.count({ where: { createdAt: { gte: d30 } } }).catch(() => 0),
    prisma.bniEvent.count({ where: { createdAt: { gte: d60, lt: d30 } } }).catch(() => 0),
    prisma.bniEvent
      .count({
        where: {
          startsAt: { gte: now, lte: d30Ahead },
          endsAt: { gte: now },
        },
      })
      .catch(() => 0),
    prisma.busyMeetingRegistration.count().catch(() => 0),
    prisma.tripFormResponse.count().catch(() => 0),
    prisma.busyMeetingRegistration.count({ where: { createdAt: { gte: d30 } } }).catch(() => 0),
    prisma.busyMeetingRegistration.count({ where: { createdAt: { gte: d60, lt: d30 } } }).catch(() => 0),
    prisma.tripFormResponse.count({ where: { submittedAt: { gte: d30 } } }).catch(() => 0),
    prisma.tripFormResponse.count({ where: { submittedAt: { gte: d60, lt: d30 } } }).catch(() => 0),
    prisma.busyMeetingRegistration
      .count({
        where: {
          attendanceStatus: { in: ["present", "late", "substitute_present"] },
        },
      })
      .catch(() => 0),
    prisma.busyMeetingRegistration.count().catch(() => 0),
    prisma.paymentOrder
      .aggregate({
        where: { status: { in: ["paid", "success"] } },
        _sum: { amountMnt: true },
      })
      .catch(() => ({ _sum: { amountMnt: null as number | null } })),
    prisma.tripPayment
      .aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: null } })),
    prisma.paymentOrder
      .aggregate({
        where: {
          status: { in: ["paid", "success"] },
          createdAt: { gte: d30 },
        },
        _sum: { amountMnt: true },
      })
      .catch(() => ({ _sum: { amountMnt: null as number | null } })),
    prisma.paymentOrder
      .aggregate({
        where: {
          status: { in: ["paid", "success"] },
          createdAt: { gte: d60, lt: d30 },
        },
        _sum: { amountMnt: true },
      })
      .catch(() => ({ _sum: { amountMnt: null as number | null } })),
    prisma.tripFormResponse
      .count({
        where: { status: TripFormResponseWorkflowStatus.UNDER_REVIEW },
      })
      .catch(() => 0),
    prisma.chapterMembership.count({ where: { status: MembershipStatus.pending } }).catch(() => 0),
    prisma.paymentOrder.count({ where: { status: "pending" } }).catch(() => 0),
  ]);

  const totalRegistrations = meetingRegsTotal + tripResponsesTotal;
  const regsLast30 = meetingRegsLast30 + tripRegsLast30;
  const regsPrev30 = meetingRegsPrev30 + tripRegsPrev30;

  const orderTotal = Number(paidOrdersSum._sum.amountMnt ?? 0);
  const tripTotalNum = tripPaidSum._sum.amount != null ? Number(tripPaidSum._sum.amount) : 0;
  const revenueTotalMnt = orderTotal + (Number.isFinite(tripTotalNum) ? tripTotalNum : 0);

  const revLast = Number(revenueLast30._sum.amountMnt ?? 0);
  const revPrev = Number(revenuePrev30._sum.amountMnt ?? 0);
  const [tripRevLast, tripRevPrev] = await Promise.all([
    prisma.tripPayment
      .aggregate({
        where: { status: "PAID", createdAt: { gte: d30 } },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: null } })),
    prisma.tripPayment
      .aggregate({
        where: { status: "PAID", createdAt: { gte: d60, lt: d30 } },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: null } })),
  ]);
  const tripLast = tripRevLast._sum.amount != null ? Number(tripRevLast._sum.amount) : 0;
  const tripPrev = tripRevPrev._sum.amount != null ? Number(tripRevPrev._sum.amount) : 0;
  const revenueLast30Total = revLast + (Number.isFinite(tripLast) ? tripLast : 0);
  const revenuePrev30Total = revPrev + (Number.isFinite(tripPrev) ? tripPrev : 0);

  const attendancePct =
    attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null;

  return {
    totalEvents,
    eventGrowth: growthHint(eventsLast30, eventsPrev30, "сүүлийн 30 хоногт"),
    upcomingNext30d,
    totalRegistrations,
    registrationGrowth: growthHint(regsLast30, regsPrev30, "нийт өсөлт"),
    attendancePresent,
    attendanceTotal,
    attendancePct,
    revenueTotalMnt,
    revenueGrowth: growthHint(revenueLast30Total, revenuePrev30Total, "сүүлийн 30 хоногт"),
    pendingApprovals: pendingTripReviews + pendingMemberships + pendingPayments,
  };
}

export function formatPlatformInteger(n: number): string {
  return Math.round(n).toLocaleString("mn-MN");
}
