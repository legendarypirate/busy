import type { PlatformRole } from "@prisma/client";
import { createPlatformStaffUserAction } from "./actions";

const CREATABLE_ROLES: { value: PlatformRole; label: string }[] = [
  { value: "trip_manager", label: "trip_manager — зөвхөн аялал (trips) цэс" },
  { value: "event_manager", label: "event_manager — зөвхөн хурал/эвент (meetings) цэс" },
  { value: "visitor", label: "visitor" },
  { value: "member", label: "member" },
  { value: "director", label: "director" },
  { value: "admin", label: "admin" },
];

export default function CreateStaffUserCard({ banner }: { banner: "ok" | "invalid" | "weak_password" | "email_taken" | null }) {
  return (
    <div className="card border mb-4">
      <div className="card-body">
        <h2 className="h6 fw-bold card-title">Шинэ хэрэглэгч үүсгэх (имэйл + нууц үг + эрх)</h2>
        <p className="text-muted small mb-3">
          Одоо нэвтрэх боломжгүй хүнд шууд данс үүсгэнэ. Менежеруудыг ихэвчлэн{" "}
          <strong>trip_manager</strong> эсвэл <strong>event_manager</strong> сонгоно.
        </p>
        {banner === "ok" ? (
          <div className="alert alert-success py-2 small mb-3">Данс амжилттай үүслээ.</div>
        ) : null}
        {banner === "invalid" ? (
          <div className="alert alert-warning py-2 small mb-3">Имэйл, нууц үг, эрхийг зөв бөглөнө үү.</div>
        ) : null}
        {banner === "weak_password" ? (
          <div className="alert alert-warning py-2 small mb-3">Нууц үг хамгийн багадаа 8 тэмдэгт.</div>
        ) : null}
        {banner === "email_taken" ? (
          <div className="alert alert-danger py-2 small mb-3">Энэ имэйлээр бүртгэл аль хэдийн байна.</div>
        ) : null}
        <form action={createPlatformStaffUserAction} className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small mb-0" htmlFor="staff-email">
              Имэйл
            </label>
            <input id="staff-email" name="email" type="email" required className="form-control form-control-sm" autoComplete="off" />
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-0" htmlFor="staff-pass">
              Нууц үг
            </label>
            <input
              id="staff-pass"
              name="password"
              type="password"
              required
              minLength={8}
              className="form-control form-control-sm"
              autoComplete="new-password"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-0" htmlFor="staff-name">
              Нэр (сонголттой)
            </label>
            <input id="staff-name" name="display_name" type="text" className="form-control form-control-sm" />
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-0" htmlFor="staff-role">
              Эрх
            </label>
            <select id="staff-role" name="role" className="form-select form-select-sm" required defaultValue="trip_manager">
              {CREATABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-sm btn-success w-100">
              Үүсгэх
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
