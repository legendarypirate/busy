"use client";

import { useTripDetailsBooking } from "@/components/trip-details/trip-details-booking-context";

export function TripDetailsRegistrationQr() {
  const { registrationQrDataUrl, registrationQrCaption } = useTripDetailsBooking();
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
      {registrationQrCaption ? (
        <p className="trd-reg-qr__caption small text-muted mb-0 mt-2 text-center">{registrationQrCaption}</p>
      ) : null}
    </div>
  );
}
