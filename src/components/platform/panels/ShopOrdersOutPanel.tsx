import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-session";

export default async function ShopOrdersOutPanel() {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/shop_orders");
  }

  return (
    <>
      <div className="ps-hero mb-4">
        <div className="ps-hero-icon">
          <i className="fa-solid fa-receipt" />
        </div>
        <div>
          <h2 className="h4 fw-bold mb-1">Өгсөн захиалга</h2>
          <p className="mb-0 small opacity-75">Та бусад дэлгүүрээс өгсөн захиалгууд энд харагдана.</p>
        </div>
      </div>

      <div className="pm-card">
        <div className="pm-card-body py-5 text-center text-muted">
          <i className="fa-solid fa-receipt fa-2x mb-3 d-block opacity-50" />
          <div className="fw-semibold text-dark mb-1">Өгсөн захиалга байхгүй</div>
          <div className="small">Захиалгын түүх удахгүй энд харагдана.</div>
        </div>
      </div>
    </>
  );
}
