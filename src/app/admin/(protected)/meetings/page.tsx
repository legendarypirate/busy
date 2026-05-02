import "@/styles/platform-home-panels.css";
import { connection } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import EventsPanel from "@/components/platform/panels/EventsPanel";

export const metadata = { title: "Хурал, эвент | Админ" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminMeetingsPage({ searchParams }: Props) {
  await connection();
  noStore();
  const sp = await searchParams;
  return (
    <div>
      <div className="mb-4">
        <h1 className="h4 fw-bold mb-1">Хурал ба эвент</h1>
        <p className="text-muted small mb-2">
          BNI хурал, эвент үүсгэх / засах — платформын{" "}
          <Link href="/platform/events" className="text-decoration-none">
            «Хурал / Эвент»
          </Link>{" "}
          хэсэгтэй ижил форм. <strong>Бизнес аяллаас тусдаа</strong> (зөвхөн chapter-той холбоотой эвентүүд).
        </p>
      </div>
      <EventsPanel searchParams={sp} venue="admin" />
    </div>
  );
}
