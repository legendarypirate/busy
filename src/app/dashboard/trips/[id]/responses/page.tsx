import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import TripResponsesClient from "@/components/trip-registration/TripResponsesClient";
import { assertFormEditableByAccount } from "@/lib/trip-registration-form/organizer";
import { requirePlatformUser } from "@/lib/platform-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ formId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tripId = Number.parseInt(id, 10);
  if (!Number.isFinite(tripId)) return { title: "Хариултууд" };
  const trip = await prisma.businessTrip.findUnique({ where: { id: tripId }, select: { destination: true } }).catch(() => null);
  return { title: trip ? `${trip.destination} — хариултууд` : "Хариултууд" };
}

export default async function TripResponsesPage({ params, searchParams }: Props) {
  const { id } = await params;
  const tripId = Number.parseInt(id, 10);
  if (!Number.isFinite(tripId)) notFound();

  const sp = await searchParams;
  const formId = typeof sp.formId === "string" && sp.formId.length > 0 ? sp.formId : null;

  const nextPath = `/dashboard/trips/${tripId}/responses${formId ? `?formId=${encodeURIComponent(formId)}` : ""}`;
  const user = await requirePlatformUser(nextPath);

  const trip = await prisma.businessTrip.findUnique({ where: { id: tripId } }).catch(() => null);
  if (!trip) notFound();

  if (!formId) {
    const first = await prisma.tripRegistrationForm
      .findFirst({
        where: { tripId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      })
      .catch(() => null);
    if (first) {
      redirect(`/dashboard/trips/${tripId}/responses?formId=${encodeURIComponent(first.id)}`);
    }
    return (
      <DashboardPage maxWidthClass="max-w-xl">
        <p className="mb-2 text-sm text-muted-foreground">Энэ аялалд бүртгэлийн форм байхгүй байна.</p>
        <Link href={`/dashboard/trips/${tripId}/form-builder`} className="text-sm font-semibold text-primary hover:underline">
          Форм үүсгэх
        </Link>
      </DashboardPage>
    );
  }

  try {
    await assertFormEditableByAccount(formId, user.id);
  } catch {
    redirect("/dashboard/trips");
  }

  return (
    <DashboardPage>
      <DashboardBreadcrumb
        className="mb-3"
        items={[
          { label: "Аялалууд", href: "/dashboard/trips" },
          { label: `${trip.destination} — хариултууд` },
        ]}
      />

      <h1 className="mb-4 text-base font-semibold tracking-tight text-foreground">Хариултууд</h1>

      <TripResponsesClient tripId={tripId} formId={formId} />
    </DashboardPage>
  );
}
