import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="h3 fw-bold mb-4">Бүртгүүлэх</h1>
      <p className="text-muted small">
        Legacy <code>auth/register.php</code>-ийн урсгалыг платформын бүртгэл (<code>bni_platform_accounts</code>) руу тааруулна.
      </p>
      <Link href="/" className="btn btn-outline-secondary rounded-pill mt-3">
        Нүүр руу буцах
      </Link>
    </main>
  );
}
