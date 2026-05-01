import Link from "next/link";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPageRoute() {
  return (
    <DashboardPage>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Тойм мэдээлэл</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/dashboard/trips">Аялал үүсгэх</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/events/create">Эвент үүсгэх</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Нийт аялал", value: "0", hint: "Энэ сард шинээр алга", accent: "text-primary" },
          { label: "Хурал, эвент", value: "0", hint: "Идэвхтэй эвентүүд", accent: "text-sky-600" },
          { label: "Нийт бүртгэл", value: "0", hint: "Хүлээгдэж буй 0", accent: "text-amber-600" },
          { label: "Нийт орлого", value: "₮0", hint: "Энэ сар", accent: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-[11px] font-medium uppercase tracking-wide">{s.label}</CardDescription>
              <CardTitle className={`text-2xl font-bold tabular-nums ${s.accent}`}>{s.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-0 py-0 shadow-md lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Сүүлийн бүртгэлүүд</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/registrations">Бүгд</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Арга хэмжээ</TableHead>
                  <TableHead>Огноо</TableHead>
                  <TableHead className="text-end">Төлөв</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Бүртгэл олдсонгүй
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-0 py-0 shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Хурдан холбоос</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
              <Link href="/dashboard/trips">
                <span className="flex w-full flex-col items-start gap-0.5 text-left">
                  <span className="font-semibold">Аялал удирдах</span>
                  <span className="text-xs font-normal text-muted-foreground">Аялал нэмэх, засах, устгах</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
              <Link href="/dashboard/events">
                <span className="flex w-full flex-col items-start gap-0.5 text-left">
                  <span className="font-semibold">Эвент удирдах</span>
                  <span className="text-xs font-normal text-muted-foreground">Хурал эвент нэмэх, засах</span>
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto w-full justify-start py-3">
              <Link href="/dashboard/payments">
                <span className="flex w-full flex-col items-start gap-0.5 text-left">
                  <span className="font-semibold">Төлбөр шалгах</span>
                  <span className="text-xs font-normal text-muted-foreground">QPay болон дансны гүйлгээ</span>
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardPage>
  );
}
