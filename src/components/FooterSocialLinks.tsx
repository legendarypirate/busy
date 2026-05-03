/** Same social row as marketing footers (URLs are placeholders until configured). */
export function FooterSocialLinks({ className = "footer-social" }: { className?: string }) {
  return (
    <div className={className}>
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
  );
}
