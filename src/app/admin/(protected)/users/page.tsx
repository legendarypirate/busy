import Link from "next/link";
import AdminPlaceholder from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Хэрэглэгчид | Админ" };

export default function AdminUsersPage() {
  return (
    <div>
      <AdminPlaceholder title="Хэрэглэгчид — заавар">
        <p className="mb-2">
          <strong>Аялал менежер</strong> болон <strong>эвент менежер</strong> зэрэг дансыг{" "}
          <strong>Платформ хэрэглэгчид</strong> хуудас дээр үүсгэж, эрх сонгоно (эсвэл аль хэдийн бүртгэлтэй
          хүний эрхийг тэндээс өөрчилнө).
        </p>
        <p className="text-muted small mb-0">
          Хуучин PHP <code>users</code> хүснэгт энэ төсөлд байхгүй; бүх зүйл{" "}
          <code>bni_platform_accounts</code> дээр.
        </p>
        <div className="mt-3 d-flex flex-wrap gap-2">
          <Link href="/admin/bni-platform-users" className="btn btn-sm btn-primary">
            Платформ хэрэглэгчид — шинэ хэрэглэгч + эрх
          </Link>
        </div>
      </AdminPlaceholder>
    </div>
  );
}
