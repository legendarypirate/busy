import AdminRegistrationResponseGrid from "@/components/admin/AdminRegistrationResponseGrid";
import { loadTripRegistrationGridRows } from "@/lib/admin-form-response-grid-data";
import { buildRegistrationGridSections } from "@/lib/admin-registration-response-grid";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ tripId: string }> };

export async function generateMetadata({ params }: Props) {
  const { tripId: raw } = await params;
  const id = Math.max(0, Number.parseInt(raw, 10));
  if (!Number.isFinite(id) || id < 1) return { title: "Хариултууд | Админ" };
  const trip = await prisma.businessTrip.findUnique({ where: { id }, select: { destination: true } });
  const t = trip?.destination?.trim() || `Аялал #${id}`;
  return { title: `${t} — хариултууд | Админ` };
}

export default async function AdminTripRegistrationResponsesPage({ params }: Props) {
  const { tripId: raw } = await params;
  const tripId = Math.max(0, Number.parseInt(raw, 10));
  if (!Number.isFinite(tripId) || tripId < 1) notFound();

  const trip = await prisma.businessTrip.findUnique({
    where: { id: tripId },
    select: { destination: true },
  });
  if (!trip) notFound();

  const rows = await loadTripRegistrationGridRows(tripId);
  const sections = buildRegistrationGridSections(rows);

  return (
    <AdminRegistrationResponseGrid
      title={`Аялал #${tripId} — ${trip.destination?.trim() || "Бизнес аялал"}`}
      subtitle="Excel хэлбэрийн хүснэг. Формын асуултын багц өөрчлөгдвөл шинэ хэсэг эхэлнэ. Эхний багц нь хамгийн эрт илгээсэн хариултууд."
      backHref="/admin/trips"
      backLabel="Аяллын жагсаалт"
      sections={sections}
    />
  );
}
