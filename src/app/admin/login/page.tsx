import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getPlatformSession } from "@/lib/platform-session";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Админ нэвтрэх | BUSY.mn",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

function safeAdminNextPath(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith("/admin") || t.startsWith("//")) return "/admin";
  return t.slice(0, 512);
}

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const nextPath = safeAdminNextPath(firstString(sp.next));
  const defaultEmail = firstString(sp.email);

  const u = await getPlatformSession();
  if (u) {
    try {
      const row = await prisma.platformAccount.findUnique({
        where: { id: u.id },
        select: { role: true, status: true },
      });
      if (row?.status === "active" && row.role === "admin") {
        redirect("/admin");
      }
    } catch {
      /* show login */
    }
  }

  return (
    <section className="bni-auth-shell">
      <div className="container">
        <div className="bni-auth-card">
          <div className="bni-auth-card-accent" aria-hidden="true" />
          <div className="bni-auth-card-inner">
            <div className="text-center mb-4">
              <div className="bni-auth-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-user-shield" />
              </div>
              <h1 className="bni-auth-title">Админ нэвтрэх</h1>
              <p className="bni-auth-lead text-muted mb-0">
                Зөвхөн <span className="fw-semibold text-body-secondary">platform</span> өгөгдлийн санд{" "}
                <span className="fw-semibold text-body-secondary">admin</span> эрхтэй дансаар нэвтэрнэ үү.
              </p>
            </div>
            <AdminLoginForm nextPath={nextPath} defaultEmail={defaultEmail} />
          </div>
        </div>
      </div>
    </section>
  );
}
