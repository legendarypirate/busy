"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TripRegistrationDrawerShell } from "@/components/trip-registration/TripRegistrationDrawerShell";
import { buildTripDrawerAnswersFromForm } from "@/lib/trip-registration-form/drawer-build-answers";
import type { TripCheckoutTier } from "@/components/trip-details/trip-checkout-tier";
import { TripDetailsRegistrationQr } from "@/components/trip-details/TripDetailsRegistrationQr";
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

function emptyCounts(tiers: TripCheckoutTier[]): Record<string, number> {
  return tiers.reduce(
    (acc, t) => {
      acc[t.id] = 0;
      return acc;
    },
    {} as Record<string, number>,
  );
}

export type TripDetailsBookingContextValue = {
  defaultDepartureIso: string;
  tiers: TripCheckoutTier[];
  maxPassengers: number;
  capacityNote: string;
  /** Trip departure (YYYY-MM-DD); matches admin trip start, not user-editable on this page. */
  departure: string;
  counts: Record<string, number>;
  bump: (id: string, delta: number) => void;
  clearTier: (id: string) => void;
  totalPax: number;
  checkoutTotalMnt: number;
  openRegister: () => void;
  registrationQrDataUrl: string | null;
  registrationQrCaption: string | null;
  /** Same URL encoded in the QR (full page link to the public registration form or trip page). */
  registrationFormUrl: string | null;
};

const TripDetailsBookingContext = createContext<TripDetailsBookingContextValue | null>(null);

export function useTripDetailsBooking(): TripDetailsBookingContextValue {
  const v = useContext(TripDetailsBookingContext);
  if (!v) {
    throw new Error("useTripDetailsBooking must be used within TripDetailsBookingRegisterProvider");
  }
  return v;
}

type ProviderProps = {
  tripId: number;
  tripTitle: string;
  defaultDepartureIso: string;
  tiers: TripCheckoutTier[];
  maxPassengers: number;
  capacityNote: string;
  /** Data URL PNG/SVG for `/register/…` or trip page (server-generated). */
  registrationQrDataUrl?: string | null;
  registrationQrCaption?: string | null;
  /** Absolute URL for the public form (for “copy link” under the QR). */
  registrationFormUrl?: string | null;
  children: ReactNode;
};

export function TripDetailsBookingRegisterProvider({
  tripId,
  tripTitle,
  defaultDepartureIso,
  tiers,
  maxPassengers,
  capacityNote,
  registrationQrDataUrl = null,
  registrationQrCaption = null,
  registrationFormUrl = null,
  children,
}: ProviderProps) {
  const [departure, setDeparture] = useState(defaultDepartureIso);
  const [counts, setCounts] = useState<Record<string, number>>(() => emptyCounts(tiers));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [schema, setSchema] = useState<HomeTripDrawerSchemaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; kind: "" | "loading" | "success" | "error" }>({
    text: "",
    kind: "",
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setDeparture(defaultDepartureIso);
  }, [defaultDepartureIso]);

  const tiersSig = useMemo(
    () => tiers.map((t) => `${t.id}:${t.priceMnt}:${t.label}`).join("|"),
    [tiers],
  );
  useEffect(() => {
    setCounts(emptyCounts(tiers));
  }, [tripId, tiersSig, tiers]);

  const totalPax = useMemo(() => tiers.reduce((s, t) => s + (counts[t.id] ?? 0), 0), [counts, tiers]);
  const checkoutTotalMnt = useMemo(
    () => tiers.reduce((s, t) => s + (counts[t.id] ?? 0) * t.priceMnt, 0),
    [counts, tiers],
  );

  const setTier = useCallback(
    (id: string, next: number) => {
      const clamped = Math.max(0, next);
      const other = tiers.filter((t) => t.id !== id).reduce((s, t) => s + (counts[t.id] ?? 0), 0);
      const capForThis = Math.max(0, maxPassengers - other);
      setCounts((prev) => ({ ...prev, [id]: Math.min(clamped, capForThis) }));
    },
    [counts, maxPassengers, tiers],
  );

  const bump = useCallback(
    (id: string, delta: number) => {
      setTier(id, (counts[id] ?? 0) + delta);
    },
    [counts, setTier],
  );

  const clearTier = useCallback((id: string) => {
    setCounts((prev) => ({ ...prev, [id]: 0 }));
  }, []);

  const loadSchema = useCallback(async () => {
    setLoading(true);
    setSchema([]);
    setFeedback({ text: "", kind: "" });
    try {
      const res = await fetch(`/api/public/trips/${tripId}/registration`, { cache: "no-store" });
      const data = await readResponseJson<{
        success?: boolean;
        tripTitle?: string;
        schema?: HomeTripDrawerSchemaItem[];
        message?: string;
      }>(res);
      if (!res.ok || !data.success || !Array.isArray(data.schema)) {
        throw new Error(data.message || "Формын асуулга ачаалж чадсангүй.");
      }
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
  }, [tripId]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    document.body.classList.remove("trip-register-open");
    setFeedback({ text: "", kind: "" });
  }, []);

  const openRegister = useCallback(() => {
    if (totalPax < 1) {
      window.alert("Эхлээд түвшин бүрээр хүний тоог сонгоно уу.");
      return;
    }
    setDrawerOpen(true);
    document.body.classList.add("trip-register-open");
    void loadSchema();
  }, [loadSchema, totalPax]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("trip-register-open");
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  const buildOrderSummaryPayload = useCallback(() => {
    const lines = tiers.flatMap((t) => {
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
      departureIso: departure,
      lines,
      totalPax,
      totalMnt: checkoutTotalMnt,
    };
  }, [tiers, counts, departure, totalPax, checkoutTotalMnt]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) {
      setFeedback({ text: "Форм олдсонгүй.", kind: "error" });
      return;
    }
    if (totalPax < 1) {
      setFeedback({ text: "Хамгийн багадаа нэг хүний тоо сонгоно уу.", kind: "error" });
      return;
    }
    const answers = buildTripDrawerAnswersFromForm(schema, formRef.current);
    const orderSummary = buildOrderSummaryPayload();
    setFeedback({ text: "Илгээж байна...", kind: "loading" });
    try {
      const res = await fetch(`/api/public/trips/${tripId}/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, orderSummary }),
      });
      const data = await readResponseJson<{ success?: boolean; message?: string; code?: string }>(res);
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

  const ctx: TripDetailsBookingContextValue = useMemo(
    () => ({
      defaultDepartureIso,
      tiers,
      maxPassengers,
      capacityNote,
      departure,
      counts,
      bump,
      clearTier,
      totalPax,
      checkoutTotalMnt,
      openRegister,
      registrationQrDataUrl: registrationQrDataUrl?.trim() || null,
      registrationQrCaption: registrationQrCaption?.trim() || null,
      registrationFormUrl: registrationFormUrl?.trim() || null,
    }),
    [
      defaultDepartureIso,
      tiers,
      maxPassengers,
      capacityNote,
      departure,
      counts,
      bump,
      clearTier,
      totalPax,
      checkoutTotalMnt,
      openRegister,
      registrationQrDataUrl,
      registrationQrCaption,
      registrationFormUrl,
    ],
  );

  const formatMnt = (n: number) => n.toLocaleString("mn-MN", { maximumFractionDigits: 0 });
  const checkoutSub =
    totalPax === 0 ? "Түвшин сонгоно уу" : `${totalPax} хүн · ${formatMnt(checkoutTotalMnt)} ₮`;

  return (
    <TripDetailsBookingContext.Provider value={ctx}>
      {children}
      <TripRegistrationDrawerShell
        open={drawerOpen}
        onClose={closeDrawer}
        tripTitle={tripTitle}
        tripId={tripId}
        loading={loading}
        schema={schema}
        feedback={feedback}
        formRef={formRef}
        onSubmit={onSubmit}
        beforeActions={
          <div className="trip-register-field mb-3 rounded border bg-light px-3 py-2 small">
            <div className="fw-semibold text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>
              Захиалгын дүн
            </div>
            <div className="mt-1">{checkoutSub}</div>
            <div className="text-muted mt-1">Эхлэх: {departure}</div>
          </div>
        }
      />
    </TripDetailsBookingContext.Provider>
  );
}

type HeroProps = { isLoggedIn: boolean; payTripUrl: string };

export function TripDetailsHeroCtas({ isLoggedIn, payTripUrl }: HeroProps) {
  const { openRegister } = useTripDetailsBooking();
  if (isLoggedIn) {
    return (
      <a href={payTripUrl} className="btn btn-warning btn-lg rounded-pill fw-bold px-5 mb-4 shadow">
        Төлбөр төлөх
      </a>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-qpay btn-lg rounded-pill fw-bold px-5 mb-4 shadow"
      onClick={() => openRegister()}
    >
      Бүртгүүлэх
    </button>
  );
}

type SidebarCtasProps = {
  isLoggedIn: boolean;
  payTripUrl: string;
  qpayLogoUrl: string;
};

export function TripDetailsSidebarRegisterCtas({ isLoggedIn, payTripUrl, qpayLogoUrl }: SidebarCtasProps) {
  const { openRegister } = useTripDetailsBooking();
  return (
    <>
      <div className="trd-cta-grid trd-cta-grid--stacked">
        {isLoggedIn ? (
          <a className="trd-btn-qpay" href={payTripUrl}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qpayLogoUrl} alt="QPay" width="72" height="20" loading="lazy" decoding="async" />
            <span>Төлбөр төлөх</span>
          </a>
        ) : (
          <button
            type="button"
            className="btn btn-qpay w-100 py-2 fw-bold d-inline-flex align-items-center justify-content-center gap-2"
            onClick={() => openRegister()}
          >
            <i className="fa-solid fa-user-check" aria-hidden="true" />
            <span>Бүртгүүлэх</span>
          </button>
        )}
        <button className="trd-btn-contact" type="button">
          <i className="fa-solid fa-headset" />
          <span>Зөвлөх</span>
        </button>
      </div>
      <TripDetailsRegistrationQr />
    </>
  );
}
