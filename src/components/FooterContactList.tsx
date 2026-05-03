import type { FooterPublicConfig } from "@/lib/footer-public-config";

type Props = {
  contact: FooterPublicConfig["contact"];
  className?: string;
  /** Slightly larger copy for the dedicated contact page */
  large?: boolean;
};

export function FooterContactList({ contact, className = "footer-links", large }: Props) {
  const itemClass = large ? "mb-3" : undefined;
  return (
    <ul className={className}>
      <li className={itemClass}>
        <a href={`tel:${contact.phoneTel}`} className="text-reset text-decoration-none">
          <i className="fa-solid fa-phone me-2" aria-hidden />
          {contact.phoneDisplay}
        </a>
      </li>
      <li className={itemClass}>
        <a href={`mailto:${contact.email}`} className="text-reset text-decoration-none">
          <i className="fa-solid fa-envelope me-2" aria-hidden />
          {contact.email}
        </a>
      </li>
      <li className={itemClass}>
        <span className="d-inline-flex">
          <i className="fa-solid fa-location-dot me-2 mt-1 flex-shrink-0" aria-hidden />
          <span>{contact.addressLine}</span>
        </span>
      </li>
    </ul>
  );
}
