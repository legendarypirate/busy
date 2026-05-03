import Link from "next/link";

/** Дотоод `/…` бол Next `Link`, бусад бол `<a>` (гадны URL-д target=_blank). */
export function FooterRichLink({
  href,
  className = "text-reset",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const h = href.trim() || "#";
  if (h.startsWith("/") && !h.startsWith("//")) {
    return (
      <Link href={h} className={className}>
        {children}
      </Link>
    );
  }
  const external = /^https?:\/\//i.test(h);
  return (
    <a
      href={h}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
