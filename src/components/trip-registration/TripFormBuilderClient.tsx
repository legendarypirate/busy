"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import TripFormQrCard from "@/components/trip-registration/TripFormQrCard";
import TripFormQuestionCardEditor, {
  needsOptions,
  questionSyncKey,
  type TripFormBuilderQuestionRow,
} from "@/components/trip-registration/TripFormQuestionCardEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type QuestionRow = TripFormBuilderQuestionRow;

type FormBundle = {
  id: string;
  tripId: number;
  title: string;
  description: string | null;
  publicSlug: string;
  isPublished: boolean;
  questions: TripFormBuilderQuestionRow[];
};

function optionsFromLines(text: string): { label: string; value: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => ({ label: line, value: line }));
}

export default function TripFormBuilderClient({
  tripId,
  formId,
  onBack,
}: {
  tripId: number;
  formId: string;
  onBack?: () => void;
}) {
  const [form, setForm] = useState<FormBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`/api/forms/${encodeURIComponent(formId)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { form?: FormBundle; error?: string };
    if (!res.ok) {
      setLoadError(data.error ?? "Ачаалахад алдаа");
      return;
    }
    if (data.form) setForm(data.form);
  }, [formId]);

  useEffect(() => {
    startTransition(() => {
      void reload();
    });
  }, [reload]);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined" || !form) return "";
    return `${window.location.origin}/register/${encodeURIComponent(form.publicSlug)}`;
  }, [form]);

  async function saveHeader() {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(formId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, description: form.description }),
      });
      if (!res.ok) throw new Error("save");
      setMsg("Хадгалагдлаа.");
      await reload();
    } catch {
      setMsg("Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(formId)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: true }),
      });
      if (!res.ok) throw new Error("pub");
      setMsg("Нийтлэгдлээ.");
      await reload();
    } catch {
      setMsg("Нийтлэхэд алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  async function unpublish() {
    if (!confirm("Нийтлэлийг ноорог болгох уу? Нийтийн холбоос түр хаагдана.")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(formId)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false }),
      });
      if (!res.ok) throw new Error("unpub");
      setMsg("Ноорог болголоо.");
      await reload();
    } catch {
      setMsg("Төлөв өөрчлөхөд алдаа.");
    } finally {
      setSaving(false);
    }
  }

  async function saveQuestion(qDraft: QuestionRow, optionsText: string) {
    setSaving(true);
    setMsg(null);
    try {
      const opts = needsOptions(qDraft.type) ? optionsFromLines(optionsText) : undefined;
      const res = await fetch(`/api/questions/${encodeURIComponent(qDraft.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: qDraft.label,
          description: qDraft.description,
          placeholder: qDraft.placeholder,
          isRequired: qDraft.isRequired,
          type: qDraft.type,
          ...(opts !== undefined ? { options: opts } : {}),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "bad");
      }
      setMsg("Асуулт хадгалагдлаа.");
      await reload();
    } catch {
      setMsg("Асуулт хадгалахад алдаа.");
    } finally {
      setSaving(false);
    }
  }

  async function removeQuestion(id: string) {
    if (!confirm("Устгах уу?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("del");
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function postReorder(orderedIds: string[]) {
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(formId)}/questions/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedQuestionIds: orderedIds }),
      });
      if (!res.ok) throw new Error("reorder");
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function reorderDrag(fromId: string, toId: string) {
    if (!form || fromId === toId) return;
    const qs = [...form.questions].sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIdx = qs.findIndex((x) => x.id === fromId);
    const toIdx = qs.findIndex((x) => x.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...qs];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    await postReorder(next.map((x) => x.id));
  }

  async function moveQuestion(index: number, dir: -1 | 1) {
    if (!form) return;
    const qs = [...form.questions].sort((a, b) => a.sortOrder - b.sortOrder);
    const j = index + dir;
    if (j < 0 || j >= qs.length) return;
    const swapped = [...qs];
    [swapped[index], swapped[j]] = [swapped[j], swapped[index]];
    await postReorder(swapped.map((x) => x.id));
  }

  async function addQuestion() {
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(formId)}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SHORT_TEXT",
          label: "Шинэ асуулт",
          isRequired: false,
        }),
      });
      if (!res.ok) throw new Error("add");
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function duplicateQuestion(q: QuestionRow) {
    setSaving(true);
    try {
      const optPayload =
        needsOptions(q.type) && q.options.length > 0
          ? q.options.map((o) => ({ label: o.label, value: o.value }))
          : needsOptions(q.type)
            ? [
                { label: "Сонголт 1", value: "opt1" },
                { label: "Сонголт 2", value: "opt2" },
              ]
            : undefined;
      const res = await fetch(`/api/forms/${encodeURIComponent(formId)}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: q.type,
          label: `${q.label} (хуулбар)`,
          description: q.description,
          placeholder: q.placeholder,
          isRequired: q.isRequired,
          ...(optPayload ? { options: optPayload } : {}),
        }),
      });
      if (!res.ok) throw new Error("dup");
      await reload();
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="pt-6 text-sm text-destructive">
          {loadError}
          {onBack ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={onBack}>
              ← Буцах
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!form) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted-foreground">
          <span
            className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          Ачаалж байна…
        </CardContent>
      </Card>
    );
  }

  const sortedQs = [...form.questions].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="rounded-xl bg-muted/50 p-0.5 sm:p-0">
      <Card className="gap-0 overflow-hidden border-0 py-0 shadow-md">
        <CardHeader className="border-b bg-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              {onBack ? (
                <Button variant="ghost" size="sm" className="h-8 -translate-x-2 px-2 text-xs" onClick={onBack}>
                  ← Бүх формууд
                </Button>
              ) : null}
              <div className="flex flex-wrap items-baseline gap-2">
                <Badge variant="outline" className="font-bold tracking-wide text-primary">
                  BUSY.mn
                </Badge>
                <CardTitle className="text-base font-semibold">Формын асуулт</CardTitle>
              </div>
              <CardDescription className="text-xs leading-snug xl:max-w-[48rem]">
                Асуулт, заавал талбар, дарааллыг энд тохируулна. Нийтлэснээр нийтийн холбоос болон QR идэвхжинэ.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 xl:max-w-[52%] xl:justify-end">
              <Button asChild variant="outline" size="sm">
                <a href={`/dashboard/trips/${tripId}/responses?formId=${encodeURIComponent(formId)}`}>Хариултууд</a>
              </Button>
              {form.isPublished && publicUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    Урьдчилж харах
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled className="pointer-events-none opacity-50">
                  Урьдчилж харах
                </Button>
              )}
              <Button variant="outline" size="sm" disabled={saving} onClick={() => void saveHeader()}>
                Ноорог хадгалах
              </Button>
              <Button size="sm" disabled={saving || form.isPublished} onClick={() => void publish()}>
                Нийтлэх
              </Button>
              {form.isPublished ? (
                <Button variant="outline" size="sm" disabled={saving} onClick={() => void unpublish()}>
                  Ноорог болгох
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <a href={`/api/forms/${encodeURIComponent(formId)}/responses/export`}>Excel татах</a>
              </Button>
              <Badge
                variant={form.isPublished ? "default" : "secondary"}
                className={form.isPublished ? "bg-emerald-600 text-white hover:bg-emerald-600/90" : ""}
              >
                {form.isPublished ? "Нийтлэгдсэн" : "Ноорог"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_min(248px,26vw)] sm:p-5 xl:grid-cols-[1fr_272px]">
          <div className="min-w-0 space-y-3">
            <Card className="border-l-4 border-l-primary py-4 shadow-sm">
              <CardContent className="space-y-3 px-4 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Формын гарчиг ба тайлбар</p>
                <div className="space-y-2">
                  <Label htmlFor="form-title">Гарчиг</Label>
                  <Input
                    id="form-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-desc">Тайлбар</Label>
                  <Textarea
                    id="form-desc"
                    rows={3}
                    className="min-h-[72px] resize-y"
                    value={form.description ?? ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                  />
                </div>
              </CardContent>
            </Card>

            {msg ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">{msg}</div>
            ) : null}

            <div className="space-y-3">
              {sortedQs.map((q, index) => (
                <div
                  key={q.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = e.dataTransfer.getData("text/plain");
                    void reorderDrag(from, q.id);
                  }}
                >
                  <TripFormQuestionCardEditor
                    key={questionSyncKey(q)}
                    q={q}
                    index={index}
                    total={sortedQs.length}
                    onSave={(draft, text) => void saveQuestion(draft, text)}
                    onDelete={() => void removeQuestion(q.id)}
                    onMove={(dir) => void moveQuestion(index, dir)}
                    onDuplicate={() => void duplicateQuestion(q)}
                    disabled={saving}
                    dragQuestionId={q.id}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={saving}
              className="w-full border-dashed"
              onClick={() => void addQuestion()}
            >
              + Асуулт нэмэх
            </Button>
          </div>

          <aside className="min-w-0 space-y-3 lg:sticky lg:top-3">
            <TripFormQrCard
              formId={formId}
              publicSlug={form.publicSlug}
              publicUrl={publicUrl}
              isPublished={form.isPublished}
              compact
            />
            <Card className="py-4 shadow-sm">
              <CardContent className="space-y-2 px-4 text-[11px] leading-relaxed text-muted-foreground sm:px-5">
                <p className="font-semibold text-foreground">Зөвлөмж</p>
                <ul className="list-inside list-disc space-y-0.5">
                  <li>Асуултыг чирж байрлалыг өөрчилнө үү (эсвэл дээш/доош).</li>
                  <li>Олон сонголт, жагсаалтанд сонголтуудыг мөр бүрт нэг бичнэ.</li>
                  <li>Нийтлэхээс өмнө заавал &quot;Урьдчилж харах&quot;-аар шалгана уу.</li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </CardContent>
      </Card>
    </div>
  );
}
