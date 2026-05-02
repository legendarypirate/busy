import AdminPlaceholder from "@/components/admin/AdminPlaceholder";

export const metadata = { title: "Бидний тухай | Админ" };

export default function AdminAboutPage() {
  return (
    <AdminPlaceholder title="Бидний тухай">
      PHP <code>admin/about.php</code> дээрх контент засвар (site_settings эсвэл тусдаа slug) — дараагийн алхамтай
      энд нэгтгэгдэнэ.
    </AdminPlaceholder>
  );
}
