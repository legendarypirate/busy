"use client";

import { useCallback, useMemo, useState } from "react";

export type QuestionRow = {
  name: string;
  label: string;
  type: string;
  required?: number;
  placeholder?: string;
  options?: string[];
};

const TYPES: [string, string][] = [
  ["text", "Text"],
  ["textarea", "Textarea"],
  ["email", "Email"],
  ["tel", "Phone"],
  ["number", "Number"],
  ["date", "Date"],
  ["select", "Select"],
  ["radio", "Radio"],
  ["checkbox", "Checkbox"],
];

function parseInitial(raw: unknown): QuestionRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
    .map((r) => ({
      name: String(r.name ?? ""),
      label: String(r.label ?? ""),
      type: String(r.type ?? "text"),
      required: Number(r.required ?? 0) ? 1 : 0,
      placeholder: String(r.placeholder ?? ""),
      options: Array.isArray(r.options) ? r.options.map((o) => String(o)) : [],
    }));
}

function serialize(rows: QuestionRow[]): string {
  const filtered = rows.filter((r) => String(r.label ?? "").trim() !== "");
  return JSON.stringify(filtered);
}

type Props = {
  hiddenName: string;
  initialJson?: unknown;
  listId: string;
  addBtnId: string;
};

export default function DynamicQuestionBuilder({ hiddenName, initialJson, listId, addBtnId }: Props) {
  const [rows, setRows] = useState<QuestionRow[]>(() => parseInitial(initialJson));

  const hiddenValue = useMemo(() => serialize(rows), [rows]);

  const updateRow = useCallback((i: number, patch: Partial<QuestionRow>) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }, []);

  const needsOptions = (t: string) => ["select", "radio", "checkbox"].includes(t);

  return (
    <>
      <input type="hidden" name={hiddenName} value={hiddenValue} readOnly aria-hidden />
      <div id={listId}>
        {rows.length === 0 ? (
          <div className="small text-muted">Одоогоор асуулт алга. &quot;Асуулт нэмэх&quot; дарна уу.</div>
        ) : (
          rows.map((r, i) => (
            <div key={i} className="border rounded p-2 mb-2">
              <div className="row g-2">
                <div className="col-md-4">
                  <input
                    className="pm-input bni-q-label"
                    placeholder="Асуултын текст"
                    value={r.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    className="pm-input bni-q-name"
                    placeholder="field_name"
                    value={r.name}
                    onChange={(e) => updateRow(i, { name: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="pm-select bni-q-type"
                    value={r.type}
                    onChange={(e) => updateRow(i, { type: e.target.value })}
                  >
                    {TYPES.map(([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input
                    className="pm-input bni-q-placeholder"
                    placeholder="placeholder"
                    value={r.placeholder}
                    onChange={(e) => updateRow(i, { placeholder: e.target.value })}
                  />
                </div>
                <div className="col-md-1 d-flex align-items-center justify-content-between gap-1">
                  <label className="small mb-0">
                    <input
                      type="checkbox"
                      checked={!!r.required}
                      onChange={(e) => updateRow(i, { required: e.target.checked ? 1 : 0 })}
                    />{" "}
                    *
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <i className="fa-solid fa-trash" aria-hidden />
                  </button>
                </div>
              </div>
              {needsOptions(r.type) ? (
                <div className="mt-2">
                  <textarea
                    className="pm-input bni-q-options"
                    rows={2}
                    placeholder="Сонголт бүрийг шинэ мөрөөр"
                    value={(r.options ?? []).join("\n")}
                    onChange={(e) =>
                      updateRow(i, {
                        options: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <div className="small text-muted">Select/Radio/Checkbox төрөлд сонголтууд.</div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary mt-2"
        id={addBtnId}
        onClick={() =>
          setRows((prev) => [
            ...prev,
            {
              name: `q_${prev.length + 1}`,
              label: "",
              type: "text",
              required: 0,
              placeholder: "",
              options: [],
            },
          ])
        }
      >
        <i className="fa-solid fa-plus me-1" />
        Асуулт нэмэх
      </button>
    </>
  );
}
