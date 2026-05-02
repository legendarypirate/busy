"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMnDate } from "@/lib/format-date";
import { mediaUrl } from "@/lib/media-url";

export type TripRow = {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  statusLabel: string | null;
  coverImageUrl: string | null;
  managerAccountId: number | null;
};

export default function TripsDashboardTable({ trips, currentUserId }: { trips: TripRow[]; currentUserId: number | null }) {
  return (
    <Card className="overflow-hidden py-0 shadow-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Чиглэл</TableHead>
            <TableHead>Эхлэх</TableHead>
            <TableHead>Дуусах</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead className="whitespace-nowrap">Форм</TableHead>
            <TableHead className="text-end">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                Өгөгдөл олдсонгүй.{" "}
                <Link href="/trips" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Нийтийн аяллууд
                </Link>
                -аас үзнэ үү.
              </TableCell>
            </TableRow>
          ) : (
            trips.map((t) => {
              const mine = currentUserId != null && t.managerAccountId != null && t.managerAccountId === currentUserId;
              const cover = mediaUrl(t.coverImageUrl ?? "");
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" width={40} height={28} className="rounded-md object-cover" />
                      ) : (
                        <span className="inline-flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <span className="text-xs" aria-hidden>
                            ✈
                          </span>
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-foreground">{t.destination}</div>
                        {mine ? (
                          <Badge variant="secondary" className="mt-0.5 text-[10px]">
                            Таных
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatMnDate(new Date(t.startDate))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatMnDate(new Date(t.endDate))}
                  </TableCell>
                  <TableCell className="text-sm">{t.statusLabel ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    <Link href={`/dashboard/trips/${t.id}/form-builder`} className="font-semibold text-primary hover:underline">
                      Форм
                    </Link>
                    {" · "}
                    <Link href={`/dashboard/trips/${t.id}/responses`} className="font-semibold text-primary hover:underline">
                      Хариулт
                    </Link>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/trip-details/${t.id}`}>Дэлгэрэнгүй</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
