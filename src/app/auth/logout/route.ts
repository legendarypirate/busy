import { NextRequest, NextResponse } from "next/server";
import { getPublicAppOrigin } from "@/lib/auth-public-origin";
import { attachClearPlatformSessionToResponse } from "@/lib/platform-session-cookies";

/** GET /auth/logout — clears platform session cookies (must be a route handler, not RSC). */
export async function GET(request: NextRequest) {
  const base = getPublicAppOrigin(request);
  const home = new URL("/", base);
  const res = NextResponse.redirect(home);
  attachClearPlatformSessionToResponse(res);
  return res;
}
