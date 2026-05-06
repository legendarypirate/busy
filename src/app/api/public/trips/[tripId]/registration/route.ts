import { type NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { prisma } from "@/lib/prisma";
import {
  getPublishedTripRegistrationDrawerSchema,
  submitPublicFormResponseByTripId,
} from "@/lib/trip-registration-form/service";
import {
  TripFormValidationError,
  type TripFormSubmitAnswer,
} from "@/lib/trip-registration-form/submit-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ tripId: string }> };
type PaymentAction = "qpay" | "invoice";
type TripSchemaField = { name: string; type: string; label: string };

function parsePaymentAction(raw: unknown): PaymentAction {
  return raw === "invoice" ? "invoice" : "qpay";
}

function parseOrderTotalMnt(raw: unknown): number {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return 0;
  const total = Number((raw as Record<string, unknown>).totalMnt ?? 0);
  return Number.isFinite(total) ? Math.max(0, Math.round(total)) : 0;
}

function buildOrderRef(tripId: number): string {
  return `TRIP-${tripId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function qpayToken(): Promise<string> {
  const base = process.env.QPAY_BASE_URL?.trim().replace(/\/$/, "") || "";
  const login = process.env.QPAY_LOGIN?.trim() || "";
  const password = process.env.QPAY_PASSWORD?.trim() || "";
  if (!base || !login || !password) {
    throw new Error("QPAY_CONFIG_MISSING");
  }
  const basic = Buffer.from(`${login}:${password}`).toString("base64");
  const res = await fetch(`${base}/v2/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("QPAY_AUTH_FAILED");
  const data = (await res.json()) as Record<string, unknown>;
  const token = String(data.access_token ?? data.token ?? "").trim();
  if (!token) throw new Error("QPAY_AUTH_FAILED");
  return token;
}

function qpayLinkFromInvoiceResponse(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const direct = String(d.qr_text ?? d.qrText ?? d.qPay_QRcode ?? d.qPayQrCode ?? d.invoice_qr_text ?? "").trim();
  if (direct) return direct;
  const links = Array.isArray(d.urls) ? d.urls : Array.isArray(d.qpay_urls) ? d.qpay_urls : [];
  for (const row of links) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const link = String(r.link ?? r.url ?? "").trim();
    if (link) return link;
  }
  return null;
}

async function createQpayInvoiceForTrip(params: { tripId: number; amountMnt: number; orderRef: string }) {
  const base = process.env.QPAY_BASE_URL?.trim().replace(/\/$/, "") || "";
  const invoiceCode = process.env.QPAY_INVOICE_CODE?.trim() || "";
  const receiverCode = process.env.QPAY_RECEIVER_CODE?.trim() || "";
  const callbackUrl = process.env.QPAY_CALLBACK_URL?.trim() || "";
  if (!base || !invoiceCode || !receiverCode) {
    throw new Error("QPAY_CONFIG_MISSING");
  }
  const token = await qpayToken();
  const payload = {
    invoice_code: invoiceCode,
    sender_invoice_no: params.orderRef,
    invoice_receiver_code: receiverCode,
    invoice_description: `BUSY trip #${params.tripId}`,
    amount: params.amountMnt,
    ...(callbackUrl ? { callback_url: callbackUrl } : {}),
  };
  const res = await fetch(`${base}/v2/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error("QPAY_INVOICE_FAILED");
  }
  const invoiceId = String(body.invoice_id ?? body.invoiceId ?? body.id ?? "").trim() || null;
  const link = qpayLinkFromInvoiceResponse(body);
  if (!link) throw new Error("QPAY_QR_MISSING");
  const qrDataUrl = await QRCode.toDataURL(link, {
    margin: 1,
    width: 280,
    color: { dark: "#0b2149", light: "#ffffff" },
  });
  return { invoiceId, invoiceResponse: body, qrDataUrl };
}

function extractEmailFromAnswers(
  answers: TripFormSubmitAnswer[],
  schema: TripSchemaField[],
): string | null {
  const byId = new Map(answers.map((a) => [a.questionId, String(a.value ?? "").trim()]));
  const emailField = schema.find((q) => q.type === "email") ?? schema.find((q) => /email|имэйл/i.test(q.label));
  if (!emailField) return null;
  const v = byId.get(emailField.name) ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

function extractFullNameFromAnswers(answers: TripFormSubmitAnswer[], schema: TripSchemaField[]): string {
  const byId = new Map(answers.map((a) => [a.questionId, String(a.value ?? "").trim()]));
  const nameField =
    schema.find((q) => /бүтэн\s*нэр|овог|нэр/i.test(q.label)) ??
    schema.find((q) => q.type === "text" && /name/i.test(q.label));
  if (!nameField) return "";
  return byId.get(nameField.name) ?? "";
}

function buildAnswerRows(
  answers: TripFormSubmitAnswer[],
  schema: TripSchemaField[],
): { label: string; value: string }[] {
  const byId = new Map(answers.map((a) => [a.questionId, String(a.value ?? "").trim()]));
  const rows: { label: string; value: string }[] = [];
  for (const q of schema) {
    const v = byId.get(q.name) ?? "";
    if (!v) continue;
    rows.push({ label: q.label, value: v });
  }
  return rows;
}

async function resolveInvoiceFontBytes(): Promise<Uint8Array | null> {
  const candidates = [
    process.env.INVOICE_PDF_FONT_PATH?.trim() || "",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      const b = await readFile(p);
      if (b.length > 0) return new Uint8Array(b);
    } catch {
      continue;
    }
  }
  return null;
}

async function styledInvoicePdfBytes(params: {
  orderRef: string;
  tripTitle: string;
  amountMnt: number;
  fullName: string;
  answers: { label: string; value: string }[];
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const page = pdf.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBytes = await resolveInvoiceFontBytes();
  const titleFont = fontBytes ? await pdf.embedFont(fontBytes) : await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = fontBytes ? titleFont : await pdf.embedFont(StandardFonts.Helvetica);
  const monoFont = await pdf.embedFont(StandardFonts.CourierBold);

  // Header strip
  page.drawRectangle({
    x: 0,
    y: height - 115,
    width,
    height: 115,
    color: rgb(0.05, 0.13, 0.29),
  });
  page.drawText("BUSY.mn", {
    x: 42,
    y: height - 58,
    size: 24,
    font: titleFont,
    color: rgb(1, 1, 1),
  });
  page.drawText("Нэхэмжлэх / Invoice", {
    x: 42,
    y: height - 84,
    size: 13,
    font: bodyFont,
    color: rgb(0.88, 0.92, 1),
  });

  const wrapLines = (text: string, maxWidth: number, fontSize: number): string[] => {
    const src = (text || "").replace(/\s+/g, " ").trim();
    if (!src) return ["-"];
    const words = src.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      const widthNow = bodyFont.widthOfTextAtSize(next, fontSize);
      if (widthNow <= maxWidth) {
        cur = next;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines.length > 0 ? lines : ["-"];
  };

  // Meta (wrapped rows)
  let y = height - 150;
  const line = (label: string, value: string, emphasize = false) => {
    const labelX = 42;
    const valueX = 190;
    const valueW = width - valueX - 42;
    const valueSize = emphasize ? 13 : 11;
    const lineHeight = emphasize ? 19 : 16;
    const lines = wrapLines(value, valueW, valueSize);

    page.drawText(label, { x: labelX, y, size: 10, font: bodyFont, color: rgb(0.4, 0.46, 0.56) });
    lines.forEach((txt, idx) => {
      page.drawText(txt, {
        x: valueX,
        y: y - idx * lineHeight,
        size: valueSize,
        font: emphasize ? titleFont : bodyFont,
        color: rgb(0.12, 0.16, 0.22),
      });
    });
    y -= Math.max(20, lines.length * lineHeight + 6);
  };
  line("Захиалгын дугаар", params.orderRef);
  line("Огноо", new Date().toISOString().slice(0, 10));
  line("Үйлчилгээ", params.tripTitle);
  line("Захиалагч", params.fullName || "-");
  line("Нийт дүн (MNT)", `₮ ${params.amountMnt.toLocaleString("mn-MN")}`, true);

  y -= 6;
  page.drawLine({
    start: { x: 42, y },
    end: { x: width - 42, y },
    thickness: 1,
    color: rgb(0.9, 0.92, 0.95),
  });
  y -= 18;

  page.drawText("Формын мэдээлэл", {
    x: 42,
    y,
    size: 12,
    font: titleFont,
    color: rgb(0.1, 0.15, 0.25),
  });
  y -= 18;

  const rows = params.answers.slice(0, 12);
  for (const row of rows) {
    if (y < 70) break;
    const rowTop = y;
    const labelX = 52;
    const valueX = 280;
    const labelW = 210;
    const valueW = width - valueX - 44;
    const fs = 10;
    const lh = 14;
    const labelLines = wrapLines(row.label, labelW, fs);
    const valueLines = wrapLines(row.value || "-", valueW, fs);
    const rowLines = Math.max(labelLines.length, valueLines.length);
    const rowH = rowLines * lh + 10;

    page.drawRectangle({
      x: 42,
      y: rowTop - rowH + 4,
      width: width - 84,
      height: rowH,
      color: rgb(0.985, 0.99, 1),
      borderWidth: 1,
      borderColor: rgb(0.92, 0.94, 0.97),
    });

    labelLines.forEach((txt, i) => {
      page.drawText(`${i === 0 ? "• " : "  "}${txt}`, {
        x: labelX,
        y: rowTop - i * lh,
        size: fs,
        font: bodyFont,
        color: rgb(0.36, 0.42, 0.52),
      });
    });
    valueLines.forEach((txt, i) => {
      page.drawText(txt, {
        x: valueX,
        y: rowTop - i * lh,
        size: fs,
        font: bodyFont,
        color: rgb(0.12, 0.16, 0.22),
      });
    });
    y -= rowH + 6;
  }

  page.drawText(params.orderRef, {
    x: width - 220,
    y: 36,
    size: 11,
    font: monoFont,
    color: rgb(0.35, 0.4, 0.5),
  });

  return await pdf.save();
}

async function sendInvoiceEmail(input: {
  to: string;
  orderRef: string;
  tripTitle: string;
  amountMnt: number;
  fullName: string;
  answers: { label: string; value: string }[];
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = process.env.MAIL_FROM_ADDRESS?.trim() || "noreply@busy.mn";
  if (!apiKey) throw new Error("MAIL_CONFIG_MISSING");
  const pdfBytes = await styledInvoicePdfBytes(input);
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h3>BUSY.mn - Нэхэмжлэх</h3>
      <p>Сайн байна уу${input.fullName ? `, ${input.fullName}` : ""}.</p>
      <p>Таны аяллын бүртгэлийн нэхэмжлэх хавсаргасан файлаар илгээгдлээ.</p>
      <p><strong>Захиалгын дугаар:</strong> ${input.orderRef}<br/>
      <strong>Аялал:</strong> ${input.tripTitle}<br/>
      <strong>Дүн:</strong> ₮ ${input.amountMnt.toLocaleString("mn-MN")}</p>
    </div>
  `.trim();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Нэхэмжлэх • ${input.orderRef}`,
      html,
      attachments: [
        {
          filename: `invoice-${input.orderRef}.pdf`,
          content: pdfBase64,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("MAIL_SEND_FAILED");
}

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

/** Legacy PHP shape: `{ success, schema }` for homepage trip drawer. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { tripId: raw } = await ctx.params;
    const tripId = Number.parseInt(raw, 10);
    if (!Number.isFinite(tripId) || tripId < 1) {
      return NextResponse.json({ success: false, message: "Буруу аяллын дугаар." }, { status: 400 });
    }

    const out = await getPublishedTripRegistrationDrawerSchema(tripId);
    if (!out.ok) {
      return NextResponse.json({ success: false, message: out.message }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      tripTitle: out.tripTitle,
      schema: out.schema,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа. Дахин оролдоно уу." },
      { status: 500 },
    );
  }
}

/** Submit answers for the published form on this trip (same storage as `/api/public/forms/.../responses`). */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { tripId: raw } = await ctx.params;
    const tripId = Number.parseInt(raw, 10);
    if (!Number.isFinite(tripId) || tripId < 1) {
      return NextResponse.json({ success: false, message: "Буруу аяллын дугаар." }, { status: 400 });
    }

    let body: { answers: TripFormSubmitAnswer[]; orderSummary?: unknown; paymentAction?: unknown };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ success: false, message: "JSON буруу байна." }, { status: 400 });
    }
    if (!Array.isArray(body.answers)) {
      return NextResponse.json({ success: false, message: "answers массив шаардлагатай." }, { status: 400 });
    }
    const paymentAction = parsePaymentAction(body.paymentAction);
    const totalMnt = parseOrderTotalMnt(body.orderSummary);
    if (totalMnt < 1) {
      return NextResponse.json({ success: false, message: "Төлбөрийн дүн олдсонгүй." }, { status: 400 });
    }

    const user = await getApiPlatformUser(req);

    try {
      await submitPublicFormResponseByTripId({
        tripId,
        answers: body.answers,
        submittedByUserId: user?.id ?? null,
        orderSummary: body.orderSummary,
      });
      const schemaOut = await getPublishedTripRegistrationDrawerSchema(tripId);
      const schema = schemaOut.ok ? schemaOut.schema : [];
      const email = extractEmailFromAnswers(body.answers, schema);
      const fullName = body.answers.find((a) => /name|нэр/i.test(a.questionId))?.value ?? "";
      const orderRef = buildOrderRef(tripId);

      if (paymentAction === "qpay") {
        const qpay = await createQpayInvoiceForTrip({ tripId, amountMnt: totalMnt, orderRef });
        await prisma.paymentOrder.create({
          data: {
            orderRef,
            targetType: "trip",
            targetId: BigInt(tripId),
            amountMnt: totalMnt,
            fullPriceMnt: totalMnt,
            qpayInvoiceId: qpay.invoiceId,
            qpayInvoiceResponseJson: JSON.stringify(qpay.invoiceResponse),
            status: "pending",
          },
        });
        return NextResponse.json({
          success: true,
          message: "QPay QR амжилттай үүслээ. QR уншуулж төлбөрөө төлнө үү.",
          payment: { qrDataUrl: qpay.qrDataUrl },
        });
      }

      if (!email) {
        return NextResponse.json(
          { success: false, message: "Нэхэмжлэх илгээхэд имэйл талбар шаардлагатай." },
          { status: 400 },
        );
      }
      await sendInvoiceEmail({
        to: email,
        orderRef,
        tripTitle: schemaOut.ok ? schemaOut.tripTitle : `Trip #${tripId}`,
        amountMnt: totalMnt,
        fullName: extractFullNameFromAnswers(body.answers, schema) || String(fullName || "").trim(),
        answers: buildAnswerRows(body.answers, schema),
      });
      await prisma.paymentOrder.create({
        data: {
          orderRef,
          targetType: "trip",
          targetId: BigInt(tripId),
          amountMnt: totalMnt,
          fullPriceMnt: totalMnt,
          status: "pending",
        },
      });
      return NextResponse.json({
        success: true,
        message: `Нэхэмжлэх ${email} хаяг руу PDF хавсралтаар илгээгдлээ.`,
        payment: { invoiceEmail: email },
      });
    } catch (e) {
      if (e instanceof TripFormValidationError) {
        return NextResponse.json(
          {
            success: false,
            message: "Заавал талбаруудыг бөглөж, зөв форматаар оруулна уу.",
            code: "validation",
            validationCode: e.code,
            questionId: e.questionId ?? null,
            questionLabel: e.questionLabel ?? null,
          },
          { status: e.status },
        );
      }
      const msg = e instanceof Error ? e.message : "Алдаа";
      const code =
        msg === "UNKNOWN_QUESTION"
          ? "unknown_question"
          : msg === "VALIDATION"
            ? "validation"
            : msg === "NOT_FOUND"
              ? "not_found"
              : msg === "INVALID_ORDER_SUMMARY" || msg === "ORDER_REQUIRES_TIERS" || msg === "INVALID_TIER"
                ? "order_summary"
                : msg === "STALE_PRICE"
                  ? "stale_price"
                  : msg === "CAPACITY_EXCEEDED"
                    ? "capacity"
                    : "submit_failed";
      const status = statusFromError(e);
      const friendly =
        code === "validation"
          ? "Заавал талбаруудыг бөглөж, зөв форматаар оруулна уу."
          : code === "not_found"
            ? "Нийтэд нээлттэй форм олдсонгүй."
            : code === "order_summary"
              ? "Захиалгын мэдээлэл буруу байна. Түвшин, тоо ширхэгийг дахин сонгоно уу."
              : code === "stale_price"
                ? "Үнэ шинэчлэгдсэн байна. Хуудсыг дахин ачаалаад сонголтоо шинэчилнэ үү."
                : code === "capacity"
                  ? "Суудлын хязгаараас хэтэрсэн тоо сонгосон байна."
                  : msg === "QPAY_CONFIG_MISSING"
                    ? "QPay тохиргоо дутуу байна. Админд хандана уу."
                    : msg === "QPAY_AUTH_FAILED" || msg === "QPAY_INVOICE_FAILED" || msg === "QPAY_QR_MISSING"
                      ? "QPay invoice үүсгэхэд алдаа гарлаа."
                      : msg === "MAIL_CONFIG_MISSING"
                        ? "Имэйл тохиргоо дутуу байна. Админд хандана уу."
                        : msg === "MAIL_SEND_FAILED"
                          ? "Нэхэмжлэх имэйл илгээхэд алдаа гарлаа."
                  : "Бүртгэл хадгалах үед алдаа гарлаа. Дахин оролдоно уу.";
      return NextResponse.json({ success: false, message: friendly, code }, { status });
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Серверийн алдаа. Дахин оролдоно уу." },
      { status: 500 },
    );
  }
}
