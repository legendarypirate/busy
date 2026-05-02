import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Preserves pathname for `requirePlatformUser` → login `next` query.
 * Server Action POSTs (`next-action`): plain `NextResponse.next()` only — avoid cloning request
 * headers so multipart + `bni_platform_account_id` stay reliable on `/platform/trips` saves.
 */
export function middleware(request: NextRequest) {
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-busy-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/platform", "/platform/:path*"],
};
