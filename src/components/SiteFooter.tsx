import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer-v3 mt-auto">
      <div className="container">
        <div className="footer-main-grid">
          <div className="footer-logo-area">
            <div className="logo">BUSY.mn</div>
            <p className="desc">Бизнес аялал, хурал, эвент үүсгэхэд зориулагдсан платформ</p>
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
