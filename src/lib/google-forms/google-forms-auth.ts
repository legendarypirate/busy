import { JWT, OAuth2Client } from "google-auth-library";

const FORMS_SCOPE_READONLY = "https://www.googleapis.com/auth/forms.body.readonly";

export type GoogleFormsAuthResult = {
  token: string;
  /** Service account email for "share form with…"; null when using OAuth (share with the consenting Google user). */
  shareHint: string | null;
  authMode: "oauth" | "service_account";
};

function parseOAuthClientBlock(raw: string): { clientId: string; clientSecret: string } | null {
  try {
    const j = JSON.parse(raw) as {
      installed?: { client_id?: string; client_secret?: string };
      web?: { client_id?: string; client_secret?: string };
    };
    const b = j.installed ?? j.web;
    const clientId = b?.client_id?.trim();
    const clientSecret = b?.client_secret?.trim();
    if (clientId && clientSecret) return { clientId, clientSecret };
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Access token for Google Forms API v1.
 * Priority: OAuth (refresh token + client) → service account JSON (legacy).
 */
export async function getGoogleFormsAccessToken(): Promise<GoogleFormsAuthResult> {
  const refresh = process.env.GOOGLE_FORMS_OAUTH_REFRESH_TOKEN?.trim();
  const clientJson = process.env.GOOGLE_FORMS_OAUTH_CLIENT_JSON?.trim();
  let clientId = process.env.GOOGLE_FORMS_OAUTH_CLIENT_ID?.trim();
  let clientSecret = process.env.GOOGLE_FORMS_OAUTH_CLIENT_SECRET?.trim();

  if ((!clientId || !clientSecret) && clientJson) {
    const parsed = parseOAuthClientBlock(clientJson);
    if (parsed) {
      clientId = clientId || parsed.clientId;
      clientSecret = clientSecret || parsed.clientSecret;
    }
  }

  if (refresh && clientId && clientSecret) {
    const redirectUri =
      process.env.GOOGLE_FORMS_OAUTH_REDIRECT_URI?.trim() || "http://localhost:3333/oauth2callback";
    const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2.setCredentials({ refresh_token: refresh });
    let tok: string | null | undefined;
    try {
      const res = await oauth2.getAccessToken();
      tok = typeof res === "string" ? res : res?.token;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const e = new Error(msg.includes("invalid_grant") ? "OAUTH_INVALID_GRANT" : `OAUTH_TOKEN: ${msg}`);
      (e as Error & { code?: string }).code = "OAUTH_REFRESH_FAILED";
      throw e;
    }
    const token = tok;
    if (!token) {
      const e = new Error("NO_ACCESS_TOKEN");
      (e as Error & { code?: string }).code = "NO_ACCESS_TOKEN";
      throw e;
    }
    return { token, shareHint: null, authMode: "oauth" };
  }

  const raw = process.env.GOOGLE_FORMS_IMPORT_SA_JSON?.trim();
  if (!raw) {
    const e = new Error("NO_CREDENTIALS");
    (e as Error & { code?: string }).code = "NO_CREDENTIALS";
    throw e;
  }
  let creds: { client_email: string; private_key: string };
  try {
    creds = JSON.parse(raw) as { client_email: string; private_key: string };
  } catch {
    const e = new Error("BAD_CREDENTIALS_JSON");
    (e as Error & { code?: string }).code = "BAD_CREDENTIALS_JSON";
    throw e;
  }
  if (!creds.client_email || !creds.private_key) {
    const e = new Error("BAD_CREDENTIALS_SHAPE");
    (e as Error & { code?: string }).code = "BAD_CREDENTIALS_SHAPE";
    throw e;
  }
  const jwtClient = new JWT({
    email: creds.client_email,
    key: creds.private_key.replace(/\\n/g, "\n"),
    scopes: [FORMS_SCOPE_READONLY],
  });
  const tok = await jwtClient.getAccessToken();
  const token = typeof tok === "string" ? tok : tok?.token;
  if (!token) {
    const e = new Error("NO_ACCESS_TOKEN");
    (e as Error & { code?: string }).code = "NO_ACCESS_TOKEN";
    throw e;
  }
  return { token, shareHint: creds.client_email, authMode: "service_account" };
}
