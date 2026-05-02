import "@/styles/platform-home-panels.css";
import { connection } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import PlatformBodyClass from "@/components/platform/PlatformBodyClass";
import PlatformSidebar from "@/components/platform/PlatformSidebar";
import PlatformTopNav from "@/components/platform/PlatformTopNav";
import { getPlatformLoginNextPath, requirePlatformUser } from "@/lib/platform-session";

/** Session + `cookies()` must not be served from segment/prefetch cache without the real request. */
export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  noStore();
  const h = await headers();
  const user = await requirePlatformUser(getPlatformLoginNextPath(h));

  return (
    <>
      <PlatformBodyClass />
      <div className="pl-wrapper">
        <PlatformSidebar />
        <main className="pl-content">
          <PlatformTopNav displayName={user.displayName} photoUrl={user.photoUrl} />
          <div className="pl-panel-container">{children}</div>
        </main>
      </div>
    </>
  );
}
