import {
  getMarketingListingHeroSlides,
  slidesToTextareaLines,
} from "@/lib/marketing-listing-hero";
import { saveMarketingListingHeroSlidesAction } from "./actions";

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
        <code>/trips</code> болон <code>/events</code> хуудсын дээд «breadcrumb» бүсийн ард гулгах зургууд. Нэг мөр =
        нэг зураг (<code>https://…</code> эсвэл <code>/assets/…</code>).
      </p>

      {sp.saved === "1" ? (
        <div className="alert alert-success py-2 small mb-4">Хадгалагдлаа.</div>
      ) : null}

      <form action={saveMarketingListingHeroSlidesAction} className="card shadow-sm">
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label fw-semibold" htmlFor="trips_slides">
              Бизнес аялал (<code>/trips</code>)
            </label>
            <textarea
              id="trips_slides"
              name="trips_slides"
              className="form-control font-monospace small"
              rows={8}
              placeholder={"https://example.com/banner1.jpg\n/assets/img/trip-hero.png"}
              defaultValue={slidesToTextareaLines(tripsSlides)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold" htmlFor="events_slides">
              Хурал / эвент (<code>/events</code>)
            </label>
            <textarea
              id="events_slides"
              name="events_slides"
              className="form-control font-monospace small"
              rows={8}
              placeholder={"https://example.com/event-hero.jpg\n/assets/img/meeting-hero.png"}
              defaultValue={slidesToTextareaLines(eventsSlides)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Хадгалах
          </button>
        </div>
      </form>
    </div>
  );
}
