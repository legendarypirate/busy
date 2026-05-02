/** Parse `Cookie` request header for a single name (RFC-style `;` separated). */
export function readCookieValueFromHeader(
  cookieHeader: string | null | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const segment of cookieHeader.split(";")) {
    const s = segment.trim();
    const eq = s.indexOf("=");
    if (eq <= 0) continue;
    const key = s.slice(0, eq).trim();
    if (key !== name) continue;
    const val = s.slice(eq + 1).trim();
    if (!val) return undefined;
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  }
  return undefined;
}
