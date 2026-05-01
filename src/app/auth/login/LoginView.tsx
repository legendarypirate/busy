import Link from "next/link";
import { BUSY_ARCHITECTURE_RULE, BUSY_MISSION_LINES, BUSY_PLATFORM_GOAL } from "@/lib/busy-platform-vision";
import LoginForm from "./LoginForm";

const OAUTH_ERROR_COPY: Record<string, string> = {
  google_config:
    "Google нэвтрэлтийн тохиргоо дутуу. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET болон Google Console дээр redirect URI (жишээ нь …/api/auth/google/callback) тохируулна уу.",
  google_state: "Google нэвтрэлтийн state буруу байна. Дахин оролдоно уу.",
  google_denied: "Google нэвтрэлт цуцлагдсан.",
  google_code: "Google-аас баталгаажуулах код ирсэнгүй.",
  google_token: "Google token авахад алдаа гарлаа.",
  google_profile: "Google хэрэглэгчийн мэдээлэл авахад алдаа гарлаа.",
  google_email: "Google профайлд имэйл байхгүй байна.",
  google_db: "Өгөгдлийн санд бүртгэл хадгалахад алдаа гарлаа.",
  google_env_db:
    "Өгөгдлийн сангийн холболт (DATABASE_URL) тохируулаагүй байна. Төслийн үндсэн хавтас дахь .env файлд DATABASE_URL нэмээд dev серверээ дахин асаана уу.",
};

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

async function resolveSearchParams(raw: SearchParamsInput): Promise<Record<string, string | string[] | undefined>> {
  if (raw != null && typeof (raw as Promise<unknown>).then === "function") {
    return ((await raw) as Record<string, string | string[] | undefined>) ?? {};
  }
  return (raw as Record<string, string | string[] | undefined>) ?? {};
}

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function LoginView({ searchParams }: { searchParams: SearchParamsInput }) {
  const sp = await resolveSearchParams(searchParams);
  const rawNext = firstString(sp.next);
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext.slice(0, 512) : "/";
  const defaultEmail = firstString(sp.email);

  const legacyRaw = process.env.NEXT_PUBLIC_LEGACY_SITE_URL?.trim() ?? "";
  const legacyBase = legacyRaw ? legacyRaw.replace(/\/$/, "") : null;

  const nextGoogleReady =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) && Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  const dbReady = Boolean(process.env.DATABASE_URL?.trim());

  const nextGoogleHref =
    nextGoogleReady && dbReady
      ? `/api/auth/google${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`
      : null;
  const legacyGoogleHref = legacyBase ? `${legacyBase}/auth/google-start.php` : null;
  const googleHref = nextGoogleHref ?? legacyGoogleHref;

  const errKey = firstString(sp.error);
  const oauthMessage = errKey && OAUTH_ERROR_COPY[errKey] ? OAUTH_ERROR_COPY[errKey] : null;
  const oauthDetailRaw = firstString(sp.detail);
  const oauthDetail = oauthDetailRaw ? oauthDetailRaw : null;

  return (
    <section className="bni-auth-shell">
      <div className="container">
        <div className="bni-auth-card">
          <div className="bni-auth-card-accent" aria-hidden="true" />
          <div className="bni-auth-card-inner">
            <div className="text-center mb-4">
              <div className="bni-auth-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-right-to-bracket" />
              </div>
              <h1 className="bni-auth-title">Платформд нэвтрэх</h1>
              <p className="bni-auth-lead text-muted mb-1">Имэйл, нууц үг эсвэл Google ашиглан нэвтэрнэ үү.</p>
              <p className="small text-muted text-center mb-0 px-1" style={{ lineHeight: 1.45 }}>
                <span className="d-block fw-semibold text-body-secondary">{BUSY_MISSION_LINES.join(" ")}</span>
                <span className="d-block mt-1">{BUSY_ARCHITECTURE_RULE}</span>
                <span className="d-block mt-1">{BUSY_PLATFORM_GOAL}</span>
                <Link href="/#busy-participant-journey" className="d-block mt-2 small text-primary">
                  Оролцогчийн замнал (нүүр → follow-up)
                </Link>
              </p>
            </div>
            {oauthMessage ? (
              <div className="alert alert-danger bni-auth-alert mb-4" role="alert">
                {oauthMessage}
                {oauthDetail && errKey === "google_denied" ? (
                  <span className="d-block small mt-1 text-break">{oauthDetail}</span>
                ) : null}
              </div>
            ) : null}
            <LoginForm
              nextPath={nextPath}
              legacyBase={legacyBase}
              googleHref={googleHref}
              defaultEmail={defaultEmail}
            />
            <div className="text-center mt-3">
              <Link href="/" className="small text-decoration-none text-muted">
                <i className="fas fa-arrow-left me-1" aria-hidden="true" />
                Нүүр руу буцах
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
