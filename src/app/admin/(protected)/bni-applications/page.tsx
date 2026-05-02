import AdminPlaceholder from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Өргөдөл | Админ" };

export default function AdminBniApplicationsPage() {
  return (
    <AdminPlaceholder title="Өргөдөл (bni_applications)">
      Энэ өгөгдлийн сангийн Prisma загвар одоогоор төсөлд нэмэгдээгүй байна. Хүснэгтийг импортлоод модель нэмсний дараа
      жагсаалт / төлөв шинэчлэлтийг энд холбоно.
    </AdminPlaceholder>
  );
}
