"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatOrderSummaryMn } from "@/lib/trip-registration-form/order-summary-format";

export type AdminTripRegistrationRow = {
  id: string;
  submittedAt: string;
  status: string;
  paymentStatus: string;
  orderSummary: unknown;
  trip: { id: number; destination: string };
  form: { title: string; publicSlug: string };
  submitterEmail: string | null;
  submittedByUserId: string | null;
  participant: { fullName: string | null; phone: string | null; email: string | null } | null;
  answers: { id: string; label: string; sortOrder: number; value: string | null; fileUrl: string | null }[];
};

const WORKFLOW_LABELS: Record<string, string> = {
  SUBMITTED: "Илгээсэн",
  UNDER_REVIEW: "Шалгаж байна",
  APPROVED: "Зөвшөөрсөн",
  REJECTED: "Татгалзсан",
  CONFIRMED: "Баталгаажсан",
  CANCELLED: "Цуцлагдсан",
};

const PAY_LABELS: Record<string, string> = {
  UNPAID: "Төлөөгүй",
  PENDING: "Төлбөр хүлээгдэж байна",
  PAID: "Төлбөр төлсөн",
  EXEMPTED: "Чөлөөлөгдсөн",
  REFUNDED: "Буцаагдсан",
};

function fmtLocal(iso: string): string {
  try {
    return new Date(iso).toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function whoLabel(r: AdminTripRegistrationRow): string {
  return (
    r.participant?.fullName?.trim() ||
    r.participant?.email?.trim() ||
    r.submitterEmail?.trim() ||
    (r.submittedByUserId ? `Хэрэглэгч #${r.submittedByUserId}` : "Зочин")
  );
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "APPROVED":
    case "CONFIRMED":
      return "bg-success text-white";
    case "REJECTED":
    case "CANCELLED":
      return "bg-danger text-white";
    case "UNDER_REVIEW":
      return "bg-warning text-dark";
    default:
      return "bg-secondary text-white";
  }
}

function AnswersCompactTable({ answers }: { answers: AdminTripRegistrationRow["answers"] }) {
  if (answers.length === 0) {
    return <p className="mb-0 small text-muted">Хариултын мөр байхгүй.</p>;
  }
  return (
    <div className="table-responsive border rounded-2">
      <table className="table table-sm table-bordered mb-0 align-middle" style={{ fontSize: "0.8125rem" }}>
        <tbody>
          {answers.map((a, idx) => (
            <tr key={a.id}>
              <th
                scope="row"
                className="text-muted text-break fw-normal bg-light"
                style={{ width: "36%", minWidth: "7rem", verticalAlign: "top" }}
              >
                {idx + 1}. {a.label}
              </th>
              <td className="text-break" style={{ verticalAlign: "top" }}>
                <span className="fw-medium">{(a.value ?? "").trim() || "—"}</span>
                {a.fileUrl?.trim() ? (
                  <div className="mt-1">
                    <a href={a.fileUrl.trim()} target="_blank" rel="noopener noreferrer" className="small">
                      Файл нээх
                    </a>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminTripRegistrationsClient({ rows }: { rows: AdminTripRegistrationRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [inlineId, setInlineId] = useState<string | null>(null);

  const active = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  const close = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    if (!openId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, close]);

  useEffect(() => {
    if (!inlineId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInlineId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inlineId]);

  return (
    <>
      <div className="table-responsive border rounded-3 overflow-hidden bg-white">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr className="small text-secondary text-uppercase" style={{ letterSpacing: "0.02em" }}>
              <th className="ps-3 py-3">Огноо</th>
              <th className="py-3">Аялал</th>
              <th className="py-3">Илгээсэн</th>
              <th className="py-3">Төлөв</th>
              <th className="py-3 text-center">
                Хариулт
                <span className="d-block fw-normal" style={{ fontSize: "0.65rem", letterSpacing: 0 }}>
                  (тоог дарна уу)
                </span>
              </th>
              <th className="py-3 text-center">Захиалга</th>
              <th className="pe-3 py-3 text-end" style={{ width: "1%" }}>
                {" "}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((r) => {
              const orderText = formatOrderSummaryMn(r.orderSummary);
              const mainRow = (
                <tr key={r.id} className="small">
                  <td className="ps-3 text-nowrap text-muted">{fmtLocal(r.submittedAt)}</td>
                  <td>
                    <div className="fw-semibold text-body">
                      {r.trip.id > 0 ? (
                        <Link href={`/admin/trips?edit_trip=${r.trip.id}`} className="text-decoration-none">
                          #{r.trip.id}
                        </Link>
                      ) : (
                        <span className="text-muted">Эвент</span>
                      )}
                    </div>
                    <div className="text-muted text-break" style={{ maxWidth: "14rem" }}>
                      {r.trip.destination}
                    </div>
                  </td>
                  <td className="text-break" style={{ maxWidth: "12rem" }}>
                    {whoLabel(r)}
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <span className={`badge rounded-pill px-2 py-1 fw-normal ${statusBadgeClass(r.status)}`}>
                        {WORKFLOW_LABELS[r.status] ?? r.status}
                      </span>
                      <span className="badge rounded-pill px-2 py-1 fw-normal bg-light text-dark border">
                        {PAY_LABELS[r.paymentStatus] ?? r.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className={`btn btn-sm border-0 text-decoration-underline px-1 ${
                        inlineId === r.id ? "text-primary fw-semibold" : "text-muted"
                      }`}
                      title="Нэг товшилтоор асуулт-хариултыг харуулах / нуух"
                      onClick={() => setInlineId((cur) => (cur === r.id ? null : r.id))}
                    >
                      {r.answers.length}
                    </button>
                  </td>
                  <td className="text-center">
                    {orderText ? (
                      <span className="badge bg-primary text-white rounded-pill">Тийм</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="pe-3 text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary px-2 py-1"
                      onClick={() => setOpenId(r.id)}
                    >
                      Дэлгэрэнгүй
                    </button>
                  </td>
                </tr>
              );
              if (inlineId !== r.id) return [mainRow];
              return [
                mainRow,
                <tr key={`${r.id}-inline`} className="bg-light">
                  <td colSpan={7} className="ps-3 pe-3 py-2 border-top-0">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <span className="small fw-semibold text-body">Асуулт — хариулт</span>
                      <button type="button" className="btn btn-close btn-sm" aria-label="Хаах" onClick={() => setInlineId(null)} />
                    </div>
                    <AnswersCompactTable answers={r.answers} />
                  </td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>

      {active ? (
        <>
          <button
            type="button"
            className="position-fixed top-0 start-0 w-100 h-100 border-0 p-0"
            style={{ zIndex: 1040, background: "rgba(15, 23, 42, 0.45)", cursor: "default" }}
            aria-label="Хаах"
            onClick={close}
          />
          <aside
            className="position-fixed top-0 end-0 h-100 bg-white shadow-lg d-flex flex-column border-start"
            style={{ zIndex: 1050, width: "min(100%, 28rem)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-trip-reg-drawer-title"
          >
            <div className="border-bottom px-3 py-3 d-flex align-items-start justify-content-between gap-2 bg-light">
              <div className="min-w-0">
                <h2 id="admin-trip-reg-drawer-title" className="h6 mb-1 fw-bold text-body">
                  Бүртгэлийн дэлгэрэнгүй
                </h2>
                <p className="mb-0 small text-muted text-break font-monospace">{active.id}</p>
                <p className="mb-0 small text-muted mt-1">{fmtLocal(active.submittedAt)}</p>
              </div>
              <button type="button" className="btn btn-sm btn-outline-secondary shrink-0" onClick={close}>
                Хаах
              </button>
            </div>

            <div className="flex-grow-1 overflow-auto px-3 py-3 small">
              <section className="mb-4">
                <h3 className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
                  Аялал ба форм
                </h3>
                <div className="rounded-3 border bg-white p-3">
                  <div className="mb-2">
                    <span className="text-muted d-block mb-0" style={{ fontSize: "0.7rem" }}>
                      Аялал
                    </span>
                    {active.trip.id > 0 ? (
                      <Link
                        href={`/admin/trips?edit_trip=${active.trip.id}`}
                        className="fw-semibold text-decoration-none"
                      >
                        #{active.trip.id} — {active.trip.destination}
                      </Link>
                    ) : (
                      <span className="fw-semibold">{active.trip.destination}</span>
                    )}
                  </div>
                  <div className="mb-0">
                    <span className="text-muted d-block mb-0" style={{ fontSize: "0.7rem" }}>
                      Форм
                    </span>
                    <div className="fw-medium">{active.form.title}</div>
                    <a
                      href={`/register/${encodeURIComponent(active.form.publicSlug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      Нийтийн хуудас нээх →
                    </a>
                  </div>
                </div>
              </section>

              <section className="mb-4">
                <h3 className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
                  Илгээгч
                </h3>
                <div className="rounded-3 border bg-white p-3">
                  <div className="mb-1">
                    <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                      Нэр / имэйл
                    </span>
                    <div className="text-break">{whoLabel(active)}</div>
                  </div>
                  {active.participant?.phone?.trim() ? (
                    <div className="mb-0">
                      <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                        Утас
                      </span>
                      <div>{active.participant.phone.trim()}</div>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="mb-4">
                <h3 className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
                  Төлөв
                </h3>
                <div className="d-flex flex-wrap gap-2">
                  <span className={`badge rounded-pill px-3 py-2 fw-normal ${statusBadgeClass(active.status)}`}>
                    {WORKFLOW_LABELS[active.status] ?? active.status}
                  </span>
                  <span className="badge rounded-pill px-3 py-2 fw-normal bg-light text-dark border">
                    {PAY_LABELS[active.paymentStatus] ?? active.paymentStatus}
                  </span>
                </div>
              </section>

              {formatOrderSummaryMn(active.orderSummary) ? (
                <section className="mb-4">
                  <h3 className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
                    Захиалга
                  </h3>
                  <div className="rounded-3 border border-info bg-light p-3">
                    <pre className="mb-0 small text-body" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                      {formatOrderSummaryMn(active.orderSummary)}
                    </pre>
                  </div>
                </section>
              ) : null}

              <section>
                <h3 className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
                  Хариултууд ({active.answers.length})
                </h3>
                <AnswersCompactTable answers={active.answers} />
              </section>
            </div>

            <div className="border-top px-3 py-2 bg-light d-flex justify-content-end">
              <button type="button" className="btn btn-primary btn-sm" onClick={close}>
                Хаах
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
