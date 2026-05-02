import Link from "next/link";
import AdminPlaceholder from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Хэрэглэгчид | Админ" };

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Хэрэглэгчид</h1>
      <AdminPlaceholder title="Legacy PHP `users` хүснэгт">
        Энэ Next төсөлд MySQL-ийн хуучин <code>users</code> хүснэгт Prisma загварт байхгүй. Сайтын удирдлагын
        хэрэглэгчдийг одоогоор <strong>платформын данс</strong> (<code>bni_platform_accounts</code>) дээр
        удирдана.
        <div className="mt-3">
          <Link href="/admin/bni-platform-users" className="btn btn-sm btn-primary">
            Платформ хэрэглэгчид руу
          </Link>
        </div>
      </AdminPlaceholder>
    </div>
  );
}
