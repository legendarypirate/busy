import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getPublicAppOrigin } from "@/lib/auth-public-origin";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { executeSaveTrip } from "@/lib/platform-trip-save-core";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = getPublicAppOrigin(request);
  const user = await getApiPlatformUser(request);
  const returnAdmin = request.nextUrl.searchParams.get("return") === "admin";
  const afterSavePath = returnAdmin ? "/admin/trips" : "/platform/trips";
  const errBase = returnAdmin ? "/admin/trips" : "/platform/trips";

  if (!user) {
    const next = encodeURIComponent(returnAdmin ? "/admin/trips" : "/platform/trips");
    return NextResponse.redirect(new URL(`/auth/login?next=${next}`, origin), 303);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(new URL(`${errBase}?error=missing`, origin), 303);
  }

  const result = await executeSaveTrip(user.id, formData, { errorRedirectBase: errBase });
  if (result.kind === "redirect") {
    return NextResponse.redirect(new URL(result.to, origin), 303);
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  if (returnAdmin) {
    revalidatePath("/admin/trips");
  }
  return NextResponse.redirect(new URL(afterSavePath, origin), 303);
}
