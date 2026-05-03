import Link from "next/link";
import { FooterContactList } from "@/components/FooterContactList";
import { FooterRichLink } from "@/components/FooterRichLink";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import { BUSY_ARCHITECTURE_RULE, BUSY_MISSION_LINES, BUSY_PLATFORM_GOAL } from "@/lib/busy-platform-vision";
import { getFooterPublicConfig } from "@/lib/footer-public-config";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const cfg = await getFooterPublicConfig();

  return (
    <footer className="footer-v3 mt-auto">
      <div className="container">
        <div className="footer-main-grid">
          <div className="footer-logo-area">
            <Link href="/" className="d-inline-block mb-3 text-decoration-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/finallogo.png" alt={cfg.brandName} style={{ height: 40, width: "auto" }} />
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
            <FooterSocialLinks links={cfg.socialLinks} />
          </div>
          <div>
            <h4 className="footer-col-title">{cfg.contactColumnTitle}</h4>
            <FooterContactList contact={cfg.contact} />
          </div>
          <div>
            <h4 className="footer-col-title">{cfg.usefulLinksColumnTitle}</h4>
            <ul className="footer-links">
              {cfg.usefulLinks.map((item, idx) => (
                <li key={`${item.href}-${idx}`}>
                  <FooterRichLink href={item.href} className="text-reset text-decoration-none">
                    {item.label}
                  </FooterRichLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="footer-col-title">{cfg.platformColumnTitle}</h4>
            <p className="small text-muted mb-0">{cfg.platformBlurb}</p>
          </div>
        </div>
        <div className="pt-4 border-top">
          <p className="small text-muted m-0">
            © {year} {cfg.copyrightName}. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  );
}
