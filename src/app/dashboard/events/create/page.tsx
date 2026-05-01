import Link from "next/link";
import type { Metadata } from "next";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Эвент үүсгэх | Удирдлагын самбар",
};

export default function DashboardEventCreatePage() {
  return (
    <DashboardPage maxWidthClass="max-w-xl">
      <DashboardBreadcrumb
        className="mb-3"
        items={[
          { label: "Хурал, эвентүүд", href: "/dashboard/events" },
          { label: "Шинэ" },
        ]}
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Шинэ эвент үүсгэх</CardTitle>
          <CardDescription>
            Энэ хэсэг удахгүй бүрэн формтой нээгдэнэ. Одоогоор платформын эвент самбараас үүсгэж болно.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/platform/events">Платформ — эвент</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/events">Буцах</Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
