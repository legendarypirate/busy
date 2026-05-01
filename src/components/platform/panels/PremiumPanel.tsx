import Link from "next/link";
import { redirect } from "next/navigation";
import { mediaUrl } from "@/lib/media-url";
import { getPlatformSession } from "@/lib/platform-session";
import { prisma } from "@/lib/prisma";

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function uniquePriceMnt(): number {
  const raw = process.env.UNIQUE_COMPANY_PROFILE_PRICE_MNT?.trim();
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) {
    return 150000;
  }
  return Math.max(1000, Math.floor(n));
}

export default async function PremiumPanel() {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/premium");
  }

  const profile = await prisma.platformProfile.findUnique({
    where: { accountId: session.id },
    select: { businessJson: true },
  });

  const biz =
    profile?.businessJson && typeof profile.businessJson === "object" && !Array.isArray(profile.businessJson)
      ? (profile.businessJson as Record<string, unknown>)
      : {};

  const uniqueUntilRaw = str(biz.unique_profile_until);
  const uniqueTs = uniqueUntilRaw ? Date.parse(uniqueUntilRaw) : NaN;
  const isProfileUnique = Number.isFinite(uniqueTs) && uniqueTs > Date.now();
  const uniqueUntilStr = Number.isFinite(uniqueTs) ? new Date(uniqueTs).toLocaleDateString("mn-MN") : "—";
  const badgeUrl = str(biz.unique_badge_url);
  const price = uniquePriceMnt();

  return (
    <>
      <div className="pps-header">
        <div>
          <h2 className="h4 fw-bold mb-1">
            Онцлох профайл <i className="fa-solid fa-crown text-warning ms-1" />
          </h2>
          <p className="mb-0 small text-muted">Компанийн тань профайлыг илүү олон хүнд хүргэ.</p>
        </div>
        <div className="pps-status-widget">
          <div className="pps-status-icon">
            <i className="fa-solid fa-user-shield" />
          </div>
          <div className="pps-status-info">
            <span className="pps-status-label">Одоогийн түвшин</span>
            <span className="pps-status-value">{isProfileUnique ? "ОНЦЛОХ ГИШҮҮН" : "ҮНЭГҮЙ ГИШҮҮН"}</span>
          </div>
          {!isProfileUnique ? (
            <Link href="#" className="pps-status-link">
              Түвшин ахиулах <i className="fa-solid fa-chevron-right small" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="pps-grid">
        <div className="pps-main">
          <div className="pps-hero-card mb-4">
            <div className="pps-hero-title">Онцлох профайл гэж юу вэ?</div>
            <div className="pps-hero-text">
              Таны компанийг BUSY.mn дээр онцгой байрлалд гаргаж, илүү олон хүнд хүрэх боломж олгоно.
            </div>

            <div className="pps-features-grid">
              {[
                { icon: "fa-magnifying-glass", label: "Хайлалтын дээд хэсэгт байрлана" },
                { icon: "fa-users", label: "Илүү олон хандалт, лавлагаа" },
                { icon: "fa-certificate", label: "Онцлох тэмдэг (badge) гарна" },
                { icon: "fa-chess-queen", label: "Брендийн танигдалтыг өсгөнө" },
                { icon: "fa-award", label: "Итгэлцэл болон харагдах байдал нэмэгдэнэ" },
                { icon: "fa-rocket", label: "Бизнес боломжийг тэлнэ" },
              ].map((f) => (
                <div key={f.label} className="pps-feature-item">
                  <div className="pps-feature-icon">
                    <i className={`fa-solid ${f.icon}`} />
                  </div>
                  <span className="pps-feature-label">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="pps-mockup-preview">
              <div className="pps-mockup-header">Нийтийн жагсаалтын харагдац</div>
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: 64, height: 64, background: "#f1f5f9", borderRadius: 12, display: "grid", placeItems: "center" }}>
                  <i className="fa-solid fa-building text-muted fs-3" />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="badge bg-warning text-dark px-2 py-1" style={{ fontSize: "0.6rem" }}>
                      <i className="fa-solid fa-crown me-1" /> ОНЦЛОХ
                    </span>
                    <span className="fw-bold">Таны компани ХХК</span>
                    <i className="fa-solid fa-circle-check text-primary small" />
                  </div>
                  <div className="small text-muted mb-1">Барилга, инженерийн шийдэл</div>
                  <div className="d-flex gap-3 small text-muted" style={{ fontSize: "0.7rem" }}>
                    <span>
                      <i className="fa-solid fa-location-dot me-1" /> Улаанбаатар, Монгол Улс
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pm-card mb-4">
            <div className="pm-card-header">
              <i className="fa-solid fa-id-badge" />
              <div>
                <div className="pm-card-title">Онцлох badge зураг (заавал биш)</div>
                <div className="pm-card-subtitle">
                  Таны профайлын хажууд харагдах онцлох тэмдэг (badge) зураг оруулна уу.
                </div>
              </div>
            </div>
            <div className="pm-card-body">
              <div className="pps-badge-upload-grid">
                <div>
                  <div className="pm-upload-box mb-3" style={{ borderStyle: "dashed", padding: 24 }}>
                    <i className="fa-solid fa-upload text-primary fs-3 mb-2" />
                    <div className="small fw-bold">
                      Зураг чирч оруулах эсвэл <span className="text-primary">сонгоно уу</span>
                    </div>
                    <div className="pm-upload-info">PNG, JPG, WEBP • Хэмжээ: 512x512px хүртэл</div>
                  </div>
                  <button type="button" className="pm-btn-primary d-inline-flex px-4">
                    Хадгалах (удахгүй)
                  </button>
                </div>
                <div className="pps-badge-preview-box">
                  <div className="pps-status-label mb-2">Одоогийн харагдац</div>
                  <div className="pps-badge-img-wrap">
                    {badgeUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(badgeUrl)} alt="" style={{ maxHeight: 40 }} />
                    ) : (
                      <div className="badge bg-warning text-dark px-2 py-1">
                        <i className="fa-solid fa-crown me-1" /> ОНЦЛОХ КОМПАНИ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pps-benefits-grid">
            {[
              { icon: "fa-chart-line", label: "Илүү олон хандалт — Хайлалт болон жагсаалтад тэргүүн байрлал" },
              { icon: "fa-shield-check", label: "Итгэлцэл нэмэгдэнэ — Онцлох тэмдэг нь танд илүү итгэл төрүүлнэ" },
              { icon: "fa-clock", label: "Хялбар идэвхжүүлэлт — Төлбөр хийсний дараа шууд идэвхжинэ" },
              { icon: "fa-bullhorn", label: "Хугацаа сунгах боломжтой — Хугацаа дуусахаас өмнө санамж хүргэнэ" },
            ].map((b) => (
              <div key={b.label} className="pps-benefit-card">
                <div className="pps-benefit-icon">
                  <i className={`fa-solid ${b.icon}`} />
                </div>
                <div className="pps-benefit-label">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pps-sidebar">
          <div className="pps-sidebar-card">
            <div className="fw-bold text-muted small text-uppercase mb-3">Онцлох профайл идэвхжүүлэх</div>
            <div className="small text-muted">Үнэ (НӨАТ багтсан)</div>
            <div className="pps-price-tag">
              {price.toLocaleString("mn-MN")} <span>₮</span>
            </div>

            <div className="alert alert-warning small py-2 mb-2">
              QPay төлбөрийг Next хувилбарт тохируулаагүй бол суурин PHP (`pay-advance.php`) ашиглана уу.
            </div>
            <div className="text-center small text-muted" style={{ fontSize: "0.65rem" }}>
              QPay дансаар хурдан, найдвартай төлнө
            </div>

            <div className="mt-4 pt-3 border-top">
              <div className="d-flex align-items-center gap-2 mb-2 text-muted" style={{ fontSize: "0.75rem" }}>
                <i className="fa-solid fa-circle-check text-primary" /> 100% найдвартай төлбөр
              </div>
              <div className="d-flex align-items-center gap-2 mb-2 text-muted" style={{ fontSize: "0.75rem" }}>
                <i className="fa-solid fa-circle-check text-primary" /> Төлбөрийн баримт автоматаар
              </div>
              <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.75rem" }}>
                <i className="fa-solid fa-circle-check text-primary" /> 24/7 дэмжлэг
              </div>
            </div>
          </div>

          <div className="pps-sidebar-card">
            <div className="fw-bold text-muted small text-uppercase mb-3">Нэхэмжлэх / Төлбөрийн мэдээлэл</div>
            <div className="pps-invoice-table">
              <div className="pps-invoice-row">
                <span className="pps-invoice-label">Үйлчилгээ</span>
                <span className="pps-invoice-value">Онцлох профайл</span>
              </div>
              <div className="pps-invoice-row">
                <span className="pps-invoice-label">Хугацаа</span>
                <span className="pps-invoice-value">30 хоног (жишээ)</span>
              </div>
              <div className="pps-invoice-row">
                <span className="pps-invoice-label">Дуусах огноо</span>
                <span className="pps-invoice-value">{isProfileUnique ? uniqueUntilStr : "—"}</span>
              </div>
              <div className="pps-invoice-row">
                <span className="pps-invoice-label">НӨАТ (тооцоолол)</span>
                <span className="pps-invoice-value">+{Math.round(price * 0.1).toLocaleString("mn-MN")} ₮</span>
              </div>
              <div className="pps-total-row">
                <span className="pps-total-label">Нийт дүн</span>
                <span className="pps-total-value">{price.toLocaleString("mn-MN")} ₮</span>
              </div>
            </div>
          </div>

          <div className="pps-security-box">
            <div className="pps-security-icon">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div className="pps-security-text">
              Таны мэдээлэл найдвартай хамгаалагдана. Төлбөрийн дамжуулагчийн стандартуудын дагуу боловруулна.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 text-center border-top">
        <p className="small text-muted mb-0">
          <i className="fa-solid fa-circle-info me-2" />
          Асуулт, санал байвал support@busy.mn хаягаар холбогдоорой.
        </p>
      </div>
    </>
  );
}
