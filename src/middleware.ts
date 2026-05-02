import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Forward pathname so `getPlatformLoginNextPath(await headers())` can build `/auth/login?next=…`. */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/platform/:path*"],
};
