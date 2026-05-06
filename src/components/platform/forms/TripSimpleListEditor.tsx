"use client";

import { useState } from "react";

type TripSimpleListEditorProps = {
  label: string;
  name: string;
  initialItems: string[];
  placeholder?: string;
  addLabel?: string;
};

export default function TripSimpleListEditor({
  label,
  name,
  initialItems,
  placeholder = "",
  addLabel = "Мөр нэмэх",
}: TripSimpleListEditorProps) {
  const [items, setItems] = useState<string[]>(() => (initialItems.length > 0 ? initialItems : [""]));

  return (
    <div>
      <label className="pm-label">{label}</label>
      <div className="d-flex flex-column gap-2 mt-2">
        {items.map((item, idx) => (
          <div key={`${name}-${idx}`} className="d-flex gap-2">
            <input
              type="text"
              className="pm-input"
              name={name}
              placeholder={placeholder}
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[idx] = e.target.value;
                setItems(next);
              }}
            />
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => {
                if (items.length <= 1) {
                  setItems([""]);
                  return;
                }
                setItems(items.filter((_, j) => j !== idx));
              }}
              aria-label="remove-row"
            >
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary mt-2"
        onClick={() => setItems((prev) => [...prev, ""])}
      >
        <i className="fa-solid fa-plus me-1" />
        {addLabel}
      </button>
    </div>
  );
}
