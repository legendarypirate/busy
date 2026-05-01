import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Preserves pathname for `requirePlatformUser` → login `next` query (App Router layouts have no pathname prop). */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-busy-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/platform", "/platform/:path*"],
};
