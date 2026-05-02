/** Extract Google Form document id from common share URLs. */
export function extractGoogleFormIdFromUrl(raw: string): string | null {
  const u = raw.trim();
  if (!u) return null;
  try {
    const url = new URL(u, "https://docs.google.com");
    const path = url.pathname;
    const m = path.match(/\/forms\/d\/(?:e\/)?([^/]+)/);
    if (m?.[1]) return m[1];
    return null;
  } catch {
    return null;
  }
}
