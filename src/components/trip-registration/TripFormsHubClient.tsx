"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import TripFormBuilderClient from "@/components/trip-registration/TripFormBuilderClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FormListItem = {
  id: string;
  title: string;
  publicSlug: string;
  isPublished: boolean;
  updatedAt: string;
  responseCount: number;
  questionCount: number;
};

export default function TripFormsHubClient({ tripId }: { tripId: number }) {
  const [forms, setForms] = useState<FormListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/trips/${tripId}/forms`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { forms?: FormListItem[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Ачаалахад алдаа");
      return;
    }
    setForms(data.forms ?? []);
  }, [tripId]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  async function createForm() {
    setCreating(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Бүртгэлийн форм" }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; formId?: string; error?: string };
      if (!res.ok || !data.formId) {
        setError(data.error ?? "Үүсгэхэд алдаа");
        return;
      }
      setActiveFormId(data.formId);
      await load();
    } finally {
      setCreating(false);
    }
  }

  if (activeFormId) {
    return <TripFormBuilderClient tripId={tripId} formId={activeFormId} onBack={() => setActiveFormId(null)} />;
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!forms) {
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

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Badge variant="outline" className="mb-1 font-bold tracking-wide text-primary">
            BUSY.mn
          </Badge>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Бүртгэлийн форм</h2>
          <p className="text-xs text-muted-foreground">Нэг аялалд олон форм үүсгэж болно.</p>
        </div>
        <Button disabled={creating} onClick={() => void createForm()}>
          {creating ? "Үүсгэж байна…" : "Бүртгэлийн форм үүсгэх"}
        </Button>
      </div>

      {forms.length === 0 ? (
        <p className="text-sm text-muted-foreground">Одоогоор форм байхгүй. Дээрх товчоор үндсэн асуултуудтай форм үүсгэнэ үү.</p>
      ) : (
        <ul className="space-y-2">
          {forms.map((f) => (
            <li key={f.id}>
              <Card className="overflow-hidden border-l-4 border-l-primary py-0 shadow-sm transition-colors hover:bg-muted/30">
                <CardContent className="p-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
                    onClick={() => setActiveFormId(f.id)}
                  >
                    <span>
                      <span className="font-medium text-foreground">{f.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {f.questionCount} асуулт · {f.responseCount} хариулт
                      </span>
                    </span>
                    <Badge variant={f.isPublished ? "default" : "secondary"} className="shrink-0">
                      {f.isPublished ? "Нийтлэгдсэн" : "Ноорог"}
                    </Badge>
                  </button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
