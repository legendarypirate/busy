import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMnDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Бүртгэлүүд | Удирдлагын самбар",
};

export const dynamic = "force-dynamic";

export default async function DashboardRegistrationsPage() {
  const orders = await prisma.paymentOrder
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    })
    .catch(() => []);

  return (
    <DashboardPage>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Бүртгэлүүд</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Төлбөрийн захиалгууд (MVP). 7 хоногийн хурлын оролцогчдын бүртгэлийг тухайн хурлын хуудсаас харна уу.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/weekly-meetings">7 хоногийн хурал</Link>
        </Button>
      </div>

      <Card className="overflow-hidden py-0 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Захиалга</TableHead>
              <TableHead>Зорилго</TableHead>
              <TableHead>Дүн (₮)</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead className="text-end">Огноо</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Захиалга алга.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id.toString()}>
                  <TableCell className="font-mono text-xs">{o.orderRef}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.targetType} · {o.targetId.toString()}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">{o.amountMnt.toLocaleString("mn-MN")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{o.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-end text-xs text-muted-foreground">
                    {formatMnDate(o.createdAt)}
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
