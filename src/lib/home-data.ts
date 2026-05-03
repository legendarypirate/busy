import type { BusinessTrip, LegacyMember, NewsArticle } from "@prisma/client";
import { dbBusinessTrip, prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-url";

type RecentOrderRow = { orderRef: string; createdAt: Date };
type PartnerProfileRow = { accountId: bigint; companyName: string | null; photoUrl: string | null };
type PartnerMemberRow = { id: number; name: string; company: string | null; photo: string | null };

export type HomePartner = { name: string; logo: string; href: string };

/** Upcoming BNI events for home «Танд санал болгох» (from `bni_events`). */
export type HomeCoreEvent = {
  id: string;
  title: string;
  startsAt: Date;
  location: string | null;
  bannerImage: string | null;
};

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
  coreEvents: HomeCoreEvent[];
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
  coreEvents: [],
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
    const tripDb = dbBusinessTrip();

    const [
      tripTotal,
      tripActive,
      eventTotalBni,
      eventActiveBni,
      registrationTotal,
      registrationNew,
      revenueAgg,
      recentOrders,
      businessTrips,
      coreEventsRows,
      latestNews,
      featuredMembers,
      profileRows,
      memberPartnerRows,
    ] = await Promise.all([
      tripDb.count().catch(() => 0),
      tripDb.count({ where: { startDate: { gte: today } } }).catch(() => 0),
      prisma.bniEvent.count().catch(() => 0),
      prisma.bniEvent.count({ where: { endsAt: { gte: new Date() } } }).catch(() => 0),
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
      tripDb
        .findMany({
          orderBy: [{ startDate: "asc" }, { id: "asc" }],
          take: 3,
        })
        .catch((): BusinessTrip[] => []),
      prisma.bniEvent
        .findMany({
          where: { endsAt: { gte: new Date() } },
          orderBy: [{ startsAt: "asc" }, { id: "asc" }],
          take: 6,
          select: { id: true, title: true, startsAt: true, location: true },
        })
        .catch((): { id: bigint; title: string | null; startsAt: Date; location: string | null }[] => []),
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

    const coreEvents: HomeCoreEvent[] = coreEventsRows.map((e) => ({
      id: e.id.toString(),
      title: (e.title ?? "").trim() || "Хурал / эвент",
      startsAt: e.startsAt,
      location: e.location,
      bannerImage: null,
    }));

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
        eventTotal: eventTotalBni,
        eventActive: eventActiveBni,
        registrationTotal,
        registrationNew,
        revenueMonth: Number(revenueAgg._sum.amountMnt ?? 0),
      },
      heroTrip: businessTrips[0] ?? null,
      coreEvents,
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
