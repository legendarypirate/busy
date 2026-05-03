import { SITE_CONTACT } from "@/lib/site-contact";

type Props = {
  className?: string;
  /** Slightly larger copy for the dedicated contact page */
  large?: boolean;
};

export function FooterContactList({ className = "footer-links", large }: Props) {
  const itemClass = large ? "mb-3" : undefined;
  return (
    <ul className={className}>
      <li className={itemClass}>
        <a href={`tel:${SITE_CONTACT.phoneTel}`} className="text-reset text-decoration-none">
          <i className="fa-solid fa-phone me-2" aria-hidden />
          {SITE_CONTACT.phoneDisplay}
        </a>
      </li>
      <li className={itemClass}>
        <a href={`mailto:${SITE_CONTACT.email}`} className="text-reset text-decoration-none">
          <i className="fa-solid fa-envelope me-2" aria-hidden />
          {SITE_CONTACT.email}
        </a>
      </li>
      <li className={itemClass}>
        <span className="d-inline-flex">
          <i className="fa-solid fa-location-dot me-2 mt-1 flex-shrink-0" aria-hidden />
          <span>{SITE_CONTACT.addressLine}</span>
        </span>
      </li>
    </ul>
  );
}
