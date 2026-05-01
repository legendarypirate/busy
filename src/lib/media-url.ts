/**
 * Legacy uploads / CDN URLs. Set NEXT_PUBLIC_MEDIA_BASE to match PHP UPLOAD base or Cloudinary prefix.
 */
export function mediaUrl(path: string | null | undefined): string {
  const p = (path ?? "").trim();
  if (!p) {
    return "";
  }
  if (/^https?:\/\//i.test(p)) {
    return p;
  }
  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").replace(/\/$/, "");
  if (!base) {
    return p.startsWith("/") ? p : `/${p}`;
  }
  return `${base}/${p.replace(/^\//, "")}`;
}
