"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type TripFaqEditorProps = {
  initialItems: FaqItem[];
};

export default function TripFaqEditor({ initialItems }: TripFaqEditorProps) {
  const [items, setItems] = useState<FaqItem[]>(() =>
    initialItems.length > 0 ? initialItems : [{ question: "", answer: "" }],
  );

  return (
    <div className="d-flex flex-column gap-3">
      {items.map((item, idx) => (
        <div key={`trip-faq-${idx}`} className="border rounded p-3 bg-white">
          <div className="mb-2">
            <label className="pm-label">Асуулт</label>
            <input
              type="text"
              className="pm-input"
              name="trip_faq_question[]"
              value={item.question}
              placeholder="Жишээ: Цуцлалтын нөхцөл ямар вэ?"
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], question: e.target.value };
                setItems(next);
              }}
            />
          </div>
          <div className="mb-2">
            <label className="pm-label">Хариулт</label>
            <textarea
              className="pm-input"
              name="trip_faq_answer[]"
              rows={3}
              value={item.answer}
              placeholder="Хариултаа оруулна уу..."
              onChange={(e) => {
                const next = [...items];
                next[idx] = { ...next[idx], answer: e.target.value };
                setItems(next);
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              if (items.length <= 1) {
                setItems([{ question: "", answer: "" }]);
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
          onClick={() => setItems((prev) => [...prev, { question: "", answer: "" }])}
        >
          <i className="fa-solid fa-plus me-1" />
          FAQ нэмэх
        </button>
      </div>
    </div>
  );
}
