"use client";

import { useCallback, useState } from "react";
import { useTripDetailsBooking } from "@/components/trip-details/trip-details-booking-context";

export function TripDetailsRegistrationQr() {
  const { registrationQrDataUrl, registrationQrCaption, registrationFormUrl } = useTripDetailsBooking();
  const [copied, setCopied] = useState(false);

  const copyFormLink = useCallback(async () => {
    const url = registrationFormUrl?.trim();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be denied */
    }
  }, [registrationFormUrl]);

  if (!registrationQrDataUrl) return null;

  return (
    <div className="trd-reg-qr trd-reg-qr--sidebar text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={registrationQrDataUrl}
        alt="Бүртгэлийн холбоос (QR)"
        width={168}
        height={168}
        className="trd-reg-qr__img"
        loading="lazy"
        decoding="async"
      />
      {registrationFormUrl ? (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary mt-2 w-100"
          onClick={() => void copyFormLink()}
        >
          {copied ? "Хуулагдлаа" : "Холбоос хуулах"}
        </button>
      ) : null}
      {registrationQrCaption ? (
        <p className="trd-reg-qr__caption small text-muted mb-0 mt-2 text-center">{registrationQrCaption}</p>
      ) : null}
    </div>
  );
}
