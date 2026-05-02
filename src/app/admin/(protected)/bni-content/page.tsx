import AdminPlaceholder from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Контент (slug) | Админ" };

export default function AdminBniContentPage() {
  return (
    <AdminPlaceholder title="Контент (slug)">
      PHP дээрх <code>bni_content_items</code> хүснэгт Prisma-д байхгүй. Schema + CRUD-ийг дараа нь нэмж, slug-based
      хуудсуудыг энд удирдана.
    </AdminPlaceholder>
  );
}
