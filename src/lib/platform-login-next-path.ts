/**
 * Safe `next=` value when redirecting unauthenticated users away from `/platform/*`.
 * Avoids relying on middleware-injected headers (cloning request headers can break `Cookie` on hard refresh).
 */
export function getPlatformLoginNextPath(headerList: Headers): string {
  const max = 512;
  const fallback = "/platform";

  let appOrigin: string | null = null;
  const appBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appBase) {
    try {
      appOrigin = new URL(appBase).origin;
    } catch {
      appOrigin = null;
    }
  }

  const nextUrl = headerList.get("next-url")?.trim();
  if (nextUrl) {
    if (nextUrl.startsWith("/platform")) {
      return nextUrl.slice(0, max);
    }
    try {
      const u = new URL(nextUrl, appBase || undefined);
      if (!appOrigin || u.origin === appOrigin) {
        const path = u.pathname + u.search;
        if (path.startsWith("/platform")) return path.slice(0, max);
      }
    } catch {
      /* noop */
    }
  }

  const busy = headerList.get("x-busy-pathname")?.trim();
  if (busy?.startsWith("/platform")) return busy.slice(0, max);

  const referer = headerList.get("referer")?.trim();
  if (referer && appOrigin) {
    try {
      const u = new URL(referer);
      if (u.origin === appOrigin && u.pathname.startsWith("/platform")) {
        return (u.pathname + u.search).slice(0, max);
      }
    } catch {
      /* noop */
    }
  }

  return fallback;
}
