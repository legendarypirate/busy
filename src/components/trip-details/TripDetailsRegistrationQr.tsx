"use client";

import { useTripDetailsBooking } from "@/components/trip-details/trip-details-booking-context";

type Props = { variant: "hero" | "sidebar" };

export function TripDetailsRegistrationQr({ variant }: Props) {
  const { registrationQrDataUrl, registrationQrCaption } = useTripDetailsBooking();
  if (!registrationQrDataUrl) return null;

  const wrapClass =
    variant === "hero"
      ? "trd-reg-qr trd-reg-qr--hero d-flex flex-column align-items-center align-items-lg-start"
      : "trd-reg-qr trd-reg-qr--sidebar text-center";

  return (
    <div className={wrapClass}>
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
        <p
          className={`trd-reg-qr__caption small mb-0 mt-2 ${
            variant === "hero" ? "text-white opacity-75 text-center text-lg-start" : "text-muted text-center"
          }`}
        >
          {registrationQrCaption}
        </p>
      ) : null}
    </div>
  );
}
