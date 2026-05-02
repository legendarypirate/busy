import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getPublicAppOrigin } from "@/lib/auth-public-origin";
import {
  type ApiPlatformUser,
  getApiPlatformUser,
  getApiPlatformUserFromTripSaveForm,
} from "@/lib/api-platform-session";
import { executeSaveTrip } from "@/lib/platform-trip-save-core";
import { attachPlatformSessionToResponse } from "@/lib/platform-session-cookies";

export const runtime = "nodejs";

/**
 * Always re-`Set-Cookie` on successful save so httpOnly + ref cookies stay aligned with login `Domain=`
 * and long multipart saves do not leave the next GET without a usable session (prod “sometimes login”).
 */
function redirectAfterSave(
  origin: string,
  path: string,
  _cookieUser: ApiPlatformUser | null,
  sessionUser: ApiPlatformUser,
  status = 303,
): NextResponse {
  const res = NextResponse.redirect(new URL(path, origin), status);
  attachPlatformSessionToResponse(res, sessionUser.id, sessionUser.displayName);
  return res;
}

/**
 * Multipart trip save via classic POST so browsers send **all** cookies (httpOnly + ref)
 * with `multipart/form-data`. Some stacks drop session cookies on App Router Server Action POSTs.
 */
export async function POST(request: NextRequest) {
  const origin = getPublicAppOrigin(request);
  const cookieUser = await getApiPlatformUser(request);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(new URL("/platform/trips?error=missing", origin), 303);
  }

  const user = cookieUser ?? (await getApiPlatformUserFromTripSaveForm(formData));
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?next=/platform/trips", origin), 303);
  }

  const result = await executeSaveTrip(user.id, formData);
  if (result.kind === "redirect") {
    return redirectAfterSave(origin, result.to, cookieUser, user);
  }

  revalidatePath("/platform/trips");
  revalidatePath("/trips");
  return redirectAfterSave(origin, "/platform/trips", cookieUser, user);
}
