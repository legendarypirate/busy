import { notFound, permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Public marketing URL `/trips/:id` → full PHP-parity layout (tabs, itinerary) at `/trip-details/:id`. */
export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num) || num < 1) {
    notFound();
  }
  permanentRedirect(`/trip-details/${num}`);
}
