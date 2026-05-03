import { SITE_CONTACT } from "@/lib/site-contact";

/** `tel:` href + display label from admin-entered phone (MN-friendly). */
export function helpPhoneTelParts(raw: string): { href: string; label: string } | null {
  const label = raw.trim();
  if (!label) return null;
  const compact = label.replace(/[\s-]/g, "");
  let href: string;
  if (compact.startsWith("+")) {
    href = `tel:${compact}`;
  } else if (compact.startsWith("00")) {
    href = `tel:+${compact.slice(2)}`;
  } else if (/^976\d{8}$/.test(compact)) {
    href = `tel:+${compact}`;
  } else if (/^0\d{8}$/.test(compact)) {
    href = `tel:+976${compact.slice(1)}`;
  } else {
    href = `tel:${compact}`;
  }
  return { href, label };
}

/** Display + mailto; empty → site default email. */
export function helpEmailParts(raw: string, defaultEmail: string = SITE_CONTACT.email): { label: string; href: string } {
  let a = raw.trim();
  if (a.toLowerCase().startsWith("mailto:")) {
    a = a.slice("mailto:".length).split("?")[0].trim();
  }
  if (!a) a = defaultEmail;
  return { label: a, href: `mailto:${a}` };
}

/** Chat / messenger link; empty → null. */
export function normalizeHelpChatHref(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("#")) return t;
  if (t.startsWith("/")) return t;
  const lower = t.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}
