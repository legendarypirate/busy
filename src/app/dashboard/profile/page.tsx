import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformSession } from "@/lib/platform-session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Байгууллагын профайл | Удирдлагын самбар",
};

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const user = await getPlatformSession();
  let profile: { displayName: string; companyName: string | null; businessPhone: string | null; businessEmail: string | null } | null = null;
  if (user) {
    profile = await prisma.platformProfile
      .findUnique({
        where: { accountId: user.id },
        select: {
          displayName: true,
          companyName: true,
          businessPhone: true,
          businessEmail: true,
        },
      })
      .catch(() => null);
  }

  return (
    <DashboardPage maxWidthClass="max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Байгууллагын профайл</h1>

      {!user ? (
        <Card className="shadow-md">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">Профайл засахын тулд нэвтэрнэ үү.</p>
            <Button asChild>
              <Link href={`/auth/login?next=${encodeURIComponent("/dashboard/profile")}`}>Нэвтрэх</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">{profile?.displayName ?? user.displayName}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-[minmax(0,7rem)_1fr]">
              <dt className="text-muted-foreground">Компани</dt>
              <dd className="font-medium text-foreground">{profile?.companyName ?? "—"}</dd>
              <dt className="text-muted-foreground">Утас</dt>
              <dd className="font-medium text-foreground">{profile?.businessPhone ?? "—"}</dd>
              <dt className="text-muted-foreground">Ажлын имэйл</dt>
              <dd className="font-medium text-foreground">{profile?.businessEmail ?? "—"}</dd>
            </dl>
            <div className="border-t border-border" role="separator" />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/platform">Платформ профайл</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/settings">Тохиргоо</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardPage>
  );
}
