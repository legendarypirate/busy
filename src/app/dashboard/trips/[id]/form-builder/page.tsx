import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import TripFormsHubClient from "@/components/trip-registration/TripFormsHubClient";
import { assertTripEditableByAccount } from "@/lib/trip-registration-form/service";
import { requirePlatformUser } from "@/lib/platform-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tripId = Number.parseInt(id, 10);
  if (!Number.isFinite(tripId)) return { title: "Форм" };
  const trip = await prisma.businessTrip.findUnique({ where: { id: tripId }, select: { destination: true } }).catch(() => null);
  return { title: trip ? `${trip.destination} — бүртгэлийн форм` : "Бүртгэлийн форм" };
}

export default async function TripFormBuilderPage({ params }: Props) {
  const { id } = await params;
  const tripId = Number.parseInt(id, 10);
  if (!Number.isFinite(tripId)) notFound();

  const nextPath = `/dashboard/trips/${tripId}/form-builder`;
  const user = await requirePlatformUser(nextPath);

  const trip = await prisma.businessTrip.findUnique({ where: { id: tripId } }).catch(() => null);
  if (!trip) notFound();

  try {
    await assertTripEditableByAccount(tripId, user.id);
  } catch {
    redirect("/dashboard/trips");
  }

  return (
    <DashboardPage>
      <DashboardBreadcrumb
        className="mb-3"
        items={[
          { label: "Аялалууд", href: "/dashboard/trips" },
          { label: trip.destination },
        ]}
      />

      <h1 className="text-base font-semibold tracking-tight text-foreground">{trip.destination}</h1>
      <p className="mb-4 text-xs text-muted-foreground">Бүртгэлийн форм</p>

      <TripFormsHubClient tripId={tripId} />
    </DashboardPage>
  );
}
