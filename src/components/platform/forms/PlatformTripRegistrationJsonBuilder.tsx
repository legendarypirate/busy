"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TripFormQuestionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function parseLegacyRows(raw: unknown): TripFormBuilderQuestionRow[] {
  let v: unknown = raw;
  if (typeof v === "string" && v.trim()) {
    try {
      v = JSON.parse(v.trim()) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) {
    return [];
  }
  return v
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
  const [savedQuestionId, setSavedQuestionId] = useState<string | null>(null);
  const [googleUrl, setGoogleUrl] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const hiddenValue = useMemo(() => serialize(rows), [rows]);

  useEffect(() => {
    if (!savedQuestionId) return;
    const t = window.setTimeout(() => {
      setSavedQuestionId((cur) => (cur === savedQuestionId ? null : cur));
    }, 3200);
    return () => window.clearTimeout(t);
  }, [savedQuestionId]);

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
    setSavedQuestionId(id);
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

  const rowsFromImportedLegacy = useCallback((legacy: unknown[]) => {
    const parsed = parseLegacyRows(legacy);
    return parsed.map((row) => {
      const nid = newQuestionId();
      return {
        ...row,
        id: nid,
        sortOrder: 0,
        options: row.options.map((o, j) => ({
          ...o,
          id: `opt-${nid}-${j}`,
          sortOrder: j,
        })),
      } satisfies TripFormBuilderQuestionRow;
    });
  }, []);

  const runGoogleImport = useCallback(
    async (mode: "append" | "replace") => {
      const url = googleUrl.trim();
      if (!url) {
        setImportMsg("Google Form-ын холбоосыг оруулна уу.");
        return;
      }
      if (mode === "replace" && rows.length > 0) {
        if (!window.confirm("Одоогийн бүх асуулгыг устгаж Google Form-ын асуулгаар солих уу?")) return;
      }
      setImportBusy(true);
      setImportMsg(null);
      try {
        const res = await fetch("/api/platform/google-form-import", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          legacy?: unknown[];
          importedCount?: number;
          formTitle?: string;
          message?: string;
          error?: string;
          shareWithEmail?: string;
        };
        if (!res.ok) {
          const hint =
            data.shareWithEmail && (data.error === "form_inaccessible" || res.status === 502)
              ? ` Хуваалцах имэйл: ${data.shareWithEmail}`
              : "";
          setImportMsg((data.message || data.error || "Алдаа") + hint);
          return;
        }
        const legacy = Array.isArray(data.legacy) ? data.legacy : [];
        const withIds = rowsFromImportedLegacy(legacy);
        if (withIds.length === 0) {
          setImportMsg("Оруулах асуулт олдсонгүй (зөвхөн дэмжигдсэн төрлүүд).");
          return;
        }
        if (mode === "replace") {
          setRows(withIds.map((r, i) => ({ ...r, sortOrder: i })));
        } else {
          setRows((prev) => {
            const qs = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
            const start = qs.length;
            return [...qs, ...withIds.map((r, i) => ({ ...r, sortOrder: start + i }))];
          });
        }
        const title = data.formTitle?.trim() ? ` «${data.formTitle}»` : "";
        setImportMsg(
          `Амжилттай орууллаа: ${data.importedCount ?? withIds.length} асуулт${title}. Аяллын «Хадгалах» дарж серверт илгээнэ үү.`,
        );
        setGoogleUrl("");
      } finally {
        setImportBusy(false);
      }
    },
    [googleUrl, rows.length, rowsFromImportedLegacy],
  );

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
              Асуултыг нэг нэгээр нэмэх эсвэл Google Form-оос оруулж болно. «Асуултыг хадгалах» нь энэ хуудасны төсөвт
              хадгална; нийтийн drawer болон /register холбоосын өгөгдөлд орохын тулд аяллын «Хадгалах» дарна уу.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 sm:p-4">
              <p className="text-xs font-semibold text-foreground">Google Form-оос импорт</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Холбоосыг буулгаад «Нэмж оруулах» эсвэл «Бүгдийг солих» дарна. Серверт OAuth:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GOOGLE_FORMS_OAUTH_REFRESH_TOKEN</code> +{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GOOGLE_FORMS_OAUTH_CLIENT_JSON</code> (эсвэл
                CLIENT_ID/SECRET) + ижил{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GOOGLE_FORMS_OAUTH_REDIRECT_URI</code> (ихэвчлэн
                http://localhost:3333/oauth2callback — GCP-д яг ижил бүртгэ).
                Refresh token: <code className="text-[10px]">node scripts/google-forms-oauth-refresh-token.cjs …json</code>.
                Формонд OAuth-оор нэвтэрсэн Google дансны хандах эрх шаардлагатай. Хуучин арга: service account{" "}
                <code className="text-[10px]">GOOGLE_FORMS_IMPORT_SA_JSON</code>.
              </p>
              <div className="mt-3 space-y-2">
                <Label htmlFor="google-form-url" className="text-xs">
                  Google Form холбоос
                </Label>
                <Input
                  id="google-form-url"
                  type="url"
                  autoComplete="off"
                  placeholder="https://docs.google.com/forms/d/..."
                  value={googleUrl}
                  disabled={importBusy}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  className="text-sm"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" variant="secondary" disabled={importBusy} onClick={() => void runGoogleImport("append")}>
                    Нэмж оруулах
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={importBusy} onClick={() => void runGoogleImport("replace")}>
                    Бүгдийг солих
                  </Button>
                </div>
                {importMsg ? (
                  <p className={`text-xs ${importMsg.includes("Амжилттай") ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
                    {importMsg}
                  </p>
                ) : null}
              </div>
            </div>
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
                    {savedQuestionId === q.id ? (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400/90">
                        Асуулт энэ хуудасны төсөвт хадгалагдлаа. Нийтийн drawer-д гаргахын тулд аяллын «Хадгалах» дарна уу.
                      </p>
                    ) : null}
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
