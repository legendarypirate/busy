"use client";

import { useCallback, useMemo, useState } from "react";
import type { TripFormQuestionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TripFormQuestionCardEditor, {
  needsOptions,
  type TripFormBuilderOption,
  type TripFormBuilderQuestionRow,
} from "@/components/trip-registration/TripFormQuestionCardEditor";

type LegacyQuestion = {
  name: string;
  label: string;
  type: string;
  required?: number;
  placeholder?: string;
  options?: string[];
};

function newQuestionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function optionsFromLines(text: string): { label: string; value: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => ({ label: line, value: line }));
}

function legacyTypeToTrip(t: string): TripFormQuestionType {
  switch (t) {
    case "textarea":
      return "LONG_TEXT";
    case "email":
      return "EMAIL";
    case "tel":
      return "PHONE";
    case "number":
      return "NUMBER";
    case "date":
      return "DATE";
    case "select":
      return "DROPDOWN";
    case "radio":
      return "MULTIPLE_CHOICE";
    case "checkbox":
      return "CHECKBOXES";
    default:
      return "SHORT_TEXT";
  }
}

function tripTypeToLegacy(t: TripFormQuestionType): string {
  switch (t) {
    case "LONG_TEXT":
      return "textarea";
    case "EMAIL":
      return "email";
    case "PHONE":
      return "tel";
    case "NUMBER":
      return "number";
    case "DATE":
      return "date";
    case "DROPDOWN":
      return "select";
    case "MULTIPLE_CHOICE":
      return "radio";
    case "CHECKBOXES":
      return "checkbox";
    default:
      return "text";
  }
}

function legacyNeedsOptions(t: string) {
  return t === "select" || t === "radio" || t === "checkbox";
}

function parseLegacyRows(raw: unknown): TripFormBuilderQuestionRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
    .map((r, index) => {
      const name = String(r.name ?? "").trim() || newQuestionId();
      const label = String(r.label ?? "");
      const typeStr = String(r.type ?? "text");
      const tripType = legacyTypeToTrip(typeStr);
      const optLines = Array.isArray(r.options) ? r.options.map((o) => String(o)) : [];
      const options: TripFormBuilderOption[] =
        legacyNeedsOptions(typeStr) || needsOptions(tripType)
          ? optLines.map((line, i) => ({
              id: `opt-${index}-${i}`,
              label: line,
              value: line,
              sortOrder: i,
            }))
          : [];
      return {
        id: name,
        label,
        description: null,
        type: tripType,
        placeholder: String(r.placeholder ?? "") || null,
        isRequired: Number(r.required ?? 0) ? true : false,
        sortOrder: index,
        options,
      };
    });
}

function rowToLegacy(r: TripFormBuilderQuestionRow): LegacyQuestion {
  const legacyType = tripTypeToLegacy(r.type);
  const base: LegacyQuestion = {
    name: r.id,
    label: r.label,
    type: legacyType,
    required: r.isRequired ? 1 : 0,
    placeholder: r.placeholder ?? "",
  };
  if (needsOptions(r.type)) {
    base.options = r.options.map((o) => o.label);
  }
  return base;
}

function serialize(rows: TripFormBuilderQuestionRow[]): string {
  const filtered = rows.filter((r) => String(r.label ?? "").trim() !== "");
  return JSON.stringify(filtered.map(rowToLegacy));
}

type Props = {
  hiddenName: string;
  initialJson?: unknown;
};

export default function PlatformTripRegistrationJsonBuilder({ hiddenName, initialJson }: Props) {
  const [rows, setRows] = useState<TripFormBuilderQuestionRow[]>(() => parseLegacyRows(initialJson));

  const hiddenValue = useMemo(() => serialize(rows), [rows]);

  const applyQuestionSave = useCallback((id: string, draft: TripFormBuilderQuestionRow, optionsText: string) => {
    const opts = needsOptions(draft.type) ? optionsFromLines(optionsText) : [];
    const options: TripFormBuilderOption[] = opts.map((o, i) => ({
      id: `opt-${id}-${i}`,
      label: o.label,
      value: o.value,
      sortOrder: i,
    }));
    setRows((prev) =>
      prev.map((x) => (x.id === id ? { ...draft, options, sortOrder: x.sortOrder } : x)),
    );
  }, []);

  const reorderDrag = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setRows((prev) => {
      const qs = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const fromIdx = qs.findIndex((x) => x.id === fromId);
      const toIdx = qs.findIndex((x) => x.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...qs];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next.map((x, i) => ({ ...x, sortOrder: i }));
    });
  }, []);

  const moveQuestion = useCallback((index: number, dir: -1 | 1) => {
    setRows((prev) => {
      const qs = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const j = index + dir;
      if (j < 0 || j >= qs.length) return prev;
      const swapped = [...qs];
      [swapped[index], swapped[j]] = [swapped[j], swapped[index]];
      return swapped.map((x, i) => ({ ...x, sortOrder: i }));
    });
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setRows((prev) => prev.filter((x) => x.id !== id).map((x, i) => ({ ...x, sortOrder: i })));
  }, []);

  const duplicateQuestion = useCallback((q: TripFormBuilderQuestionRow) => {
    setRows((prev) => {
      const qs = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const nid = newQuestionId();
      const copy: TripFormBuilderQuestionRow = {
        ...q,
        id: nid,
        label: `${q.label} (хуулбар)`,
        sortOrder: qs.length,
        options: q.options.map((o, i) => ({
          ...o,
          id: `opt-${nid}-${i}`,
          sortOrder: i,
        })),
      };
      return [...qs, copy].map((x, i) => ({ ...x, sortOrder: i }));
    });
  }, []);

  const addQuestion = useCallback(() => {
    const id = newQuestionId();
    setRows((prev) => {
      const qs = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const next: TripFormBuilderQuestionRow = {
        id,
        label: "Шинэ асуулт",
        description: null,
        type: "SHORT_TEXT",
        placeholder: null,
        isRequired: false,
        sortOrder: qs.length,
        options: [],
      };
      return [...qs, next];
    });
  }, []);

  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <input type="hidden" name={hiddenName} value={hiddenValue} readOnly aria-hidden />
      <div className="rounded-xl bg-muted/50 p-0.5 sm:p-0">
        <Card className="gap-0 overflow-hidden border-0 py-0 shadow-md">
          <CardHeader className="border-b bg-card px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-baseline gap-2">
              <CardTitle className="text-base font-semibold">Бүртгэлийн асуулга</CardTitle>
            </div>
            <CardDescription className="text-xs leading-snug">
              Dashboard-ын форм бүтэцтэй ижил загвар. Сонголттой төрөлд сонголтуудыг мөр бүрт нэг бичнэ. Аяллыг
              хадгалахад асуулгууд JSON хэлбэрээр хадгалагдана.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-5">
            {sorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Одоогоор асуулт алга. &quot;+ Асуулт нэмэх&quot; дарна уу.</p>
            ) : (
              <div className="space-y-3">
                {sorted.map((q, index) => (
                  <div
                    key={q.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = e.dataTransfer.getData("text/plain");
                      reorderDrag(from, q.id);
                    }}
                  >
                    <TripFormQuestionCardEditor
                      q={q}
                      index={index}
                      total={sorted.length}
                      onSave={(draft, text) => applyQuestionSave(q.id, draft, text)}
                      onDelete={() => removeQuestion(q.id)}
                      onMove={(dir) => moveQuestion(index, dir)}
                      onDuplicate={() => duplicateQuestion(q)}
                      disabled={false}
                      dragQuestionId={q.id}
                    />
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="outline" className="w-full border-dashed" onClick={addQuestion}>
              + Асуулт нэмэх
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
