import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { defaultTripFormThankYouMn } from "@/lib/trip-registration-form/thank-you";
import { getPublishedFormBundleBySlug } from "@/lib/trip-registration-form/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ publicSlug: string }> };

export const metadata: Metadata = {
  title: "Бүртгэл амжилттай",
};

export default async function RegisterSuccessPage({ params }: Props) {
  const { publicSlug } = await params;
  const bundle = await getPublishedFormBundleBySlug(publicSlug).catch(() => null);
  if (!bundle) notFound();

  const message = defaultTripFormThankYouMn(bundle.settings);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-10 shadow-sm">
        <p className="text-lg font-semibold text-green-900">Бүртгэл амжилттай</p>
        <p className="mt-4 text-slate-700">{message}</p>
        <p className="mt-2 text-sm text-slate-500">{bundle.title}</p>
      </div>
      <Link href="/trips" className="mt-8 inline-block text-blue-700 underline">
        Аялалууд руу буцах
      </Link>
    </div>
  );
}
