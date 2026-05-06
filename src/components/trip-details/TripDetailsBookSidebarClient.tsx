"use client";

import type { ReactNode } from "react";
import { useTripDetailsBooking } from "@/components/trip-details/trip-details-booking-context";
import type { TripCheckoutTier } from "@/components/trip-details/trip-checkout-tier";

export type { TripCheckoutTier };

type Props = {
  defaultDepartureIso: string;
  tiers: TripCheckoutTier[];
  maxPassengers: number;
  capacityNote: string;
  /** After «Захиалгын мэдээлэл»: price row, summary grid, CTAs (`TripDetailsSidebarRegisterCtas`), trust chips. */
  children: ReactNode;
};

function formatMnt(n: number): string {
  return n.toLocaleString("mn-MN", { maximumFractionDigits: 0 });
}

/** `YYYY-MM-DD` → `YYYY.MM.DD` (locale-agnostic; avoids Node vs browser ICU hydration mismatch). */
function departureIsoToDisplay(iso: string): string {
  const t = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const [y, mo, da] = t.split("-");
  return `${y}.${mo}.${da}`;
}

/**
 * Book panel + tier selector; checkout state lives in `TripDetailsBookingRegisterProvider`.
 */
export function TripDetailsBookSidebarClient({
  defaultDepartureIso: _defaultDepartureIso,
  tiers,
  maxPassengers,
  capacityNote,
  children,
}: Props) {
  const { departure, counts, bump, clearTier, totalPax, checkoutTotalMnt } = useTripDetailsBooking();
  const departureDisplay = departureIsoToDisplay(departure);

  const checkoutSub =
    totalPax === 0 ? "Түвшин сонгоно уу · урьдчилгаа төлбөр" : `${totalPax} хүн · урьдчилгаа төлбөр`;

  if (tiers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="trd-bi-card trd-aside-card">
        <h3 className="trd-bi-title">Захиалгын мэдээлэл</h3>

        <div className="trd-bi-date-row trd-bi-date-row--static" role="group" aria-label="Эхлэх огноо">
          <span className="trd-bi-date-icon" aria-hidden="true">
            <i className="fa-regular fa-calendar" />
          </span>
          <div className="trd-bi-date-static">
            <span className="trd-bi-date-static__label">Эхлэх огноо</span>
            <span className="trd-bi-date-value">{departureDisplay}</span>
          </div>
        </div>

        {capacityNote ? <p className="trd-bi-capacity">{capacityNote}</p> : null}

        <ul className="trd-bi-tier-list list-unstyled mb-0">
          {tiers.map((tier) => (
            <li key={tier.id} className="trd-bi-tier">
              <button
                type="button"
                className="trd-bi-trash"
                aria-label={`${tier.label} — тоог цэвэрлэх`}
                onClick={() => clearTier(tier.id)}
                disabled={(counts[tier.id] ?? 0) === 0}
              >
                <i className="fa-solid fa-trash" aria-hidden="true" />
              </button>
              <div className="trd-bi-tier-main">
                <div className="trd-bi-tier-label">{tier.label}</div>
                <div className="trd-bi-tier-meta">
                  {tier.subtitle ? (
                    <>
                      {tier.subtitle}
                      <span className="trd-bi-tier-dot"> · </span>
                    </>
                  ) : null}
                  ₮ {formatMnt(tier.priceMnt)}
                </div>
              </div>
              <div className="trd-bi-qty">
                <button
                  type="button"
                  className="trd-bi-qty-btn"
                  aria-label={`${tier.label} хасах`}
                  onClick={() => bump(tier.id, -1)}
                  disabled={(counts[tier.id] ?? 0) <= 0}
                >
                  <i className="fa-solid fa-minus" aria-hidden="true" />
                </button>
                <span className="trd-bi-qty-val" aria-live="polite">
                  {counts[tier.id] ?? 0}
                </span>
                <button
                  type="button"
                  className="trd-bi-qty-btn"
                  aria-label={`${tier.label} нэмэх`}
                  onClick={() => bump(tier.id, 1)}
                  disabled={totalPax >= maxPassengers}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="trd-book-panel">
        <div className="trd-price-row">
          <div className="trd-price-tag">
            {formatMnt(checkoutTotalMnt)} <span className="trd-price-cur">₮</span>
          </div>
          <div className="trd-price-sub">{checkoutSub}</div>
        </div>
        {children}
      </div>
    </>
  );
}
