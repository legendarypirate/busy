"use client";

import { useState } from "react";

type PaymentStepItem = {
  title: string;
  note: string;
};

type TripPaymentStepsEditorProps = {
  initialItems: PaymentStepItem[];
};

export default function TripPaymentStepsEditor({ initialItems }: TripPaymentStepsEditorProps) {
  const [items, setItems] = useState<PaymentStepItem[]>(() =>
    initialItems.length > 0 ? initialItems : [{ title: "", note: "" }],
  );

  return (
    <div className="d-flex flex-column gap-3">
      {items.map((item, idx) => (
        <div key={`trip-payment-step-${idx}`} className="border rounded p-3 bg-white">
          <div className="mb-2">
            <label className="pm-label">Алхамын гарчиг</label>
            <input
              type="text"
              className="pm-input"
              name="trip_payment_step_title[]"
              value={item.title}
              placeholder="Жишээ: Урьдчилгаа төлбөр"
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], title: e.target.value };
                setItems(next);
              }}
            />
          </div>
          <div className="mb-2">
            <label className="pm-label">Тайлбар / Хугацаа</label>
            <input
              type="text"
              className="pm-input"
              name="trip_payment_step_note[]"
              value={item.note}
              placeholder="Жишээ: Бүртгүүлсний дараа 24 цагийн дотор"
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], note: e.target.value };
                setItems(next);
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              if (items.length <= 1) {
                setItems([{ title: "", note: "" }]);
                return;
              }
              setItems(items.filter((_, j) => j !== idx));
            }}
          >
            <i className="fa-solid fa-trash me-1" />
            Устгах
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setItems((prev) => [...prev, { title: "", note: "" }])}
        >
          <i className="fa-solid fa-plus me-1" />
          Алхам нэмэх
        </button>
      </div>
    </div>
  );
}
