import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenericPayload = Record<string, unknown>;

function asTrimmed(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function parsePayload(raw: unknown): GenericPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as GenericPayload;
}

function extractInvoiceId(payload: GenericPayload): string {
  return (
    asTrimmed(payload.invoice_id) ||
    asTrimmed(payload.invoiceId) ||
    asTrimmed(payload.qpay_invoice_id) ||
    asTrimmed(payload.payment_id) ||
    asTrimmed(payload.id)
  );
}

function extractOrderRef(payload: GenericPayload): string {
  return (
    asTrimmed(payload.sender_invoice_no) ||
    asTrimmed(payload.senderInvoiceNo) ||
    asTrimmed(payload.order_ref) ||
    asTrimmed(payload.orderRef) ||
    asTrimmed(payload.reference)
  );
}

function extractStatus(payload: GenericPayload): string {
  return (
    asTrimmed(payload.payment_status) ||
    asTrimmed(payload.paymentStatus) ||
    asTrimmed(payload.status) ||
    asTrimmed(payload.state)
  ).toLowerCase();
}

function isPaidStatus(status: string): boolean {
  if (!status) return false;
  return [
    "paid",
    "success",
    "succeeded",
    "done",
    "completed",
    "settled",
    "approved",
  ].includes(status);
}

async function readRequestPayload(req: NextRequest): Promise<GenericPayload> {
  const contentType = req.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/json")) {
    return parsePayload(await req.json().catch(() => ({})));
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const sp = new URLSearchParams(text);
    const out: GenericPayload = {};
    sp.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  return parsePayload(await req.json().catch(() => ({})));
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "qpay-callback",
    callbackUrl: "/api/payments/qpay/callback",
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await readRequestPayload(req);
    const invoiceId = extractInvoiceId(payload);
    const orderRef = extractOrderRef(payload);
    const status = extractStatus(payload);

    if (!invoiceId && !orderRef) {
      return NextResponse.json(
        { ok: false, message: "invoice_id эсвэл order_ref олдсонгүй." },
        { status: 400 },
      );
    }

    const where = invoiceId
      ? { qpayInvoiceId: invoiceId }
      : { orderRef };

    const existing = await prisma.paymentOrder.findFirst({ where });
    if (!existing) {
      return NextResponse.json(
        { ok: false, message: "Payment order олдсонгүй." },
        { status: 404 },
      );
    }

    const mergedCallback = (() => {
      const prev = asTrimmed(existing.callbackJson);
      if (!prev) return JSON.stringify(payload);
      try {
        const oldObj = JSON.parse(prev) as GenericPayload;
        return JSON.stringify({ ...oldObj, ...payload });
      } catch {
        return JSON.stringify(payload);
      }
    })();

    const paid = isPaidStatus(status);
    await prisma.paymentOrder.update({
      where: { id: existing.id },
      data: {
        callbackJson: mergedCallback,
        ...(paid
          ? {
              status: "paid",
              paidAt: new Date(),
            }
          : {}),
      },
    });

    return NextResponse.json({
      ok: true,
      paymentOrderId: existing.id.toString(),
      status: paid ? "paid" : existing.status,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "QPay callback боловсруулах үед алдаа гарлаа." },
      { status: 500 },
    );
  }
}

