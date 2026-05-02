import AdminPlaceholder from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Хөрөнгө оруулалт | Админ" };

export default function AdminInvestmentStatsPage() {
  return (
    <AdminPlaceholder title="Хөрөнгө оруулалт (график)">
      PHP дээрх статистик / график хуудсыг энд шилжүүлэх хэрэгтэй. Одоогоор Postgres дээрх хөрөнгө оруулалтын хүснэгт Prisma
      загварт бүрэн холбогдоогүй бол зөвхөн энэ мэдэгдэл харагдана.
    </AdminPlaceholder>
  );
}
