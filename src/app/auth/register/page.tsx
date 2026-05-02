import Link from "next/link";
import type { Metadata } from "next";
import { BUSY_PLATFORM_GOAL } from "@/lib/busy-platform-vision";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Бүртгүүлэх | BUSY.mn",
  description: "Имэйл, нууц үгээр платформын данс нээх",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const rawNext = firstString(sp.next);
  const nextPath =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext.slice(0, 512) : "/";

  const nextGoogleReady =
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) && Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  const dbReady = Boolean(process.env.DATABASE_URL?.trim());

  const nextGoogleHref =
    nextGoogleReady && dbReady
      ? `/api/auth/google${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`
      : null;
  const legacyRaw = process.env.NEXT_PUBLIC_LEGACY_SITE_URL?.trim() ?? "";
  const legacyBase = legacyRaw ? legacyRaw.replace(/\/$/, "") : null;
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const legacyGoogleHref =
    legacyBase && nextPath !== "/" && appOrigin
      ? `${legacyBase}/auth/google-start.php?next=${encodeURIComponent(`${appOrigin}${nextPath}`)}`
      : legacyBase
        ? `${legacyBase}/auth/google-start.php`
        : null;
  const googleHref = nextGoogleHref ?? legacyGoogleHref;

  return (
    <section className="bni-auth-shell">
      <div className="container">
        <div className="bni-auth-card">
          <div className="bni-auth-card-accent" aria-hidden="true" />
          <div className="bni-auth-card-inner">
            <div className="text-center mb-4">
              <div className="bni-auth-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-user-plus" />
              </div>
              <h1 className="bni-auth-title">Бүртгүүлэх</h1>
              <p className="bni-auth-lead text-muted mb-0">
                Имэйл, нууц үгээр платформын дансаа үүсгээд аялал, хурал, эвент зохион байгуулах болон бүртгэлээ нэг дор
                удирдана уу.
              </p>
            </div>

            <RegisterForm
              nextPath={nextPath}
              googleHref={googleHref}
              googleUsesNextPlatformOAuth={Boolean(nextGoogleHref?.startsWith("/api"))}
            />

            <p className="small text-muted text-center mt-4 mb-0 px-1" style={{ lineHeight: 1.45 }}>
              {BUSY_PLATFORM_GOAL}
            </p>

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
