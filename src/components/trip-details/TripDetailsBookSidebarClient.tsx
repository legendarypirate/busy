"use client";

import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";

export type TripCheckoutTier = {
  id: string;
  label: string;
  subtitle: string;
  priceMnt: number;
};

type Props = {
  defaultDepartureIso: string;
  tiers: TripCheckoutTier[];
  maxPassengers: number;
  capacityNote: string;
  /** Summary grid, CTAs, trust chips (server-rendered markup). */
  children: ReactNode;
};

function formatMnt(n: number): string {
  return n.toLocaleString("mn-MN", { maximumFractionDigits: 0 });
}

function emptyCounts(tiers: TripCheckoutTier[]): Record<string, number> {
  return tiers.reduce(
    (acc, t) => {
      acc[t.id] = 0;
      return acc;
    },
    {} as Record<string, number>,
  );
}

/**
 * Book panel + tier selector share one checkout state: headline price = Σ (qty × tier price).
 */
export function TripDetailsBookSidebarClient({
  defaultDepartureIso,
  tiers,
  maxPassengers,
  capacityNote,
  children,
}: Props) {
  const formId = useId();
  const [departure, setDeparture] = useState(defaultDepartureIso);
  const [counts, setCounts] = useState<Record<string, number>>(() => emptyCounts(tiers));

  const totalPax = useMemo(() => tiers.reduce((s, t) => s + (counts[t.id] ?? 0), 0), [counts, tiers]);

  const checkoutTotalMnt = useMemo(
    () => tiers.reduce((s, t) => s + (counts[t.id] ?? 0) * t.priceMnt, 0),
    [counts, tiers],
  );

  const setTier = (id: string, next: number) => {
    const clamped = Math.max(0, next);
    const other = tiers.filter((t) => t.id !== id).reduce((s, t) => s + (counts[t.id] ?? 0), 0);
    const capForThis = Math.max(0, maxPassengers - other);
    setCounts((prev) => ({ ...prev, [id]: Math.min(clamped, capForThis) }));
  };

  const bump = (id: string, delta: number) => {
    setTier(id, (counts[id] ?? 0) + delta);
  };

  const clearTier = (id: string) => {
    setCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  const checkoutSub =
    totalPax === 0
      ? "Түвшин сонгоно уу · нийт төлбөр"
      : `${totalPax} хүн · нийт төлбөр`;

  if (tiers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="trd-book-panel">
        <div className="trd-price-row">
          <div className="trd-price-tag">
            {formatMnt(checkoutTotalMnt)} <span className="trd-price-cur">₮</span>
          </div>
          <div className="trd-price-sub">{checkoutSub}</div>
        </div>
        {children}
      </div>

      <div className="trd-bi-card trd-aside-card">
        <h3 className="trd-bi-title">Захиалгын мэдээлэл</h3>

        <div className="trd-bi-date-row">
          <label htmlFor={`${formId}-dep`} className="visually-hidden">
            Эхлэх огноо
          </label>
          <span className="trd-bi-date-icon" aria-hidden="true">
            <i className="fa-regular fa-calendar" />
          </span>
          <input
            id={`${formId}-dep`}
            type="date"
            className="trd-bi-date-input"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
          <span className="trd-bi-date-chev" aria-hidden="true">
            <i className="fa-solid fa-chevron-down" />
          </span>
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
    </>
  );
}
