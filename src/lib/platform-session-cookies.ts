import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

const WEEK = 60 * 60 * 24 * 7;
const secureCookie = process.env.NODE_ENV === "production";

const sessionOpts = {
  path: "/",
  maxAge: WEEK,
  sameSite: "lax" as const,
  secure: secureCookie,
};

/** Server actions / server components: mutate Next cookie store. */
export async function setPlatformSessionCookies(accountId: bigint, display: string): Promise<void> {
  const jar = await cookies();
  jar.set("bni_platform_account_id", accountId.toString(), { ...sessionOpts, httpOnly: true });
  jar.set("bni_platform_nav_display", display, { ...sessionOpts, httpOnly: false });
}

/** Route handlers: attach to redirect response. */
export function attachPlatformSessionToResponse(res: NextResponse, accountId: bigint, display: string): void {
  res.cookies.set("bni_platform_account_id", accountId.toString(), { ...sessionOpts, httpOnly: true });
  res.cookies.set("bni_platform_nav_display", display, { ...sessionOpts, httpOnly: false });
}

/** Clear session cookies (route handlers). */
export function attachClearPlatformSessionToResponse(res: NextResponse): void {
  res.cookies.set("bni_platform_account_id", "", { path: "/", maxAge: 0 });
  res.cookies.set("bni_platform_nav_display", "", { path: "/", maxAge: 0 });
}

/** Server components / server actions: clear Next cookie store. */
export async function clearPlatformSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.set("bni_platform_account_id", "", { path: "/", maxAge: 0 });
  jar.set("bni_platform_nav_display", "", { path: "/", maxAge: 0 });
}
