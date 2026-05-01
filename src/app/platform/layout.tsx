import "@/styles/platform-home-panels.css";
import { headers } from "next/headers";
import PlatformBodyClass from "@/components/platform/PlatformBodyClass";
import PlatformSidebar from "@/components/platform/PlatformSidebar";
import PlatformTopNav from "@/components/platform/PlatformTopNav";
import { requirePlatformUser } from "@/lib/platform-session";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-busy-pathname")?.trim() || "/platform";
  const user = await requirePlatformUser(pathname);

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
