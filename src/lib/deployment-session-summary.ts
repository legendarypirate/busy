/**
 * Safe, non-secret snapshot for the admin “session / deployment” panel.
 * Runs only on the server.
 */
export type DeploymentSessionSummary = {
  nodeEnv: string;
  nextPublicAppUrl: string | null;
  nextPublicAppUrlLooksHttps: boolean;
  nextPublicAppUrlHost: string | null;
  platformSessionCookieDomain: string | null;
  secureCookiesExpected: boolean;
  databaseUrlConfigured: boolean;
};

function hostFromPublicUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.hostname || null;
  } catch {
    return null;
  }
}

export function getDeploymentSessionSummary(): DeploymentSessionSummary {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || null;
  const domainRaw = process.env.PLATFORM_SESSION_COOKIE_DOMAIN?.trim() || null;

  const secureCookiesExpected =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    Boolean(publicUrl?.startsWith("https://"));

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    nextPublicAppUrl: publicUrl,
    nextPublicAppUrlLooksHttps: Boolean(publicUrl?.startsWith("https://")),
    nextPublicAppUrlHost: hostFromPublicUrl(publicUrl),
    platformSessionCookieDomain: domainRaw && !domainRaw.includes("://") ? domainRaw : null,
    secureCookiesExpected,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL?.trim()),
  };
}
