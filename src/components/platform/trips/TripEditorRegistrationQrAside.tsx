"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import TripFormQrCard from "@/components/trip-registration/TripFormQrCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TripMeta = {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  statusLabel: string | null;
};

type FormMeta = {
  id: string;
  publicSlug: string;
  isPublished: boolean;
  title: string;
};

async function readJson<T>(res: Response): Promise<T> {
  const j = (await res.json().catch(() => ({}))) as T;
  return j;
}

export default function TripEditorRegistrationQrAside({ tripId }: { tripId: number }) {
  const [trip, setTrip] = useState<TripMeta | null>(null);
  const [form, setForm] = useState<FormMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(tripId > 0);
  const [publishing, setPublishing] = useState(false);
  const [pubMsg, setPubMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (tripId < 1) {
      setTrip(null);
      setForm(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setPubMsg(null);
    try {
      const res = await fetch(`/api/platform/trips/${tripId}/registration-form-meta`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await readJson<{ trip?: TripMeta; form?: FormMeta | null; error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error === "forbidden" ? "Эрх хүрэлцэхгүй байна." : "Ачаалахад алдаа.");
      }
      if (data.trip) setTrip(data.trip);
      setForm(data.form ?? null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Алдаа");
      setTrip(null);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const publicUrl = useMemo(() => {
    if (!form?.publicSlug || typeof window === "undefined") return "";
    return `${window.location.origin}/register/${encodeURIComponent(form.publicSlug)}`;
  }, [form?.publicSlug]);

  async function setPublished(next: boolean) {
    if (!form) return;
    if (!next && !window.confirm("Нийтлэлийг ноорог болгох уу? Нийтийн холбоос түр хаагдана.")) return;
    setPublishing(true);
    setPubMsg(null);
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(form.id)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: next }),
      });
      const data = await readJson<{ ok?: boolean; error?: string }>(res);
      if (!res.ok || !data.ok) throw new Error("failed");
      setPubMsg(next ? "Нийтлэгдлээ." : "Ноорог болголоо.");
      await load();
    } catch {
      setPubMsg("Төлөв өөрчлөхөд алдаа.");
    } finally {
      setPublishing(false);
    }
  }

  if (tripId < 1) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Нийтийн бүртгэл + QR</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Шинэ аяллыг эхлээд хадгалаад дараа нь энд QR, нийтийн холбоос, &quot;Урьдчилж харах&quot; (тусад
            `/register/...` хуудас) гарна. Энэ нь нүүрний drawer-оос тусдаа бүртгэлийн хуудас юм.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <span
            className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          Ачаалж байна…
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 shadow-sm">
        <CardContent className="py-4 text-sm text-destructive">{loadError}</CardContent>
        <CardContent className="pt-0">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Дахин оролдох
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {trip ? (
        <Card className="border-l-4 border-l-primary py-3 shadow-sm">
          <CardHeader className="space-y-1 px-4 pb-2 pt-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Аялал</CardTitle>
            <p className="text-sm font-semibold leading-snug text-foreground">{trip.destination}</p>
            <CardDescription className="text-[11px] leading-relaxed">
              ID {trip.id}
              {trip.statusLabel ? ` · ${trip.statusLabel}` : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!form ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Нийтийн форм</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Асуулгууд серверт үүсээгүй байна. Дээрх асуулгыг бөглөөд аяллыг &quot;Хадгалах&quot; дарна уу — дараа нь QR
              идэвхжинэ.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Шалгах
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Нийтлэл</CardTitle>
              <CardDescription className="text-xs">
                QR уншигчид шууд <span className="font-mono text-[10px]">/register/{form.publicSlug}</span> хуудас руу
                орно (drawer биш).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {pubMsg ? <p className="text-xs text-primary">{pubMsg}</p> : null}
              <div className="flex flex-wrap gap-2">
                {form.isPublished ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={publishing}
                    onClick={() => void setPublished(false)}
                  >
                    Ноорог болгох
                  </Button>
                ) : (
                  <Button type="button" size="sm" disabled={publishing} onClick={() => void setPublished(true)}>
                    Нийтлэх
                  </Button>
                )}
                {form.isPublished && publicUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      Урьдчилж харах
                    </a>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled className="opacity-50">
                    Урьдчилж харах
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => void load()}>
                  Сэргээх
                </Button>
              </div>
            </CardContent>
          </Card>

          <TripFormQrCard
            formId={form.id}
            publicSlug={form.publicSlug}
            publicUrl={publicUrl}
            isPublished={form.isPublished}
            compact
          />
        </>
      )}
    </div>
  );
}
