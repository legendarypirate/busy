/**
 * Build an HTTP `Content-Disposition` header value that is safe for non-ASCII
 * filenames (e.g. Mongolian / Cyrillic destinations). Node.js refuses to put
 * raw non-ISO-8859-1 characters in HTTP headers (`ERR_INVALID_CHAR`), so we
 * provide:
 *   - an ASCII fallback `filename="..."` (with non-ASCII chars stripped)
 *   - a UTF-8 encoded `filename*=UTF-8''...` (RFC 5987) for modern browsers
 */
export function buildContentDispositionAttachment(filename: string): string {
  const safeName = (filename || "download").replace(/["\\\r\n]/g, "_");
  // Browsers (incl. Excel on Windows) will prefer `filename*` when present.
  const ascii = safeName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    || "download";
  const encoded = encodeURIComponent(safeName).replace(/['()]/g, escape).replace(/\*/g, "%2A");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
