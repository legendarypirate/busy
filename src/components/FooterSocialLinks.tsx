import type { FooterSocialLink } from "@/lib/footer-public-config";

export function FooterSocialLinks({
  links,
  className = "footer-social",
}: {
  links: FooterSocialLink[];
  className?: string;
}) {
  if (links.length === 0) {
    return null;
  }
  return (
    <div className={className}>
      {links.map((s, i) => (
        <a key={`${s.label}-${i}`} href={s.href || "#"} className="social-circle" aria-label={s.label}>
          <i className={s.iconClass} aria-hidden />
        </a>
      ))}
    </div>
  );
}
