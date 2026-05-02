import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * 1) GET/RSC under `/platform`: require `bni_platform_account_id` so users never see the trip UI
 *    without a Next session (avoids filling a form then failing on Server Action POST).
 * 2) Server Action POSTs (`next-action`): use plain `NextResponse.next()` only — do not clone
 *    request headers here; some setups break multipart + cookies when request headers are rewritten.
 * 3) Otherwise attach `x-busy-pathname` for `requirePlatformUser` login `next` preservation.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search ?? "";
  const nextParam = `${pathname}${search}`;
  const isServerAction = request.headers.has("next-action");

  if (!isServerAction) {
    const hasPlatformSession = Boolean(request.cookies.get("bni_platform_account_id")?.value?.trim());
    if (!hasPlatformSession) {
      const login = new URL("/auth/login", request.url);
      const safeNext =
        nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam.slice(0, 2048) : "/platform";
      login.searchParams.set("next", safeNext);
      return NextResponse.redirect(login);
    }
  }

  if (isServerAction) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-busy-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/platform", "/platform/:path*"],
};
