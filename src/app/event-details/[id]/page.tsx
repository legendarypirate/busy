import { permanentRedirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Legacy `/event-details/:id` (PHP / bookmarks) → canonical `/events/:id`. */
export default async function EventDetailsLegacyRedirect({ params }: Props) {
  const { id } = await params;
  const safe = encodeURIComponent(id.trim() || "0");
  permanentRedirect(`/events/${safe}`);
}
