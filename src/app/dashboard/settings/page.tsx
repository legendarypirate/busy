import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Тохиргоо | Удирдлагын самбар",
};

export default function DashboardSettingsPage() {
  return (
    <DashboardPage maxWidthClass="max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Тохиргоо</h1>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Товч танилцуулга</CardTitle>
          <CardDescription>
            Хэл, мэдэгдэл, төлбөрийн данс зэрэг нарийн тохиргоо удахгүй энд нэмэгдэнэ. Одоогоор нэвтрэлт болон профайлаа доорх холбоосоор удирдана уу.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/auth/login" className={cn(buttonVariants({ variant: "link" }), "h-auto justify-start px-0")}>
            Нэвтрэх / бүртгэл
          </Link>
          <Link href="/dashboard/profile" className={cn(buttonVariants({ variant: "link" }), "h-auto justify-start px-0")}>
            Профайл
          </Link>
          <Link
            href="/auth/logout"
            className={cn(buttonVariants({ variant: "link" }), "h-auto justify-start px-0 text-destructive")}
          >
            Гарах
          </Link>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
