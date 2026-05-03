import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicTripRegistrationForm from "@/components/trip-registration/PublicTripRegistrationForm";
import type { PublicFormPayload } from "@/components/trip-registration/PublicTripRegistrationForm";
import { getPublishedFormBundleBySlug } from "@/lib/trip-registration-form/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ publicSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicSlug } = await params;
  const form = await getPublishedFormBundleBySlug(publicSlug).catch(() => null);
  if (!form) return { title: "Бүртгэл" };
  return { title: `${form.title} | BUSY.mn` };
}

export default async function PublicTripRegisterPage({ params }: Props) {
  const { publicSlug } = await params;
  const bundle = await getPublishedFormBundleBySlug(publicSlug).catch(() => null);
  if (!bundle) notFound();

  const tripBlock =
    bundle.trip != null
      ? {
          id: bundle.trip.id,
          destination: bundle.trip.destination,
          startDate: bundle.trip.startDate.toISOString(),
          endDate: bundle.trip.endDate.toISOString(),
          coverImageUrl: bundle.trip.coverImageUrl,
        }
      : bundle.event != null
        ? {
            id: 0,
            destination: bundle.event.title?.trim() || bundle.title,
            startDate: bundle.event.startsAt.toISOString(),
            endDate: bundle.event.endsAt.toISOString(),
            coverImageUrl: null as string | null,
          }
        : null;
  if (!tripBlock) notFound();

  const form: PublicFormPayload = {
    title: bundle.title,
    description: bundle.description,
    publicSlug: bundle.publicSlug,
    settings: bundle.settings,
    trip: tripBlock,
    questions: bundle.questions.map((q) => ({
      id: q.id,
      label: q.label,
      description: q.description,
      type: q.type,
      placeholder: q.placeholder,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      options: q.options.map((o) => ({ id: o.id, label: o.label, value: o.value })),
    })),
  };

  return <PublicTripRegistrationForm form={form} />;
}
