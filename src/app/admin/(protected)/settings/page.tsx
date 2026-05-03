import { prisma } from "@/lib/prisma";
import { getDeploymentSessionSummary } from "@/lib/deployment-session-summary";
import { FOOTER_PUBLIC_JSON_KEY, getFooterPublicConfig } from "@/lib/footer-public-config";
import { FooterSettingsForm } from "./FooterSettingsForm";

export const metadata = { title: "Footer / Site тохиргоо | Админ" };

type Props = { searchParams: Promise<{ saved?: string; reset?: string }> };

export default async function AdminSettingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cfg = getDeploymentSessionSummary();
  const footerCfg = await getFooterPublicConfig();

  let settings: { settingName: string; settingValue: string | null }[] = [];
  try {
    settings = await prisma.siteSetting.findMany({
      orderBy: { settingName: "asc" },
      take: 500,
      select: { settingName: true, settingValue: true },
    });
  } catch {
    /* */
  }

  return (
    <div>
      <h1 className="h4 fw-bold mb-4">Footer / Site тохиргоо</h1>

      {sp.saved === "1" ? (
        <div className="alert alert-success py-2 small mb-3" role="status">
          Footer тохиргоо хадгалагдлаа.
        </div>
      ) : null}
      {sp.reset === "1" ? (
        <div className="alert alert-warning py-2 small mb-3" role="status">
          Footer үндсэн утгад сэргээгдлээ.
        </div>
      ) : null}

      <FooterSettingsForm cfg={footerCfg} />

      <details className="card mb-4">
        <summary className="card-header fw-semibold user-select-none" style={{ cursor: "pointer" }}>
          Орчны тохиргоо (нууцгүй, заавал биш)
        </summary>
        <div className="card-body small border-top">
          <ul className="list-unstyled mb-0" style={{ lineHeight: 1.75 }}>
            <li>
              <strong>NODE_ENV</strong>: {cfg.nodeEnv}
            </li>
            <li>
              <strong>NEXT_PUBLIC_APP_URL</strong>: {cfg.nextPublicAppUrl ?? <em className="text-danger">тохируулаагүй</em>}
            </li>
            <li>
              <strong>HTTPS URL</strong>: {cfg.nextPublicAppUrlLooksHttps ? "тийм" : "үгүй"}
            </li>
            <li>
              <strong>PLATFORM_SESSION_COOKIE_DOMAIN</strong>: {cfg.platformSessionCookieDomain ?? <em>хоосон</em>}
            </li>
            <li>
              <strong>Secure cookie</strong>: {cfg.secureCookiesExpected ? "тийм" : "үгүй"}
            </li>
            <li>
              <strong>DATABASE_URL</strong>:{" "}
              {cfg.databaseUrlConfigured ? "тохируулсан" : <em className="text-danger">байхгүй</em>}
            </li>
          </ul>
          <p className="text-muted mb-0 mt-3 small">
            nginx: <code>proxy_set_header Host $host;</code>, <code>X-Forwarded-Proto $scheme;</code> — session cookie
            алдагдах үед эхлээд эдгээрийг шалгана уу.
          </p>
        </div>
      </details>

      <div className="card">
        <div className="card-header fw-semibold">site_settings (бүх түлхүүр)</div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead>
                <tr>
                  <th>Түлхүүр</th>
                  <th>Утга (товчлох)</th>
                </tr>
              </thead>
              <tbody>
                {settings.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-muted px-3 py-3">
                      Мөр байхгүй эсвэл хүснэгт холбогдоогүй.
                    </td>
                  </tr>
                ) : (
                  settings.map((s) => {
                    const isFooterJson = s.settingName === FOOTER_PUBLIC_JSON_KEY;
                    const display =
                      isFooterJson && (s.settingValue?.length ?? 0) > 200
                        ? `${(s.settingValue ?? "").slice(0, 200)}… (Footer картаас засварлана)`
                        : (s.settingValue ?? "").length > 200
                          ? `${(s.settingValue ?? "").slice(0, 200)}…`
                          : (s.settingValue ?? "—");
                    return (
                      <tr key={s.settingName}>
                        <td className="small text-break">{s.settingName}</td>
                        <td className="small text-muted text-break" style={{ maxWidth: "32rem" }}>
                          {display}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer small text-muted">
          Footer-ийн JSON-ыг дээрх «Нийтийн footer» картаас засварлана.
        </div>
      </div>
    </div>
  );
}
