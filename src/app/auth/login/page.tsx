import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Нэвтрэх | BUSY.mn",
  description: "Платформд нэвтрэх",
};

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

type SearchParams = Promise<{ next?: string; email?: string; error?: string; detail?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rawNext = sp.next ?? "";
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext.slice(0, 512) : "/";
  const defaultEmail = typeof sp.email === "string" ? sp.email : "";

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

  const errKey = typeof sp.error === "string" ? sp.error : "";
  const oauthMessage = errKey && OAUTH_ERROR_COPY[errKey] ? OAUTH_ERROR_COPY[errKey] : null;
  const oauthDetail = typeof sp.detail === "string" && sp.detail ? sp.detail : null;

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
              <p className="bni-auth-lead text-muted mb-0">Имэйл, нууц үг эсвэл Google ашиглан нэвтэрнэ үү.</p>
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
