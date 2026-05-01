import type { NextRequest } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { assertFormEditableByAccount } from "@/lib/trip-registration-form/organizer";

function absoluteRegisterUrl(req: Request, publicSlug: string): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (!host) return `/register/${publicSlug}`;
  return `${proto}://${host}/register/${publicSlug}`;
}

export async function renderTripRegistrationFormQrPng(
  req: NextRequest,
  formId: string,
  userId: bigint,
): Promise<{ ok: true; body: Uint8Array } | { ok: false; status: 403 | 404 }> {
  const form = await prisma.tripRegistrationForm.findUnique({
    where: { id: formId },
    select: { id: true, publicSlug: true, isPublished: true },
  });
  if (!form) return { ok: false, status: 404 };

  try {
    await assertFormEditableByAccount(form.id, userId);
  } catch (e) {
    const st = (e as Error & { status?: number }).status;
    if (st === 403) return { ok: false, status: 403 };
    if (st === 404) return { ok: false, status: 404 };
    return { ok: false, status: 403 };
  }

  const url = absoluteRegisterUrl(req, form.publicSlug);
  const buf = await QRCode.toBuffer(url, { type: "png", width: 512, margin: 2 });
  return { ok: true, body: new Uint8Array(buf) };
}
