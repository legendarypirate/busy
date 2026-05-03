"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TripRegistrationDrawerShell } from "@/components/trip-registration/TripRegistrationDrawerShell";
import { buildTripDrawerAnswersFromForm } from "@/lib/trip-registration-form/drawer-build-answers";
import type { HomeTripDrawerSchemaItem } from "@/lib/trip-registration-form/service";

async function readResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`Сервер хоосон хариу илгээсэн (HTTP ${res.status}). API / nginx тохиргоо шалгана уу.`);
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`JSON биш хариу (HTTP ${res.status}).`);
  }
}

export default function HomeTripRegisterDrawer() {
  const [open, setOpen] = useState(false);
  const [tripId, setTripId] = useState<number | null>(null);
  const [tripTitle, setTripTitle] = useState("Олон улсын бизнес аялал");
  const [schema, setSchema] = useState<HomeTripDrawerSchemaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; kind: "" | "loading" | "success" | "error" }>({
    text: "",
    kind: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    document.body.classList.remove("trip-register-open");
    setFeedback({ text: "", kind: "" });
  }, []);

  const loadSchema = useCallback(async (id: number) => {
    setLoading(true);
    setSchema([]);
    setFeedback({ text: "", kind: "" });
    try {
      const res = await fetch(`/api/public/trips/${id}/registration`, { cache: "no-store" });
      const data = await readResponseJson<{
        success?: boolean;
        tripTitle?: string;
        schema?: HomeTripDrawerSchemaItem[];
        message?: string;
      }>(res);
      if (!res.ok || !data.success || !Array.isArray(data.schema)) {
        throw new Error(data.message || "Формын асуулга ачаалж чадсангүй.");
      }
      if (data.tripTitle) setTripTitle(data.tripTitle);
      setSchema(data.schema);
      setFeedback({ text: "", kind: "" });
    } catch (e) {
      setFeedback({
        text: e instanceof Error ? e.message : "Форм ачаалах үед алдаа гарлаа.",
        kind: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const openDrawer = useCallback(
    (id: number, title: string) => {
      setTripId(id);
      if (title) setTripTitle(title);
      setOpen(true);
      document.body.classList.add("trip-register-open");
      void loadSchema(id);
    },
    [loadSchema],
  );

  useEffect(() => {
    return () => {
      document.body.classList.remove("trip-register-open");
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const btn = t?.closest(".js-trip-register-btn") as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      const idRaw = btn.getAttribute("data-trip-id")?.trim();
      const id = idRaw ? Number.parseInt(idRaw, 10) : NaN;
      if (!Number.isFinite(id) || id < 1) return;
      const title = btn.getAttribute("data-trip-title")?.trim() || "";
      openDrawer(id, title);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openDrawer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tripId || !formRef.current) {
      setFeedback({ text: "Аяллын ID олдсонгүй. Хуудсыг дахин ачаална уу.", kind: "error" });
      return;
    }
    const answers = buildTripDrawerAnswersFromForm(schema, formRef.current);
    setFeedback({ text: "Илгээж байна...", kind: "loading" });
    try {
      const res = await fetch(`/api/public/trips/${tripId}/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await readResponseJson<{ success?: boolean; message?: string }>(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Бүртгэл хадгалах үед алдаа гарлаа.");
      }
      setFeedback({ text: data.message || "Таны бүртгэлийг амжилттай хүлээн авлаа.", kind: "success" });
      formRef.current.reset();
      window.setTimeout(() => closeDrawer(), 5000);
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Серверийн алдаа гарлаа. Дахин оролдоно уу.",
        kind: "error",
      });
    }
  }

  return (
    <TripRegistrationDrawerShell
      open={open}
      onClose={closeDrawer}
      tripTitle={tripTitle}
      tripId={tripId}
      loading={loading}
      schema={schema}
      feedback={feedback}
      formRef={formRef}
      onSubmit={onSubmit}
    />
  );
}
