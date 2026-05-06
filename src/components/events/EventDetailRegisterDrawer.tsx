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

type Props = {
  eventId: string;
  initialTitle: string;
};

export default function EventDetailRegisterDrawer({ eventId, initialTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [schema, setSchema] = useState<HomeTripDrawerSchemaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; kind: "" | "loading" | "success" | "error" }>({
    text: "",
    kind: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    document.body.classList.remove("trip-register-open");
    setFeedback({ text: "", kind: "" });
    setFieldErrors({});
  }, []);

  const loadSchema = useCallback(async () => {
    setLoading(true);
    setSchema([]);
    setFeedback({ text: "", kind: "" });
    setFieldErrors({});
    try {
      const res = await fetch(`/api/public/events/${eventId}/registration`, { cache: "no-store" });
      const data = await readResponseJson<{
        success?: boolean;
        tripTitle?: string;
        schema?: HomeTripDrawerSchemaItem[];
        message?: string;
      }>(res);
      if (!res.ok || !data.success || !Array.isArray(data.schema)) {
        throw new Error(data.message || "Формын асуулга ачаалж чадсангүй.");
      }
      if (data.tripTitle) setTitle(data.tripTitle);
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
  }, [eventId]);

  const openDrawer = useCallback(() => {
    setOpen(true);
    document.body.classList.add("trip-register-open");
    void loadSchema();
  }, [loadSchema]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("trip-register-open");
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  function collectRequiredFieldErrors(answers: { questionId: string; value: string | null }[]) {
    const byField: Record<string, string> = {};
    const byId = new Map(answers.map((a) => [a.questionId, (a.value ?? "").trim()]));
    for (const q of schema) {
      if (!q.required) continue;
      const v = byId.get(q.name) ?? "";
      if (!v) byField[q.name] = "Заавал бөглөнө.";
    }
    return byField;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) {
      setFeedback({ text: "Форм олдсонгүй. Хуудсыг дахин ачаална уу.", kind: "error" });
      return;
    }
    const answers = buildTripDrawerAnswersFromForm(schema, formRef.current);
    const requiredErrors = collectRequiredFieldErrors(answers);
    if (Object.keys(requiredErrors).length > 0) {
      setFieldErrors(requiredErrors);
      setFeedback({ text: "Заавал талбаруудыг бөглөж, зөв форматаар оруулна уу.", kind: "error" });
      return;
    }
    setFeedback({ text: "Илгээж байна...", kind: "loading" });
    setFieldErrors({});
    try {
      const res = await fetch(`/api/public/events/${eventId}/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await readResponseJson<{
        success?: boolean;
        message?: string;
        code?: string;
        validationCode?: string;
        questionId?: string | null;
      }>(res);
      if (!res.ok || !data.success) {
        const qid = (data.questionId ?? "").trim();
        if (qid) {
          const text =
            data.validationCode === "email"
              ? "Имэйл форматаа шалгана уу."
              : data.validationCode === "phone"
                ? "Утасны дугаар 8+ оронтой байх ёстой."
                : data.validationCode === "choice"
                  ? "Зөв сонголтыг сонгоно уу."
                  : data.validationCode === "number"
                    ? "Тоо оруулна уу."
                    : data.validationCode === "file_url"
                      ? "Зөв URL оруулна уу."
                      : "Заавал бөглөнө.";
          setFieldErrors({ [qid]: text });
        }
        throw new Error(data.message || "Бүртгэл хадгалах үед алдаа гарлаа.");
      }
      setFeedback({ text: data.message || "Таны бүртгэлийг амжилттай хүлээн авлаа.", kind: "success" });
      setFieldErrors({});
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
    <>
      <button type="button" className="btn-register-submit w-100 mb-2" onClick={openDrawer}>
        Бүртгүүлэх
      </button>
      <TripRegistrationDrawerShell
        open={open}
        onClose={closeDrawer}
        tripTitle={title}
        eventId={eventId}
        tripId={null}
        loading={loading}
        schema={schema}
        feedback={feedback}
        fieldErrors={fieldErrors}
        formRef={formRef}
        onSubmit={onSubmit}
      />
    </>
  );
}
