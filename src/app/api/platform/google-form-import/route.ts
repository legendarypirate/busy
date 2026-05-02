import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { prisma } from "@/lib/prisma";
import { extractGoogleFormIdFromUrl } from "@/lib/google-forms/extract-form-id";
import { fetchGoogleFormById, getGoogleFormsAccessToken } from "@/lib/google-forms/fetch-google-form";
import { googleFormJsonToLegacyQuestions, type LegacyRegistrationQuestion } from "@/lib/google-forms/google-form-to-legacy";

export const runtime = "nodejs";

async function assertActivePlatformUser(accountId: bigint): Promise<boolean> {
  const row = await prisma.platformAccount.findUnique({
    where: { id: accountId },
    select: { status: true },
  });
  return !!row && row.status === "active";
}

export async function POST(req: NextRequest) {
  const user = await getApiPlatformUser(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await assertActivePlatformUser(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const url = String(body.url ?? "").trim();
  const formId = extractGoogleFormIdFromUrl(url);
  if (!formId) {
    return NextResponse.json({ error: "bad_url", message: "Google Form-ын холбоосыг оруулна уу (docs.google.com/forms/...)." }, { status: 400 });
  }

  let token: string;
  let clientEmail: string;
  try {
    const t = await getGoogleFormsAccessToken();
    token = t.token;
    clientEmail = t.clientEmail;
  } catch (e) {
    const code = e instanceof Error ? (e as Error & { code?: string }).code : "";
    if (code === "NO_CREDENTIALS") {
      return NextResponse.json(
        {
          error: "not_configured",
          message:
            "Серверт GOOGLE_FORMS_IMPORT_SA_JSON тохируулаагүй байна. Service account JSON-оо .env-д нэмээд, Google Form-оо тухайн service account-ын имэйлд Viewer эрхээр хуваалцана уу.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "credentials", message: "Service account тохиргоо буруу байна." }, { status: 500 });
  }

  let formJson: unknown;
  try {
    formJson = await fetchGoogleFormById(formId, token);
  } catch (e) {
    const status = e instanceof Error ? (e as Error & { status?: number }).status : undefined;
    const bodySnip = e instanceof Error ? (e as Error & { body?: string }).body : "";
    if (status === 403 || status === 404) {
      return NextResponse.json(
        {
          error: "form_inaccessible",
          message:
            "Формыг уншиж чадсангүй. Form-ыг доорх service account руу Viewer-ээр хуваалцсан эсэхийг шалгана уу.",
          shareWithEmail: clientEmail,
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "fetch_failed", message: bodySnip?.slice(0, 200) || "Google API алдаа." },
      { status: 502 },
    );
  }

  const legacy = googleFormJsonToLegacyQuestions(formJson) as LegacyRegistrationQuestion[];
  const info = (formJson as { info?: { title?: string } })?.info;
  const formTitle = typeof info?.title === "string" ? info.title : "";

  return NextResponse.json({
    ok: true,
    formId,
    formTitle,
    legacy,
    importedCount: legacy.length,
    shareWithEmail: clientEmail,
  });
}
