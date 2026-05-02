import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updatePlatformAccountRoleAction } from "./actions";

export const metadata = { title: "Платформ хэрэглэгчид | Админ" };

const ROLES: PlatformRole[] = ["visitor", "member", "director", "admin"];

export default async function AdminBniPlatformUsersPage() {
  const rows = await prisma.platformAccount.findMany({
    orderBy: { id: "desc" },
    take: 300,
    include: { profile: { select: { displayName: true, companyName: true } } },
  });

  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Платформ хэрэглэгчид</h1>
      <p className="text-muted small mb-3">
        <code>bni_platform_accounts</code> + profile. Legacy role (visitor/member/director/admin).
      </p>
      <div className="table-responsive">
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имэйл</th>
              <th>Нэр</th>
              <th>Компани</th>
              <th>Эрх</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.id)}</td>
                <td className="small">{r.email}</td>
                <td>{r.profile?.displayName?.trim() || "—"}</td>
                <td className="small">{r.profile?.companyName?.trim() || "—"}</td>
                <td className="p-1">
                  <form action={updatePlatformAccountRoleAction} className="d-flex gap-2 align-items-center flex-wrap">
                    <input type="hidden" name="account_id" value={String(r.id)} />
                    <select name="role" className="form-select form-select-sm" defaultValue={r.role} style={{ maxWidth: "10rem" }}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-sm btn-primary">
                      Хадгалах
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
