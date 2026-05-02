import { JWT } from "google-auth-library";

export async function getGoogleFormsAccessToken(): Promise<{ token: string; clientEmail: string }> {
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
    scopes: ["https://www.googleapis.com/auth/forms.body.readonly"],
  });
  const tok = await jwtClient.getAccessToken();
  const token = typeof tok === "string" ? tok : tok?.token;
  if (!token) {
    const e = new Error("NO_ACCESS_TOKEN");
    (e as Error & { code?: string }).code = "NO_ACCESS_TOKEN";
    throw e;
  }
  return { token, clientEmail: creds.client_email };
}

export async function fetchGoogleFormById(formId: string, accessToken: string): Promise<unknown> {
  const url = `https://forms.googleapis.com/v1/forms/${encodeURIComponent(formId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    const e = new Error(`FORMS_HTTP_${res.status}`);
    (e as Error & { status?: number; body?: string }).status = res.status;
    (e as Error & { body?: string }).body = text.slice(0, 800);
    throw e;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const err = new Error("FORMS_INVALID_JSON");
    throw err;
  }
}
