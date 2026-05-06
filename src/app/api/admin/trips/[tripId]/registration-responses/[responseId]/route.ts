import { NextResponse, type NextRequest } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ tripId: string; responseId: string }> };

const ALLOWED_EMAIL = "idersaikhan.ja@gmail.com";

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user || user.email.trim().toLowerCase() !== ALLOWED_EMAIL) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { tripId: rawTripId, responseId } = await ctx.params;
  const tripId = Math.max(0, Number.parseInt(rawTripId, 10));
  if (!Number.isFinite(tripId) || tripId < 1 || !responseId?.trim()) {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  const existing = await prisma.tripFormResponse.findFirst({
    where: { id: responseId, tripId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.tripFormResponse.delete({ where: { id: responseId } });
  return NextResponse.json({ ok: true });
}
