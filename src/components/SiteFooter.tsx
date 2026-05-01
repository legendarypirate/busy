import Link from "next/link";
import { BUSY_ARCHITECTURE_RULE, BUSY_MISSION_LINES, BUSY_PLATFORM_GOAL } from "@/lib/busy-platform-vision";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer-v3 mt-auto">
      <div className="container">
        <div className="footer-main-grid">
          <div className="footer-logo-area">
            <div className="logo">BUSY.mn</div>
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
            <div className="footer-social">
              <a href="#" className="social-circle" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f" aria-hidden />
              </a>
              <a href="#" className="social-circle" aria-label="LinkedIn">
                <i className="fa-brands fa-linkedin-in" aria-hidden />
              </a>
              <a href="#" className="social-circle" aria-label="YouTube">
                <i className="fa-brands fa-youtube" aria-hidden />
              </a>
              <a href="#" className="social-circle" aria-label="X">
                <i className="fa-brands fa-twitter" aria-hidden />
              </a>
            </div>
          </div>
          <div>
            <h4 className="footer-col-title">Холбоо барих</h4>
            <ul className="footer-links">
              <li>
                <i className="fa-solid fa-phone me-2" aria-hidden /> +976 7000 1010
              </li>
              <li>
                <i className="fa-solid fa-envelope me-2" aria-hidden /> info@busy.mn
              </li>
              <li>
                <i className="fa-solid fa-location-dot me-2" aria-hidden /> Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо,
                Olympic Street 19/1
              </li>
            </ul>
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
            <h4 className="footer-col-title">Админ хэсэг</h4>
            <p className="small text-muted mb-3">Гишүүн байгууллагын админ нэвтрэх хэсэг.</p>
            <Link href="/auth/login" className="btn-footer-login">
              Нэвтрэх
            </Link>
          </div>
        </div>
        <div className="pt-4 border-top">
          <p className="small text-muted m-0">© {year} BUSY. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}
