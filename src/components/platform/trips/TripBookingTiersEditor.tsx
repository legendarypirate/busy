"use client";

import { useMemo, useState } from "react";
import type { TripExtrasBookingTier } from "@/components/platform/trips/trip-editor-helpers";

type Props = {
  hiddenName: string;
  initialTiers: TripExtrasBookingTier[];
};

function serialize(tiers: TripExtrasBookingTier[]): string {
  return JSON.stringify(
    tiers.map((t, idx) => ({
      id: t.id.trim() || `t_${idx}`,
      label: t.label.trim(),
      subtitle: t.subtitle.trim(),
      price_mnt: Math.max(0, Math.round(t.price_mnt)),
    })),
  );
}

export default function TripBookingTiersEditor({ hiddenName, initialTiers }: Props) {
  const [tiers, setTiers] = useState<TripExtrasBookingTier[]>(() =>
    initialTiers.length > 0 ? initialTiers.map((t) => ({ ...t })) : [],
  );

  const hiddenValue = useMemo(() => serialize(tiers), [tiers]);

  const updateRow = (index: number, patch: Partial<TripExtrasBookingTier>) => {
    setTiers((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setTiers((prev) => [
      ...prev,
      {
        id: `tier_${Date.now().toString(36)}`,
        label: "",
        subtitle: "",
        price_mnt: 0,
      },
    ]);
  };

  const removeRow = (index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="tps-booking-tiers">
      <input type="hidden" name={hiddenName} value={hiddenValue} readOnly />

      <p className="small text-muted mb-3">
        Нийтийн <strong>/trip-details/…</strong> хуудсын баруун талын «Захиалгын мэдээлэл» хэсэгт харагдана. Tier бүрт нэр,
        товч тайлбар (сонголттой), үнэ (₮) оруулна.
      </p>

      <div className="d-flex flex-column gap-2">
        {tiers.map((row, idx) => (
          <div
            key={row.id}
            className="border rounded-3 p-3 bg-white"
            style={{ borderColor: "#e2e8f0" }}
          >
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="pm-label small">Tier ID (техникийн)</label>
                <input
                  type="text"
                  className="pm-input"
                  value={row.id}
                  onChange={(e) => updateRow(idx, { id: e.target.value })}
                  placeholder="bni_member"
                />
              </div>
              <div className="col-md-4">
                <label className="pm-label small">
                  Нэр <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="pm-input"
                  value={row.label}
                  onChange={(e) => updateRow(idx, { label: e.target.value })}
                  placeholder="BNI гишүүн"
                />
              </div>
              <div className="col-md-3">
                <label className="pm-label small">
                  Үнэ (₮) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="pm-input"
                  min={0}
                  step={1}
                  value={Number.isFinite(row.price_mnt) ? row.price_mnt : 0}
                  onChange={(e) => updateRow(idx, { price_mnt: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                />
              </div>
              <div className="col-md-1 d-flex justify-content-end pb-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeRow(idx)}
                  aria-label="Устгах"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
              <div className="col-12">
                <label className="pm-label small">Товч тайлбар (сонголттой)</label>
                <input
                  type="text"
                  className="pm-input"
                  value={row.subtitle}
                  onChange={(e) => updateRow(idx, { subtitle: e.target.value })}
                  placeholder="Жишээ: BNI үнэ · бүх үйлчилгээ багтсан"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={addRow}>
        <i className="fa-solid fa-plus me-1" />
        Tier нэмэх
      </button>
    </div>
  );
}
