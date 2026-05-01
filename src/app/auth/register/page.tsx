import Link from "next/link";
import type { Metadata } from "next";
import { BUSY_PLATFORM_GOAL } from "@/lib/busy-platform-vision";

export const metadata: Metadata = {
  title: "Бүртгүүлэх | BUSY.mn",
  description: "Платформын данс нээх заавар",
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
  const loginHref = `/auth/login${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

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
                Платформын данс нээгдсэнээр та аялал, хурал, эвент зохион байгуулах болон бүртгэлээ нэг дор удирдах
                боломжтой.
              </p>
            </div>

            <div className="text-start small text-muted mb-4" style={{ lineHeight: 1.55 }}>
              <p className="mb-3">
                <span className="fw-semibold text-body-secondary">Шинээр эхэлж байна уу?</span>{" "}
                <Link href={loginHref} className="fw-semibold text-primary text-decoration-none">
                  Нэвтрэх
                </Link>{" "}
                хуудас руу орж, <span className="fw-semibold text-body-secondary">Google-р нэвтрэх</span> товчийг дарна уу.
                Имэйлээр баталгаажсан данс автоматаар үүснэ.
              </p>
              <p className="mb-0">
                <span className="fw-semibold text-body-secondary">Нууц үгтэй данс</span> танд олгогдсон бол мөн
                нэвтрэх хуудаас имэйл болон нууцаа ашиглана уу.
              </p>
            </div>

            <p className="small text-muted text-center mb-4 px-1" style={{ lineHeight: 1.45 }}>
              {BUSY_PLATFORM_GOAL}
            </p>

            <div className="d-grid gap-2">
              <Link href={loginHref} className="btn btn-primary rounded-pill py-2 fw-semibold">
                Нэвтрэх хуудас руу орох
              </Link>
              <Link href="/" className="btn btn-outline-secondary rounded-pill py-2">
                Нүүр руу буцах
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
