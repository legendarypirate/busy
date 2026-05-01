import type { BusinessTrip, LegacyMeeting, LegacyMember, NewsArticle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-url";

type RecentOrderRow = { orderRef: string; createdAt: Date };
type PartnerProfileRow = { accountId: bigint; companyName: string | null; photoUrl: string | null };
type PartnerMemberRow = { id: number; name: string; company: string | null; photo: string | null };

export type HomePartner = { name: string; logo: string; href: string };

export type HomePayload = {
  stats: {
    tripTotal: number;
    tripActive: number;
    eventTotal: number;
    eventActive: number;
    registrationTotal: number;
    registrationNew: number;
    revenueMonth: number;
  };
  /** Prefer concrete Prisma models — `Awaited<ReturnType<typeof prisma.*.findMany>>` can degrade to `any[]` in some setups. */
  heroTrip: BusinessTrip | null;
  coreMeetings: LegacyMeeting[];
  businessTrips: BusinessTrip[];
  latestNews: NewsArticle[];
  featuredMembers: LegacyMember[];
  partners: HomePartner[];
  recentOrders: RecentOrderRow[];
};

const empty: HomePayload = {
  stats: {
    tripTotal: 0,
    tripActive: 0,
    eventTotal: 0,
    eventActive: 0,
    registrationTotal: 0,
    registrationNew: 0,
    revenueMonth: 0,
  },
  heroTrip: null,
  coreMeetings: [],
  businessTrips: [],
  latestNews: [],
  featuredMembers: [],
  partners: [],
  recentOrders: [],
};

export async function loadHomeData(): Promise<HomePayload> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEndExclusive = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      tripTotal,
      tripActive,
      eventTotal,
      eventActive,
      registrationTotal,
      registrationNew,
      revenueAgg,
      recentOrders,
      businessTrips,
      coreMeetings,
      latestNews,
      featuredMembers,
      profileRows,
      memberPartnerRows,
    ] = await Promise.all([
      prisma.businessTrip.count().catch(() => 0),
      prisma.businessTrip.count({ where: { startDate: { gte: today } } }).catch(() => 0),
      prisma.legacyMeeting.count().catch(() => 0),
      prisma.legacyMeeting.count({ where: { status: "active" } }).catch(() => 0),
      prisma.paymentOrder.count({ where: { status: { in: ["paid", "success"] } } }).catch(() => 0),
      prisma.paymentOrder
        .count({
          where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        })
        .catch(() => 0),
      prisma.paymentOrder
        .aggregate({
          where: {
            status: { in: ["paid", "success"] },
            createdAt: { gte: monthStart, lt: monthEndExclusive },
          },
          _sum: { amountMnt: true },
        })
        .catch(() => ({ _sum: { amountMnt: null as number | null } })),
      prisma.paymentOrder
        .findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { orderRef: true, createdAt: true },
        })
        .catch((): RecentOrderRow[] => []),
      prisma.businessTrip
        .findMany({
          orderBy: [{ startDate: "asc" }, { id: "asc" }],
          take: 3,
        })
        .catch((): BusinessTrip[] => []),
      prisma.legacyMeeting
        .findMany({
          where: { status: "active", meetingDate: { gte: today } },
          orderBy: [{ meetingDate: "asc" }, { startTime: "asc" }],
          take: 6,
        })
        .catch((): LegacyMeeting[] => []),
      prisma.newsArticle
        .findMany({
          where: { status: "published" },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 3,
        })
        .catch((): NewsArticle[] => []),
      prisma.legacyMember
        .findMany({
          where: { featured: 1, status: "active" },
          take: 12,
        })
        .catch((): LegacyMember[] => []),
      prisma.platformProfile
        .findMany({
          where: { companyName: { not: null } },
          orderBy: { updatedAt: "desc" },
          take: 120,
          select: { accountId: true, companyName: true, photoUrl: true },
        })
        .catch((): PartnerProfileRow[] => []),
      prisma.legacyMember
        .findMany({
          where: { company: { not: null } },
          orderBy: { updatedAt: "desc" },
          take: 60,
          select: { id: true, name: true, company: true, photo: true },
        })
        .catch((): PartnerMemberRow[] => []),
    ]);

    const shuffledMembers = [...featuredMembers].sort(() => Math.random() - 0.5).slice(0, 6);

    const partners: HomePartner[] = [];
    const seen = new Set<string>();
    if (profileRows.length) {
      for (const row of profileRows) {
        const name = (row.companyName ?? "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const id = Number(row.accountId);
        partners.push({
          name,
          logo: mediaUrl(row.photoUrl),
          href: id > 0 ? `/company/${id}` : `/members?q=${encodeURIComponent(name)}`,
        });
        if (partners.length >= 24) break;
      }
    } else {
      for (const row of memberPartnerRows) {
        const company = (row.company ?? "").trim();
        if (!company) continue;
        const key = company.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        partners.push({
          name: company,
          logo: mediaUrl(row.photo),
          href: `/members?q=${encodeURIComponent(company)}`,
        });
        if (partners.length >= 24) break;
      }
    }

    return {
      stats: {
        tripTotal,
        tripActive,
        eventTotal,
        eventActive,
        registrationTotal,
        registrationNew,
        revenueMonth: Number(revenueAgg._sum.amountMnt ?? 0),
      },
      heroTrip: businessTrips[0] ?? null,
      coreMeetings,
      businessTrips,
      latestNews,
      featuredMembers: shuffledMembers,
      partners,
      recentOrders,
    };
  } catch {
    return empty;
  }
}
