function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/**
 * Platform session cookie + signed post-token TTL (days).
 * Override with `PLATFORM_SESSION_MAX_DAYS` (integer 1–30). Default **3**.
 */
export function platformSessionMaxDays(): number {
  const raw = process.env.PLATFORM_SESSION_MAX_DAYS?.trim();
  if (!raw) return 3;
  const n = Number.parseInt(raw, 10);
  return clampInt(n, 1, 30);
}

export function platformSessionMaxAgeSeconds(): number {
  return platformSessionMaxDays() * 24 * 60 * 60;
}
