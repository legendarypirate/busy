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
  let shareHint: string | null;
  let authMode: "oauth" | "service_account";
  try {
    const t = await getGoogleFormsAccessToken();
    token = t.token;
    shareHint = t.shareHint;
    authMode = t.authMode;
  } catch (e) {
    const code = e instanceof Error ? (e as Error & { code?: string }).code : "";
    const msg = e instanceof Error ? e.message : "";
    if (code === "NO_CREDENTIALS") {
      return NextResponse.json(
        {
          error: "not_configured",
          message:
            "Серверт Google Forms API тохиргоо байхгүй. OAuth: GOOGLE_FORMS_OAUTH_REFRESH_TOKEN + (GOOGLE_FORMS_OAUTH_CLIENT_JSON эсвэл CLIENT_ID/SECRET) + GOOGLE_FORMS_OAUTH_REDIRECT_URI (refresh token авах үед ашигласантай ижил). Эсвэл service account: GOOGLE_FORMS_IMPORT_SA_JSON. scripts/google-forms-oauth-refresh-token.cjs тайлбар үзнэ үү.",
        },
        { status: 503 },
      );
    }
    if (code === "OAUTH_REFRESH_FAILED" && msg === "OAUTH_INVALID_GRANT") {
      return NextResponse.json(
        {
          error: "credentials",
          message:
            "Refresh token хүчингүй эсвэл тохирохгүй байна. Шалгах: (1) CLIENT_ID/SECRET нь refresh token үүссэн OAuth client-той ижил эсэх, (2) GOOGLE_FORMS_OAUTH_REDIRECT_URI нь token авах үед ашигласан redirect-тай яг ижил (localhost болон 127.0.0.1 өөр!), (3) GCP-д тэр redirect URI Authorized redirect URIs-д бүртгэгдсэн эсэх. Дахин: node scripts/google-forms-oauth-refresh-token.cjs …json",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "credentials", message: "Google Forms нэвтрэх тохиргоо буруу эсвэл refresh token хүчингүй." },
      { status: 500 },
    );
  }

  let formJson: unknown;
  try {
    formJson = await fetchGoogleFormById(formId, token);
  } catch (e) {
    const status = e instanceof Error ? (e as Error & { status?: number }).status : undefined;
    const bodySnip = e instanceof Error ? (e as Error & { body?: string }).body : "";
    if (status === 403 || status === 404) {
      const oauthMsg =
        "Формыг уншиж чадсангүй. OAuth ашиглаж байгаа бол тухайн Google дансаар (consent өгсөн хэрэглэгч) формонд хандах эрхтэй эсэхийг шалгана уу (Share).";
      const saMsg = `Формыг уншиж чадсангүй. Service account руу Viewer-ээр хуваалцсан эсэхийг шалгана уу.`;
      return NextResponse.json(
        {
          error: "form_inaccessible",
          message: authMode === "oauth" ? oauthMsg : saMsg,
          ...(authMode === "service_account" && shareHint ? { shareWithEmail: shareHint } : {}),
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
    ...(authMode === "service_account" && shareHint ? { shareWithEmail: shareHint } : { authMode: "oauth" as const }),
  });
}
