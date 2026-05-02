export { getGoogleFormsAccessToken } from "@/lib/google-forms/google-forms-auth";

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
