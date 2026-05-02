import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getPublicAppOrigin } from "@/lib/auth-public-origin";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { executeSaveTrip } from "@/lib/platform-trip-save-core";

export const runtime = "nodejs";

/**
 * Multipart trip save via classic POST so browsers send **all** cookies (httpOnly + ref)
 * with `multipart/form-data`. Some stacks drop session cookies on App Router Server Action POSTs.
 */
export async function POST(request: NextRequest) {
  const origin = getPublicAppOrigin(request);
  const user = await getApiPlatformUser(request);
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?next=/platform/trips", origin), 303);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(new URL("/platform/trips?error=missing", origin), 303);
  }

  const result = await executeSaveTrip(user.id, formData);
  if (result.kind === "redirect") {
    return NextResponse.redirect(new URL(result.to, origin), 303);
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  return NextResponse.redirect(new URL("/platform/trips", origin), 303);
}
