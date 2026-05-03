import Link from "next/link";
import { FooterContactList } from "@/components/FooterContactList";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import { BUSY_ARCHITECTURE_RULE, BUSY_MISSION_LINES, BUSY_PLATFORM_GOAL } from "@/lib/busy-platform-vision";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer-v3 mt-auto">
      <div className="container">
        <div className="footer-main-grid">
          <div className="footer-logo-area">
            <Link href="/" className="d-inline-block mb-3 text-decoration-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/finallogo.png" alt="BUSY.mn" style={{ height: 40, width: "auto" }} />
            </Link>
            <p className="desc mb-2">{BUSY_MISSION_LINES.join(" ")}</p>
            <p className="desc small text-muted mb-2">{BUSY_ARCHITECTURE_RULE}</p>
            <p className="desc small text-muted mb-2">{BUSY_PLATFORM_GOAL}</p>
            <div className="d-flex flex-wrap gap-3">
              <Link href="/#busy-audiences" className="small text-primary text-decoration-none">
                Таван гол хэрэглэгч →
              </Link>
              <Link href="/#busy-participant-journey" className="small text-primary text-decoration-none">
                Оролцогчийн замнал →
              </Link>
            </div>
            <FooterSocialLinks />
          </div>
          <div>
            <h4 className="footer-col-title">Холбоо барих</h4>
            <FooterContactList />
          </div>
          <div>
            <h4 className="footer-col-title">Хэрэгтэй холбоосууд</h4>
            <ul className="footer-links">
              <li>
                <Link href="#">Нууцлалын бодлого</Link>
              </li>
              <li>
                <Link href="#">Нөхцөл, болзол</Link>
              </li>
              <li>
                <Link href="#">Тусламж, дэмжлэг</Link>
              </li>
              <li>
                <Link href="#">Хамтран ажиллах</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="footer-col-title">Платформ</h4>
            <p className="small text-muted mb-0">Аялал, хурал, эвентын бүртгэл болон удирдлагыг нэг дороос.</p>
          </div>
        </div>
        <div className="pt-4 border-top">
          <p className="small text-muted m-0">© {year} BUSY. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}
