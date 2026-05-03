import Link from "next/link";
import { FooterContactList } from "@/components/FooterContactList";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-v3">
      <div className="container">
        <div className="footer-main-grid">
          <div className="footer-logo-area">
            <div className="logo">BUSY.mn</div>
            <p className="desc">
              Бизнес аялал, хурал, эвент үүсгэхэд зориулагдсан платформ
            </p>
            <FooterSocialLinks />
          </div>
          <div>
            <h4 className="footer-col-title">Холбоо барих</h4>
            <FooterContactList />
          </div>
          <div>
            <h4 className="footer-col-title">Хэрэгтэй холбоосууд</h4>
            <ul className="footer-links">
              <li><Link href="#">Нууцлалын бодлого</Link></li>
              <li><Link href="#">Нөхцөл, болзол</Link></li>
              <li><Link href="#">Тусламж, дэмжлэг</Link></li>
              <li><Link href="#">Хамтран ажиллах</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-col-title">Платформ</h4>
            <p className="small text-muted mb-3">Аялал, хурал, эвентын бүртгэл болон удирдлагыг нэг дороос.</p>
            <Link href="/platform" className="btn-footer-login">Платформ руу</Link>
          </div>
        </div>
        <div className="pt-4 border-top">
          <p className="small text-muted m-0">© {currentYear} BUSY. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}
