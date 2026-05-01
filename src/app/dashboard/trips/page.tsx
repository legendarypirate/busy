import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import TripsDashboardTable from "@/components/dashboard/TripsDashboardTable";
import { Button } from "@/components/ui/button";
import { dbBusinessTrip } from "@/lib/prisma";
import { getPlatformSession } from "@/lib/platform-session";

export const metadata: Metadata = {
  title: "Аялалууд | Удирдлагын самбар",
};

export const dynamic = "force-dynamic";

export default async function DashboardTripsPage() {
  const user = await getPlatformSession();
  const tripDb = dbBusinessTrip();
  const trips = await tripDb
    .findMany({
      orderBy: [{ startDate: "desc" }],
      take: 80,
    })
    .catch(() => []);

  const tripRows = trips.map((t) => ({
    id: t.id,
    destination: t.destination,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    statusLabel: t.statusLabel,
    coverImageUrl: t.coverImageUrl,
    managerAccountId: t.managerAccountId != null ? Number(t.managerAccountId) : null,
  }));

  return (
    <DashboardPage>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Аялалууд</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Нийтийн каталог болон таны хариуцсан аяллууд. Дэлгэрэнгүй, бүртгэл нь ирээдүйн модульд холбогдоно.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/trips">Нийтийн жагсаалт</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/platform/trips">Платформ — аялал</Link>
          </Button>
        </div>
      </div>

      <TripsDashboardTable trips={tripRows} currentUserId={user?.id != null ? Number(user.id) : null} />
    </DashboardPage>
  );
}
