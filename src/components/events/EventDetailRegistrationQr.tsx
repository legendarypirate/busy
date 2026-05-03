"use client";

import { useCallback, useState } from "react";

type Props = {
  qrDataUrl: string;
  formUrl: string;
  caption?: string | null;
};

export function EventDetailRegistrationQr({ qrDataUrl, formUrl, caption }: Props) {
  const [copied, setCopied] = useState(false);

  const copyFormLink = useCallback(async () => {
    const url = formUrl.trim();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be denied */
    }
  }, [formUrl]);

  return (
    <div className="hev-reg-qr text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="Бүртгэлийн холбоос (QR)"
        width={168}
        height={168}
        className="hev-reg-qr__img"
        loading="lazy"
        decoding="async"
      />
      {formUrl.trim() ? (
        <button type="button" className="btn btn-sm btn-outline-primary mt-2 w-100" onClick={() => void copyFormLink()}>
          {copied ? "Хуулагдлаа" : "Холбоос хуулах"}
        </button>
      ) : null}
      {caption ? <p className="small text-muted mb-0 mt-2 text-center">{caption}</p> : null}
    </div>
  );
}
