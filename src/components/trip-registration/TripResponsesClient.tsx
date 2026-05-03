"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import type { TripFormMoneyStatus, TripFormResponseWorkflowStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatOrderSummaryMn } from "@/lib/trip-registration-form/order-summary-format";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  submittedAt: string;
  status: TripFormResponseWorkflowStatus;
  paymentStatus: TripFormMoneyStatus;
  internalNote: string | null;
  orderSummary: unknown;
  hasParticipant: boolean;
  answers: { questionLabel: string; value: string | null; fileUrl: string | null }[];
};

const WORKFLOW_OPTIONS: TripFormResponseWorkflowStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CONFIRMED",
  "CANCELLED",
];

const WORKFLOW_LABELS: Record<TripFormResponseWorkflowStatus, string> = {
  SUBMITTED: "Илгээсэн",
  UNDER_REVIEW: "Шалгаж байна",
  APPROVED: "Зөвшөөрсөн",
  REJECTED: "Татгалзсан",
  CONFIRMED: "Баталгаажсан",
  CANCELLED: "Цуцлагдсан",
};

const PAY_OPTIONS: TripFormMoneyStatus[] = ["UNPAID", "PENDING", "PAID", "EXEMPTED", "REFUNDED"];

const PAY_LABELS: Record<TripFormMoneyStatus, string> = {
  UNPAID: "Төлөөгүй",
  PENDING: "Төлбөр хүлээгдэж байна",
  PAID: "Төлбөр төлсөн",
  EXEMPTED: "Чөлөөлөгдсөн",
  REFUNDED: "Буцаагдсан",
};

const selectSm =
  "h-8 min-w-[8.5rem] rounded-md border border-input bg-background px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50";

export default function TripResponsesClient({ tripId, formId }: { tripId: number; formId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [drawerRow, setDrawerRow] = useState<Row | null>(null);
  const [convertRow, setConvertRow] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/forms/${encodeURIComponent(formId)}/responses`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { responses?: Row[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Ачаалахад алдаа");
      return;
    }
    setRows(data.responses ?? []);
  }, [formId]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (!rows) return;
    setDrawerRow((prev) => {
      if (!prev) return null;
      const next = rows.find((r) => r.id === prev.id);
      return next ?? null;
    });
  }, [rows]);

  useEffect(() => {
    if (!drawerRow && !convertRow) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerRow, convertRow]);

  useEffect(() => {
    if (!drawerRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerRow]);

  async function patchRow(id: string, body: { status?: TripFormResponseWorkflowStatus; paymentStatus?: TripFormMoneyStatus }) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/responses/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("patch");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function convert(id: string): Promise<boolean> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/responses/${encodeURIComponent(id)}/convert-to-participant`, { method: "POST" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        alert(j.error === "ALREADY_CONVERTED" ? "Аль хэдийн оролцогч болсон." : "Алдаа гарлаа.");
        return false;
      }
      await load();
      return true;
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const blob = [
        r.id,
        r.status,
        r.paymentStatus,
        formatOrderSummaryMn(r.orderSummary),
        ...r.answers.map((a) => `${a.questionLabel} ${a.value ?? ""} ${a.fileUrl ?? ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rows, query]);

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!rows) {
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
    <div className="rounded-xl bg-muted/40 p-0.5 sm:p-0">
      <Card className="gap-0 overflow-hidden border-0 py-0 shadow-md">
        <CardHeader className="border-b bg-card px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="outline" className="mb-1 font-bold tracking-wide text-primary">
                BUSY.mn
              </Badge>
              <CardTitle className="text-lg">Хариултууд</CardTitle>
              <CardDescription>Бүртгэлийн хариултыг шалгаж, төлбөр ба төлөвийг удирдана.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={`/api/forms/${encodeURIComponent(formId)}/responses/export`}>Excel татах</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/dashboard/trips/${tripId}/form-builder`}>Бүртгэлийн форм</a>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-5">
          <Input
            type="search"
            placeholder="Хайх (текст, төлөв, ID)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
          />

          <Card className="overflow-hidden py-0 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Огноо</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Төлөв</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Төлбөр</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Товч</TableHead>
                  <TableHead className="w-[1%] text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {" "}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const orderBit = formatOrderSummaryMn(r.orderSummary).replace(/\n/g, " · ");
                  const preview = [
                    orderBit,
                    ...r.answers.slice(0, 2).map((a) => `${a.questionLabel}: ${a.value ?? a.fileUrl ?? "—"}`),
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.submittedAt).toLocaleString("mn-MN")}
                      </TableCell>
                      <TableCell>
                        <select
                          className={cn(selectSm, "min-w-[8.5rem]")}
                          value={r.status}
                          disabled={busyId === r.id}
                          onChange={(e) =>
                            void patchRow(r.id, { status: e.target.value as TripFormResponseWorkflowStatus })
                          }
                        >
                          {WORKFLOW_OPTIONS.map((k) => (
                            <option key={k} value={k}>
                              {WORKFLOW_LABELS[k]}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <select
                          className={cn(selectSm, "min-w-[9.5rem]")}
                          value={r.paymentStatus}
                          disabled={busyId === r.id}
                          onChange={(e) =>
                            void patchRow(r.id, { paymentStatus: e.target.value as TripFormMoneyStatus })
                          }
                        >
                          {PAY_OPTIONS.map((k) => (
                            <option key={k} value={k}>
                              {PAY_LABELS[k]}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="max-w-[320px] whitespace-normal text-xs text-muted-foreground">
                        {preview || "—"}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button variant="link" size="sm" className="h-auto px-2 text-xs font-semibold" onClick={() => setDrawerRow(r)}>
                          Дэлгэрэнгүй
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {rows.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Хариулт байхгүй.</p> : null}
            {rows.length > 0 && filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Хайлтанд тохирох үр дүн байхгүй.</p>
            ) : null}
          </Card>
        </CardContent>
      </Card>

      {drawerRow ? (
        <ResponseDetailDrawer
          row={drawerRow}
          busy={busyId === drawerRow.id}
          onClose={() => setDrawerRow(null)}
          onPatch={(body) => void patchRow(drawerRow.id, body)}
          onConvert={() => {
            setConvertRow(drawerRow);
          }}
        />
      ) : null}

      {convertRow ? (
        <ParticipantConversionModal
          row={convertRow}
          busy={busyId === convertRow.id}
          onClose={() => setConvertRow(null)}
          onConfirm={async () => {
            const ok = await convert(convertRow.id);
            if (ok) {
              setConvertRow(null);
              setDrawerRow(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function ResponseDetailDrawer({
  row,
  busy,
  onClose,
  onPatch,
  onConvert,
}: {
  row: Row;
  busy: boolean;
  onClose: () => void;
  onPatch: (body: { status?: TripFormResponseWorkflowStatus; paymentStatus?: TripFormMoneyStatus }) => void;
  onConvert: () => void;
}) {
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" aria-label="Хаах" onClick={onClose} />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-response-drawer-title"
      >
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <p id="trip-response-drawer-title" className="text-lg font-semibold text-foreground">
              Хариултын дэлгэрэнгүй
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{row.id}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(row.submittedAt).toLocaleString("mn-MN")}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={onClose}>
            Хаах
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Төлөв</p>
              <select
                className={cn(selectSm, "w-full")}
                value={row.status}
                disabled={busy}
                onChange={(e) => onPatch({ status: e.target.value as TripFormResponseWorkflowStatus })}
              >
                {WORKFLOW_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {WORKFLOW_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Төлбөр</p>
              <select
                className={cn(selectSm, "w-full")}
                value={row.paymentStatus}
                disabled={busy}
                onChange={(e) => onPatch({ paymentStatus: e.target.value as TripFormMoneyStatus })}
              >
                {PAY_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {PAY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator className="my-6" />

          {formatOrderSummaryMn(row.orderSummary) ? (
            <>
              <h3 className="text-sm font-medium text-foreground">Захиалга (түвшин, тоо, дүн)</h3>
              <div className="mt-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm whitespace-pre-wrap">
                {formatOrderSummaryMn(row.orderSummary)}
              </div>
              <Separator className="my-6" />
            </>
          ) : null}

          <h3 className="text-sm font-medium text-foreground">Хариултууд</h3>
          <dl className="mt-3 space-y-3">
            {row.answers.map((a, i) => (
              <div key={`${row.id}-a-${i}`} className="rounded-lg border bg-muted/40 px-3 py-2.5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-primary">{a.questionLabel}</dt>
                <dd className="mt-1 break-words text-sm text-foreground">{a.value ?? a.fileUrl ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t bg-muted/40 px-5 py-4">
          {row.hasParticipant ? (
            <p className="text-center text-sm font-semibold text-emerald-700">Оролцогч болсон</p>
          ) : (
            <Button className="w-full" disabled={busy} onClick={onConvert}>
              Оролцогч болгох
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}

function ParticipantConversionModal({
  row,
  busy,
  onClose,
  onConfirm,
}: {
  row: Row;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const summary = row.answers.slice(0, 8);

  return (
    <>
      <button type="button" className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" aria-label="Болих" onClick={onClose} />
      <Card
        className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-0 border py-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-modal-title"
      >
        <CardHeader>
          <CardTitle id="convert-modal-title" className="text-lg">
            Оролцогч болгох
          </CardTitle>
          <CardDescription>
            Дараах хариултыг оролцогчийн жагсаалтад нэмнэ. Нэр, утас, имэйл зэргийг хариултаас автоматаар уншина.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-xs text-foreground">
            {summary.map((a, i) => (
              <p key={i} className="border-b border-border py-1.5 last:border-0">
                <span className="font-semibold">{a.questionLabel}:</span>{" "}
                <span className="break-all">{a.value ?? a.fileUrl ?? "—"}</span>
              </p>
            ))}
            {row.answers.length > 8 ? <p className="pt-2 text-muted-foreground">+{row.answers.length - 8} талбар…</p> : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={onClose} disabled={busy}>
              Болих
            </Button>
            <Button className="w-full sm:w-auto" disabled={busy} onClick={() => void onConfirm()}>
              {busy ? "Түр хүлээнэ үү…" : "Баталгаажуулах"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
