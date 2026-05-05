import AdminRegistrationResponseGrid from "@/components/admin/AdminRegistrationResponseGrid";
import { loadEventRegistrationGridRows } from "@/lib/admin-form-response-grid-data";
import { buildRegistrationGridSections } from "@/lib/admin-registration-response-grid";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props) {
  const { eventId: raw } = await params;
  if (!/^\d+$/.test(raw.trim())) return { title: "Хариултууд | Админ" };
  const ev = await prisma.bniEvent.findUnique({
    where: { id: BigInt(raw.trim()) },
    select: { title: true },
  });
  const t = ev?.title?.trim() || `Эвент #${raw}`;
  return { title: `${t} — хариултууд | Админ` };
}

export default async function AdminEventRegistrationResponsesPage({ params }: Props) {
  const { eventId: raw } = await params;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) notFound();
  const eventId = BigInt(trimmed);

  const ev = await prisma.bniEvent.findUnique({
    where: { id: eventId },
    select: { title: true },
  });
  if (!ev) notFound();

  const rows = await loadEventRegistrationGridRows(eventId);
  const sections = buildRegistrationGridSections(rows);

  return (
    <AdminRegistrationResponseGrid
      title={`Эвент #${trimmed} — ${ev.title?.trim() || "Хурал"}`}
      subtitle="Мөр бүр = нэг илгээлт. Q1, Q2 … дээр хулганаар бүрэн асуултыг харна. Асуулт өөрчлөгдвөл доор шинэ хүснэг."
      backHref="/admin/bni-events"
      backLabel="Хурлын жагсаалт"
      sections={sections}
    />
  );
}
