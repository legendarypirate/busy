import { NextRequest, NextResponse } from "next/server";
import { SITE_CONTACT } from "@/lib/site-contact";

const MAX_MESSAGE = 4000;
const MAX_NAME = 200;

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Буруу хүсэлт." }, { status: 400 });
    }

    const rec = body as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    const email = typeof rec.email === "string" ? rec.email.trim() : "";
    const phone = typeof rec.phone === "string" ? rec.phone.trim() : "";
    const message = typeof rec.message === "string" ? rec.message.trim() : "";
    const honeypot = typeof rec.website === "string" ? rec.website.trim() : "";

    if (honeypot) {
      return NextResponse.json({ ok: true });
    }

    if (!name || name.length > MAX_NAME) {
      return NextResponse.json({ error: "Нэрээ оруулна уу (хамгийн ихдээ 200 тэмдэгт)." }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Зөв имэйл хаяг оруулна уу." }, { status: 400 });
    }
    if (phone.length > 40) {
      return NextResponse.json({ error: "Утасны дугаар хэт урт байна." }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: "Зурвас хамгийн багадаа 10 тэмдэгт байна." }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: `Зурвас ${MAX_MESSAGE} тэмдэгтээс уртгүй байна.` }, { status: 400 });
    }

    console.info("[contact] inbound", {
      name,
      email,
      phone: phone || undefined,
      messagePreview: message.slice(0, 160),
      routeTo: SITE_CONTACT.email,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Алдаа гарлаа. Дахин оролдоно уу." }, { status: 500 });
  }
}
