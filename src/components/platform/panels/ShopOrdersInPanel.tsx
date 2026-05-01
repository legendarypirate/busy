import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-session";

export default async function ShopOrdersInPanel() {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/shop_orders_in");
  }

  return (
    <>
      <div className="ps-hero mb-4">
        <div className="ps-hero-icon">
          <i className="fa-solid fa-inbox" />
        </div>
        <div>
          <h2 className="h4 fw-bold mb-1">Ирсэн захиалга</h2>
          <p className="mb-0 small opacity-75">Таны дэлгүүр руу ирсэн захиалгууд.</p>
        </div>
      </div>

      <div className="pm-card">
        <div className="pm-card-body py-5 text-center text-muted">
          <i className="fa-solid fa-inbox fa-2x mb-3 d-block opacity-50" />
          <div className="fw-semibold text-dark mb-1">Ирсэн захиалга байхгүй</div>
          <div className="small mb-3">Хэрэглэгчид таны нээлттэй дэлгүүрээс захиалга өгөхөд энд харагдана.</div>
          <Link href={`/company/${session.id.toString()}?tab=shop`} className="pm-btn-primary text-decoration-none d-inline-flex px-4 py-2">
            Дэлгүүр үзэх
          </Link>
        </div>
      </div>
    </>
  );
}
