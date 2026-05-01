import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMnDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Хурал, эвентүүд | Удирдлагын самбар",
};

export const dynamic = "force-dynamic";

export default async function DashboardEventsPage() {
  const now = new Date();
  const events = await prisma.bniEvent
    .findMany({
      where: { endsAt: { gte: now } },
      orderBy: [{ startsAt: "asc" }],
      take: 80,
      include: {
        chapter: { include: { region: true } },
      },
    })
    .catch(() => []);

  const title = (ev: (typeof events)[number]) =>
    ev.title?.trim() || ev.chapter?.name?.trim() || "Хурал / эвент";

  return (
    <DashboardPage>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Хурал, эвентүүд</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ирэх үйл ажиллагаанууд — нийтийн хуудас болон платформоор удирдах.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/events">Нийтийн жагсаалт</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/events/create">Шинэ эвент</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/platform/events">Платформ</Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden py-0 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Нэр</TableHead>
              <TableHead>Эхлэх</TableHead>
              <TableHead>Төрөл</TableHead>
              <TableHead>Салбар</TableHead>
              <TableHead className="text-end">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Ирэх эвент олдсонгүй.{" "}
                  <Link href="/events" className="font-semibold text-primary hover:underline">
                    Бүх эвент
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              events.map((ev) => (
                <TableRow key={ev.id.toString()}>
                  <TableCell className="font-medium text-foreground">{title(ev)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatMnDate(ev.startsAt)}</TableCell>
                  <TableCell className="text-sm capitalize">{ev.eventType.replaceAll("_", " ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ev.chapter?.name ?? "—"}</TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/events/${ev.id.toString()}`}>Дэлгэрэнгүй</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </DashboardPage>
  );
}
