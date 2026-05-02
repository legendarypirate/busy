"use client";

import { useEffect, useState, startTransition } from "react";
import type { TripFormQuestionType } from "@prisma/client";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MVP_TRIP_FORM_QUESTION_TYPES, TRIP_FORM_QUESTION_LABELS_MN } from "@/lib/trip-registration-form/types";

export type TripFormBuilderOption = { id: string; label: string; value: string; sortOrder: number };

export type TripFormBuilderQuestionRow = {
  id: string;
  label: string;
  description: string | null;
  type: TripFormQuestionType;
  placeholder: string | null;
  isRequired: boolean;
  sortOrder: number;
  options: TripFormBuilderOption[];
};

export function needsOptions(t: TripFormQuestionType) {
  return t === "MULTIPLE_CHOICE" || t === "CHECKBOXES" || t === "DROPDOWN";
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export default function TripFormQuestionCardEditor({
  q,
  index,
  total,
  onSave,
  onDelete,
  onMove,
  onDuplicate,
  disabled,
  dragQuestionId,
}: {
  q: TripFormBuilderQuestionRow;
  index: number;
  total: number;
  onSave: (draft: TripFormBuilderQuestionRow, optionsText: string) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  disabled: boolean;
  dragQuestionId: string;
}) {
  const [draft, setDraft] = useState(q);
  const [optionsText, setOptionsText] = useState(() => q.options.map((o) => o.label).join("\n"));

  useEffect(() => {
    startTransition(() => {
      setDraft(q);
      setOptionsText(q.options.map((o) => o.label).join("\n"));
    });
  }, [q]);

  return (
    <Card className="border-l-4 border-l-primary py-4 shadow-sm">
      <CardContent className="space-y-3 px-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-8 shrink-0 cursor-grab touch-none active:cursor-grabbing"
            draggable={!disabled}
            title="Чирж дараалал өөрчлөх"
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", dragQuestionId);
              e.dataTransfer.effectAllowed = "move";
            }}
            disabled={disabled}
            aria-label="Чирэх бариул"
          >
            <GripVertical className="size-4 text-muted-foreground" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Асуулт {index + 1}</p>
            <p className="text-[10px] text-muted-foreground">Бариул дээр дарж чирнэ үү</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button type="button" variant="outline" size="xs" disabled={disabled || index === 0} onClick={() => onMove(-1)}>
              Дээш
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={disabled || index >= total - 1}
              onClick={() => onMove(1)}
            >
              Доош
            </Button>
            <Button type="button" variant="outline" size="xs" disabled={disabled} onClick={onDuplicate}>
              Хуулах
            </Button>
            <Button type="button" variant="destructive" size="xs" disabled={disabled} onClick={onDelete}>
              Устгах
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Асуултын төрөл</Label>
          <select
            className={cn(selectClass, "mt-0")}
            value={draft.type}
            disabled={disabled}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as TripFormQuestionType })}
          >
            {MVP_TRIP_FORM_QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRIP_FORM_QUESTION_LABELS_MN[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`ql-${q.id}`}>Асуултын гарчиг</Label>
          <Input id={`ql-${q.id}`} value={draft.label} disabled={disabled} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`qd-${q.id}`}>Тайлбар (сонголттой)</Label>
          <Input
            id={`qd-${q.id}`}
            value={draft.description ?? ""}
            disabled={disabled}
            onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`qp-${q.id}`}>Placeholder</Label>
          <Input
            id={`qp-${q.id}`}
            value={draft.placeholder ?? ""}
            disabled={disabled}
            onChange={(e) => setDraft({ ...draft, placeholder: e.target.value || null })}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
          <div>
            <p className="text-xs font-semibold text-foreground">Заавал бөглөх</p>
            <p className="text-[10px] text-muted-foreground">Заавал талбар</p>
          </div>
          <Switch
            checked={draft.isRequired}
            disabled={disabled}
            onCheckedChange={(v) => setDraft({ ...draft, isRequired: v })}
            aria-label="Заавал бөглөх"
          />
        </div>

        {needsOptions(draft.type) ? (
          <div className="space-y-2">
            <Label htmlFor={`qo-${q.id}`}>Сонголтууд (мөр бүрт нэг)</Label>
            <Textarea
              id={`qo-${q.id}`}
              className="min-h-[88px] font-mono text-xs"
              value={optionsText}
              disabled={disabled}
              onChange={(e) => setOptionsText(e.target.value)}
            />
          </div>
        ) : null}

        <Button type="button" size="sm" disabled={disabled} className="w-full sm:w-auto" onClick={() => onSave(draft, optionsText)}>
          Асуултыг хадгалах
        </Button>
      </CardContent>
    </Card>
  );
}
