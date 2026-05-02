import { prisma } from "@/lib/prisma";
import { getDeploymentSessionSummary } from "@/lib/deployment-session-summary";

export const metadata = { title: "Footer / Site тохиргоо | Админ" };

export default async function AdminSettingsPage() {
  const cfg = getDeploymentSessionSummary();
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

      <div className="card mb-4">
        <div className="card-header fw-semibold">Орчны тохиргоо (нууцгүй)</div>
        <div className="card-body small">
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
              <strong>DATABASE_URL</strong>: {cfg.databaseUrlConfigured ? "тохируулсан" : <em className="text-danger">байхгүй</em>}
            </li>
          </ul>
          <p className="text-muted mb-0 mt-3 small">
            nginx: <code>proxy_set_header Host $host;</code>, <code>X-Forwarded-Proto $scheme;</code> — session cookie
            алдагдах үед эхлээд эдгээрийг шалгана уу.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header fw-semibold">site_settings</div>
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
                  settings.map((s) => (
                    <tr key={s.settingName}>
                      <td className="small text-break">{s.settingName}</td>
                      <td className="small text-muted text-break" style={{ maxWidth: "32rem" }}>
                        {(s.settingValue ?? "").length > 200
                          ? `${(s.settingValue ?? "").slice(0, 200)}…`
                          : (s.settingValue ?? "—")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer small text-muted">
          Утга засах формыг дараагийн алхамтай нэмнэ (PHP <code>settings.php</code> parity).
        </div>
      </div>
    </div>
  );
}
