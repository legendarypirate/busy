"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  /** Page path, e.g. `/trip-details/9` */
  sharePath: string;
  /** Trip title for X post text */
  shareTitle: string;
  /** When set (e.g. from `NEXT_PUBLIC_APP_URL`), used for sharer URLs without waiting for client. */
  canonicalUrl?: string;
};

export function TripDetailsSocialShare({ sharePath, shareTitle, canonicalUrl = "" }: Props) {
  const [pageUrl, setPageUrl] = useState(() => canonicalUrl.trim());

  useEffect(() => {
    const c = canonicalUrl.trim();
    if (c) {
      setPageUrl(c);
      return;
    }
    if (typeof window === "undefined") return;
    const path = sharePath.startsWith("/") ? sharePath : `/${sharePath}`;
    setPageUrl(`${window.location.origin}${path}`);
  }, [canonicalUrl, sharePath]);

  const encodedUrl = useMemo(() => encodeURIComponent(pageUrl), [pageUrl]);
  const encodedText = useMemo(() => encodeURIComponent(shareTitle.trim() || "BUSY.mn — аялал"), [shareTitle]);

  const fbHref = pageUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` : "#";
  const xHref = pageUrl ? `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` : "#";

  const block = (e: React.MouseEvent) => {
    if (!pageUrl) e.preventDefault();
  };

  return (
    <div className="trd-share" aria-label="Сошиалд хуваалцах">
      <span className="trd-share-label">Хуваалцах</span>
      <div className="trd-share-btns">
        <a
          className={`trd-share-btn trd-share-btn--fb${!pageUrl ? " trd-share-btn--hold" : ""}`}
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook-д хуваалцах"
          onClick={block}
        >
          <i className="fa-brands fa-facebook-f" aria-hidden />
        </a>
        <a
          className={`trd-share-btn trd-share-btn--x${!pageUrl ? " trd-share-btn--hold" : ""}`}
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (Twitter) дээр хуваалцах"
          onClick={block}
        >
          <i className="fa-brands fa-x-twitter" aria-hidden />
        </a>
      </div>
    </div>
  );
}
