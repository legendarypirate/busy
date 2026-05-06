import { type NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { prisma } from "@/lib/prisma";
import { readExtras } from "@/components/platform/trips/trip-editor-helpers";
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
  sellerInfo: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    bankAccount: string;
  };
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const page = pdf.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const fontBytes = await resolveInvoiceFontBytes();
  const titleFont = fontBytes ? await pdf.embedFont(fontBytes) : await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = fontBytes ? titleFont : await pdf.embedFont(StandardFonts.Helvetica);
  const monoFont = await pdf.embedFont(StandardFonts.CourierBold);

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

  const dark = rgb(0.13, 0.21, 0.3);
  const muted = rgb(0.43, 0.48, 0.54);
  const red = rgb(0.85, 0.18, 0.2);
  const lineColor = rgb(0.78, 0.8, 0.83);
  const headerBg = rgb(0.13, 0.24, 0.35);
  const boxBg = rgb(0.97, 0.97, 0.98);

  const margin = 28;
  const contentW = width - margin * 2;
  let y = height - 42;

  // Title
  page.drawText("НЭХЭМЖЛЭЛ", {
    x: width / 2 - titleFont.widthOfTextAtSize("НЭХЭМЖЛЭЛ", 18) / 2,
    y,
    size: 18,
    font: titleFont,
    color: dark,
  });
  y -= 20;
  const meta = `Дугаар: ${params.orderRef} | Огноо: ${new Date().toISOString().slice(0, 10)}`;
  page.drawText(meta, {
    x: width / 2 - bodyFont.widthOfTextAtSize(meta, 10) / 2,
    y,
    size: 10,
    font: bodyFont,
    color: muted,
  });
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1.3, color: dark });
  y -= 22;

  // Two column parties box
  const boxH = 238;
  const colGap = 14;
  const colW = (contentW - colGap) / 2;
  page.drawRectangle({
    x: margin,
    y: y - boxH,
    width: contentW,
    height: boxH,
    color: boxBg,
    borderWidth: 0.8,
    borderColor: lineColor,
  });
  page.drawLine({
    start: { x: margin + colW + colGap / 2, y: y - 8 },
    end: { x: margin + colW + colGap / 2, y: y - boxH + 8 },
    thickness: 0.8,
    color: lineColor,
  });

  const leftX = margin + 10;
  const rightX = margin + colW + colGap + 10;
  let ly = y - 26;
  let ry = y - 26;
  page.drawText("Нэхэмжлэгч", { x: leftX, y: ly, size: 12, font: titleFont, color: dark });
  page.drawText("Төлөгч", { x: rightX, y: ry, size: 12, font: titleFont, color: dark });
  ly -= 10;
  ry -= 10;
  page.drawLine({ start: { x: leftX, y: ly }, end: { x: leftX + colW - 18, y: ly }, thickness: 0.7, color: lineColor });
  page.drawLine({ start: { x: rightX, y: ry }, end: { x: rightX + colW - 18, y: ry }, thickness: 0.7, color: lineColor });
  ly -= 22;
  ry -= 22;

  const answerMap = new Map(params.answers.map((r) => [r.label.toLowerCase(), r.value]));
  const pick = (...keys: string[]) => {
    for (const [k, v] of answerMap) {
      if (keys.some((x) => k.includes(x))) return v;
    }
    return "-";
  };

  const sellerRows: [string, string][] = [
    ["Байгууллагын нэр:", params.sellerInfo.companyName],
    ["Хаяг:", params.sellerInfo.address],
    ["Утас:", params.sellerInfo.phone],
    ["Имэйл:", params.sellerInfo.email],
    ["Банкны данс:", params.sellerInfo.bankAccount],
    ["Гүйлгээний утга:", params.orderRef],
  ];
  const payerRows: [string, string][] = [
    ["Байгууллагын нэр:", pick("компани", "байгууллага")],
    ["Регистрийн дугаар:", pick("регистр")],
    ["Хаяг:", pick("хаяг")],
    ["Имэйл:", pick("имэйл", "email")],
    ["Утас:", pick("утас", "phone")],
    ["Нэхэмжлэл:", new Date().toISOString().slice(0, 10)],
    ["Дуусах:", new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)],
  ];

  const drawRows = (rows: [string, string][], startX: number, startY: number, maxW: number) => {
    let rowY = startY;
    for (const [label, value] of rows) {
      const labelW = 90;
      page.drawText(label, { x: startX, y: rowY, size: 9, font: titleFont, color: dark });
      const lines = wrapLines(value || "-", maxW - labelW - 10, 8.8);
      lines.forEach((ln, i) => {
        page.drawText(ln, { x: startX + labelW, y: rowY - i * 12, size: 8.8, font: bodyFont, color: rgb(0.16, 0.18, 0.2) });
      });
      rowY -= Math.max(18, lines.length * 12 + 3);
      if (rowY < y - boxH + 18) break;
    }
  };
  drawRows(sellerRows, leftX, ly, colW - 20);
  drawRows(payerRows, rightX, ry, colW - 20);
  y -= boxH + 16;

  // Items table
  const tX = margin;
  const tW = contentW;
  const cols = [32, 286, 95, 90, 92]; // #, item, qty, unit, total
  const itemName = params.tripTitle || "Аяллын бүртгэлийн урьдчилгаа төлбөр";
  const qty = 1;
  const unit = params.amountMnt;
  const total = qty * unit;
  const rowsData: [string, string, string, string, string][] = [
    ["1", itemName, String(qty), `${unit.toLocaleString("mn-MN")} ₮`, `${total.toLocaleString("mn-MN")} ₮`],
  ];
  const headH = 26;
  page.drawRectangle({ x: tX, y: y - headH, width: tW, height: headH, color: headerBg });
  const heads = ["#", "Бараа/Үйлчилгээ", "Тоо ширхэг", "Нэгж үнэ", "Нийт дүн"];
  let cx = tX;
  heads.forEach((h, i) => {
    page.drawText(h, { x: cx + 6, y: y - 17, size: 9.5, font: titleFont, color: rgb(1, 1, 1) });
    cx += cols[i];
  });
  y -= headH;
  const rowH = 28;
  for (const row of rowsData) {
    page.drawRectangle({ x: tX, y: y - rowH, width: tW, height: rowH, borderWidth: 0.6, borderColor: lineColor });
    let x = tX;
    row.forEach((cell, i) => {
      page.drawText(cell, { x: x + 6, y: y - 18, size: 9.2, font: bodyFont, color: rgb(0.16, 0.2, 0.25), maxWidth: cols[i] - 10 });
      x += cols[i];
    });
    y -= rowH;
  }
  y -= 6;
  page.drawLine({ start: { x: tX, y }, end: { x: tX + tW, y }, thickness: 1.2, color: dark });
  y -= 18;

  // Totals
  const subTotal = Math.round(total / 1.1);
  const vat = total - subTotal;
  const shipping = 0;
  const grand = total + shipping;
  const rLabelX = tX;
  const rValX = tX + tW - 6;
  const totalLine = (label: string, value: string, isGrand = false) => {
    page.drawText(label, {
      x: rLabelX,
      y,
      size: isGrand ? 12 : 10.5,
      font: isGrand ? titleFont : bodyFont,
      color: isGrand ? red : dark,
    });
    const fw = bodyFont.widthOfTextAtSize(value, isGrand ? 12 : 10.5);
    page.drawText(value, {
      x: rValX - fw,
      y,
      size: isGrand ? 12 : 10.5,
      font: isGrand ? titleFont : bodyFont,
      color: isGrand ? red : dark,
    });
    y -= isGrand ? 26 : 22;
  };
  totalLine("Дэд дүн (НӨАТ-гүй):", `${subTotal.toLocaleString("mn-MN")} ₮`);
  totalLine("НӨАТ (10%):", `${vat.toLocaleString("mn-MN")} ₮`);
  totalLine("Хүргэлтийн төлбөр:", `${shipping.toLocaleString("mn-MN")} ₮`);
  page.drawLine({ start: { x: tX, y: y + 8 }, end: { x: tX + tW, y: y + 8 }, thickness: 0.7, color: lineColor });
  totalLine("Татвартай нийт дүн:", `${grand.toLocaleString("mn-MN")} ₮`, true);

  const amountWords = `${params.amountMnt.toLocaleString("mn-MN")} төгрөг`;
  page.drawText("Нийт дүн үсгээр:", { x: tX, y, size: 10.5, font: titleFont, color: dark });
  page.drawText(amountWords, { x: tX + 160, y, size: 10.5, font: bodyFont, color: dark });
  y -= 26;

  // Note
  page.drawText("ТЭМДЭГЛЭЛ", { x: tX, y, size: 12.5, font: titleFont, color: dark });
  y -= 12;
  page.drawLine({ start: { x: tX, y }, end: { x: tX + tW, y }, thickness: 0.6, color: lineColor });
  y -= 16;
  const noteText =
    params.answers.find((a) => /тэмдэглэл|note|нэмэлт/i.test(a.label.toLowerCase()))?.value ||
    params.answers.map((a) => a.value).join(" • ").slice(0, 140);
  page.drawText(noteText || "-", { x: tX, y, size: 10, font: bodyFont, color: rgb(0.2, 0.24, 0.3), maxWidth: tW });
  y -= 38;
  page.drawLine({ start: { x: tX, y }, end: { x: tX + tW, y }, thickness: 0.6, color: lineColor });
  y -= 36;

  // Footer sign lines
  page.drawText("Дарга......................... /................../", { x: tX + 200, y, size: 10, font: bodyFont, color: muted });
  y -= 18;
  page.drawText("Хүлээн авсан ..................... /................../", { x: tX + 200, y, size: 10, font: bodyFont, color: muted });
  y -= 18;
  page.drawText("Нягтлан бодогч................... /................../", { x: tX + 200, y, size: 10, font: bodyFont, color: muted });

  page.drawText(params.orderRef, {
    x: width - 220,
    y: 24,
    size: 10,
    font: monoFont,
    color: rgb(0.45, 0.48, 0.53),
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
  sellerInfo: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    bankAccount: string;
  };
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
      const tripRow = await prisma.businessTrip.findUnique({
        where: { id: tripId },
        select: { extrasJson: true },
      });
      const tripExtras = readExtras(tripRow?.extrasJson ?? null);
      const sellerInfo = {
        companyName: tripExtras.trip_invoice_seller_name || "ТЭРГҮҮН ГЭРЭГЭ ЭХК",
        address: tripExtras.trip_invoice_seller_address || "Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, Olympic Street 19/1",
        phone: tripExtras.trip_invoice_seller_phone || "+976 9300-0022",
        email: tripExtras.trip_invoice_seller_email || "busy.mn@busy.mn",
        bankAccount: tripExtras.trip_invoice_seller_bank_account || "26000 500 500396 6474 (ХААН БАНК)",
      };
      await sendInvoiceEmail({
        to: email,
        orderRef,
        tripTitle: schemaOut.ok ? schemaOut.tripTitle : `Trip #${tripId}`,
        amountMnt: totalMnt,
        fullName: extractFullNameFromAnswers(body.answers, schema) || String(fullName || "").trim(),
        answers: buildAnswerRows(body.answers, schema),
        sellerInfo,
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
