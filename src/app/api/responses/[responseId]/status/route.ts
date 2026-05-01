import { type NextRequest, NextResponse } from "next/server";
import type { TripFormMoneyStatus, TripFormResponseWorkflowStatus } from "@prisma/client";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { patchTripFormResponse } from "@/lib/trip-registration-form/organizer";

type Ctx = { params: Promise<{ responseId: string }> };

function statusFromError(e: unknown): number {
  if (e instanceof Error && typeof (e as Error & { status?: number }).status === "number") {
    return (e as Error & { status?: number }).status!;
  }
  return 400;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { responseId } = await ctx.params;
  let body: {
    status?: TripFormResponseWorkflowStatus;
    paymentStatus?: TripFormMoneyStatus;
    internalNote?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const updated = await patchTripFormResponse(responseId, user.id, body);
    return NextResponse.json({
      ok: true,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      internalNote: updated.internalNote,
    });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: statusFromError(e) });
  }
}
