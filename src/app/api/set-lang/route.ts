import { NextRequest, NextResponse } from "next/server";
import { BNI_ALLOWED_LANGS } from "@/lib/nav-php-parity";

/** Same cookie/session idea as PHP `scripts/change-lang.php`, for Next-only installs. */
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") ?? "";
  const nextRaw = req.nextUrl.searchParams.get("next") ?? "/";

  if (!(BNI_ALLOWED_LANGS as readonly string[]).includes(lang)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const safeNext =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

  const res = NextResponse.redirect(new URL(safeNext, req.url));
  res.cookies.set("bni_lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
