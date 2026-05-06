"use client";

import { useMemo } from "react";

type Props = {
  /** Full absolute URL to this trip page (e.g. `https://busy.mn/trip-details/9`). */
  sharePageUrl: string;
  shareTitle: string;
};

export function TripDetailsSocialShare({ sharePageUrl, shareTitle }: Props) {
  const encodedUrl = useMemo(() => encodeURIComponent(sharePageUrl), [sharePageUrl]);
  const encodedText = useMemo(() => encodeURIComponent(shareTitle.trim() || "BUSY.mn — аялал"), [shareTitle]);

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const xHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;

  return (
    <div className="trd-share" aria-label="Сошиалд хуваалцах">
      <span className="trd-share-label">Хуваалцах</span>
      <div className="trd-share-btns">
        <a
          className="trd-share-btn trd-share-btn--fb"
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook-д хуваалцах"
        >
          <i className="fa-brands fa-facebook-f" aria-hidden />
        </a>
        <a
          className="trd-share-btn trd-share-btn--x"
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (Twitter) дээр хуваалцах"
        >
          <i className="fa-brands fa-twitter" aria-hidden />
        </a>
      </div>
    </div>
  );
}
