import { NextResponse } from "next/server";
import { attachClearPlatformSessionToResponse } from "@/lib/platform-session-cookies";

/** GET /auth/logout — clears platform session cookies (must be a route handler, not RSC). */
export async function GET(request: Request) {
  const home = new URL("/", request.url);
  const res = NextResponse.redirect(home);
  attachClearPlatformSessionToResponse(res);
  return res;
}
