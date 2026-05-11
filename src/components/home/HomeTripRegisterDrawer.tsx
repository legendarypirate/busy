"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TripRegistrationDrawerShell } from "@/components/trip-registration/TripRegistrationDrawerShell";
import { buildTripDrawerAnswersFromForm } from "@/lib/trip-registration-form/drawer-build-answers";
import type { HomeTripDrawerSchemaItem } from "@/lib/trip-registration-form/service";

type DrawerTier = { id: string; label: string; subtitle: string; priceMnt: number };
type DrawerCheckout = {
  tiers: DrawerTier[];
  departureIso: string;
  maxPassengers: number;
  capacityNote: string;
};
type PaymentAction = "qpay" | "invoice";

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

/**
 * Pick the highest-priced tier as the default selection (qty = 1) — matches
 * `trip-details-booking-context.tsx` `defaultCounts()` so that price
 * calculation is identical regardless of where the drawer was opened.
 */
function defaultCounts(tiers: DrawerTier[], maxPassengers: number): Record<string, number> {
  const counts = tiers.reduce(
    (acc, t) => {
      acc[t.id] = 0;
      return acc;
    },
    {} as Record<string, number>,
  );
  if (tiers.length === 0 || maxPassengers < 1) return counts;
  let highest = tiers[0];
  for (const t of tiers) {
    if (t.priceMnt > highest.priceMnt) highest = t;
  }
  counts[highest.id] = 1;
  return counts;
}

function formatMnt(n: number): string {
  return n.toLocaleString("mn-MN", { maximumFractionDigits: 0 });
}

export default function HomeTripRegisterDrawer() {
  const [open, setOpen] = useState(false);
  const [tripId, setTripId] = useState<number | null>(null);
  const [tripTitle, setTripTitle] = useState("Олон улсын бизнес аялал");
  const [schema, setSchema] = useState<HomeTripDrawerSchemaItem[]>([]);
  const [checkout, setCheckout] = useState<DrawerCheckout | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [paymentQrDataUrl, setPaymentQrDataUrl] = useState<string | null>(null);
  const [topSuccessAlert, setTopSuccessAlert] = useState<string>("");
  const [submittingPaymentAction, setSubmittingPaymentAction] = useState<PaymentAction | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; kind: "" | "loading" | "success" | "error" }>({
    text: "",
    kind: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const totalPax = useMemo(
    () => (checkout?.tiers ?? []).reduce((s, t) => s + (counts[t.id] ?? 0), 0),
    [counts, checkout],
  );
  const checkoutTotalMnt = useMemo(
    () => (checkout?.tiers ?? []).reduce((s, t) => s + (counts[t.id] ?? 0) * t.priceMnt, 0),
    [counts, checkout],
  );

  const closeDrawer = useCallback(() => {
    setOpen(false);
    document.body.classList.remove("trip-register-open");
    setFeedback({ text: "", kind: "" });
    setFieldErrors({});
    setPaymentQrDataUrl(null);
  }, []);

  const loadSchema = useCallback(async (id: number) => {
    setLoading(true);
    setSchema([]);
    setCheckout(null);
    setCounts({});
    setFeedback({ text: "", kind: "" });
    setFieldErrors({});
    try {
      const res = await fetch(`/api/public/trips/${id}/registration`, { cache: "no-store" });
      const data = await readResponseJson<{
        success?: boolean;
        tripTitle?: string;
        schema?: HomeTripDrawerSchemaItem[];
        checkout?: DrawerCheckout | null;
        message?: string;
      }>(res);
      if (!res.ok || !data.success || !Array.isArray(data.schema)) {
        throw new Error(data.message || "Формын асуулга ачаалж чадсангүй.");
      }
      if (data.tripTitle) setTripTitle(data.tripTitle);
      setSchema(data.schema);
      if (data.checkout && Array.isArray(data.checkout.tiers) && data.checkout.tiers.length > 0) {
        setCheckout(data.checkout);
        setCounts(defaultCounts(data.checkout.tiers, data.checkout.maxPassengers));
      } else {
        setCheckout(null);
        setCounts({});
      }
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
    if (!topSuccessAlert) return;
    const timer = window.setTimeout(() => setTopSuccessAlert(""), 3500);
    return () => window.clearTimeout(timer);
  }, [topSuccessAlert]);

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

  function buildOrderSummaryPayload() {
    if (!checkout) return null;
    const lines = checkout.tiers.flatMap((t) => {
      const qty = counts[t.id] ?? 0;
      if (qty <= 0) return [];
      const unitPriceMnt = t.priceMnt;
      return [
        {
          tierId: t.id,
          label: t.label,
          qty,
          unitPriceMnt,
          lineTotalMnt: qty * unitPriceMnt,
        },
      ];
    });
    return {
      departureIso: checkout.departureIso,
      lines,
      totalPax,
      totalMnt: checkoutTotalMnt,
    };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tripId || !formRef.current) {
      setFeedback({ text: "Аяллын ID олдсонгүй. Хуудсыг дахин ачаална уу.", kind: "error" });
      return;
    }
    const answers = buildTripDrawerAnswersFromForm(schema, formRef.current);
    const requiredErrors = collectRequiredFieldErrors(answers);
    if (Object.keys(requiredErrors).length > 0) {
      setFieldErrors(requiredErrors);
      setFeedback({ text: "Заавал талбаруудыг бөглөж, зөв форматаар оруулна уу.", kind: "error" });
      return;
    }

    const nativeEvt = e.nativeEvent as SubmitEvent;
    const submitter = nativeEvt.submitter as HTMLButtonElement | null;
    const paymentAction: PaymentAction = submitter?.value === "invoice" ? "invoice" : "qpay";

    if (checkout && totalPax < 1) {
      setFeedback({ text: "Хамгийн багадаа нэг хүний тоо сонгоно уу.", kind: "error" });
      return;
    }

    setSubmittingPaymentAction(paymentAction);
    setPaymentQrDataUrl(null);
    setFeedback({ text: "Илгээж байна...", kind: "loading" });
    setFieldErrors({});

    const orderSummary = buildOrderSummaryPayload();

    try {
      const res = await fetch(`/api/public/trips/${tripId}/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          ...(orderSummary ? { orderSummary, paymentAction } : {}),
        }),
      });
      const data = await readResponseJson<{
        success?: boolean;
        message?: string;
        code?: string;
        validationCode?: string;
        questionId?: string | null;
        payment?: { qrDataUrl?: string | null; invoiceEmail?: string | null };
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
      if (paymentAction === "qpay" && data.payment?.qrDataUrl) {
        setPaymentQrDataUrl(data.payment.qrDataUrl);
      }
      setFeedback({ text: data.message || "Таны бүртгэлийг амжилттай хүлээн авлаа.", kind: "success" });
      setFieldErrors({});
      if (paymentAction === "invoice") {
        formRef.current.reset();
        setTopSuccessAlert(data.message || "Нэхэмжлэх амжилттай илгээгдлээ.");
        window.setTimeout(() => closeDrawer(), 5000);
      }
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Серверийн алдаа гарлаа. Дахин оролдоно уу.",
        kind: "error",
      });
    } finally {
      setSubmittingPaymentAction(null);
    }
  }

  const checkoutSub =
    !checkout || totalPax === 0
      ? checkout
        ? "Түвшин сонгоно уу"
        : ""
      : `${totalPax} хүн · ${formatMnt(checkoutTotalMnt)} ₮`;

  const beforeActions =
    checkout && checkout.tiers.length > 0 ? (
      <div className="mb-3">
        <div className="trip-register-field mb-3 rounded border bg-light px-3 py-2 small">
          <div className="fw-semibold text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
            Захиалгын дүн
          </div>
          <div className="mt-1">{checkoutSub}</div>
          {checkout.departureIso ? (
            <div className="text-muted mt-1">Эхлэх: {checkout.departureIso}</div>
          ) : null}
        </div>
        {paymentQrDataUrl ? (
          <div className="trip-register-field rounded border bg-white p-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentQrDataUrl}
              alt="QPay QR"
              style={{ width: 220, height: 220, objectFit: "contain", margin: "0 auto" }}
            />
            <div className="small text-muted mt-2">QPay апп-аар QR уншуулж төлбөрөө гүйцээнэ үү.</div>
          </div>
        ) : null}
      </div>
    ) : null;

  const paymentMode: "single" | "trip_dual" = checkout && checkout.tiers.length > 0 ? "trip_dual" : "single";

  return (
    <>
      {topSuccessAlert ? (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-success shadow-lg border-0"
          style={{ zIndex: 3000, minWidth: 320, maxWidth: "92vw" }}
          role="alert"
          aria-live="assertive"
        >
          <div className="d-flex align-items-start gap-2">
            <i className="fa-solid fa-circle-check mt-1" aria-hidden />
            <span className="fw-semibold">{topSuccessAlert}</span>
          </div>
        </div>
      ) : null}
      <TripRegistrationDrawerShell
        open={open}
        onClose={closeDrawer}
        tripTitle={tripTitle}
        tripId={tripId}
        loading={loading}
        schema={schema}
        feedback={feedback}
        fieldErrors={fieldErrors}
        formRef={formRef}
        onSubmit={onSubmit}
        beforeActions={beforeActions}
        paymentMode={paymentMode}
        activePaymentAction={submittingPaymentAction}
      />
    </>
  );
}
