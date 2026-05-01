import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { renderTripRegistrationFormQrPng } from "@/lib/trip-registration-form/trip-form-qr";

type Ctx = { params: Promise<{ formId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getApiPlatformUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { formId } = await ctx.params;
  const out = await renderTripRegistrationFormQrPng(req, formId, user.id);
  if (!out.ok) {
    return NextResponse.json({ error: out.status === 404 ? "not_found" : "forbidden" }, { status: out.status });
  }

  return new Response(Buffer.from(out.body), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
