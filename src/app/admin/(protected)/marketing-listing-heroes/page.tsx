import MarketingListingHeroesForm from "@/components/admin/MarketingListingHeroesForm";
import { getMarketingListingHeroSlides } from "@/lib/marketing-listing-hero";

export const metadata = { title: "Нүүрний hero (аялал, эвент) | Админ" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function MarketingListingHeroesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [tripsSlides, eventsSlides] = await Promise.all([
    getMarketingListingHeroSlides("trips"),
    getMarketingListingHeroSlides("events"),
  ]);

  return (
    <div>
      <h1 className="h4 fw-bold mb-2">Нүүрний hero — аялал / эвент жагсаалт</h1>
      <p className="text-muted small mb-4">
        <code>/trips</code> болон <code>/events</code> хуудсын дээд «breadcrumb» бүсийн ард гулгах зургууд. Олон файл
        сонгоод Cloudinary руу ачаалж, доорх жагсаалтад URL нэмэгдэнэ. Нэмэлтээр гараар URL оруулж болно (нэг мөр =
        нэг зураг).
      </p>

      <MarketingListingHeroesForm
        initialTrips={tripsSlides}
        initialEvents={eventsSlides}
        showSaved={sp.saved === "1"}
      />
    </div>
  );
}
