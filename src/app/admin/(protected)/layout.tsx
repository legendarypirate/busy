import "@/styles/platform-home-panels.css";
import { connection } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import type { PlatformRole } from "@prisma/client";
import {
  enforceAdminPathAllowedForRole,
  filterAdminNavForRole,
} from "@/lib/admin-access";
import { getAdminLoginNextPath, requireAdminUser } from "@/lib/admin-session";
import AdminSessionStorage from "@/components/admin/AdminSessionStorage";
import AdminChromeClient from "@/components/admin/AdminChromeClient";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await connection();
  noStore();
  const h = await headers();
  const pathname = getAdminLoginNextPath(h);
  const user = await requireAdminUser(pathname);
  enforceAdminPathAllowedForRole(user.role as PlatformRole, pathname);

  const accountIdStr = user.id.toString();
  const userName = user.displayName || user.email;
  const { main: navMain, bni: navBni, showBniHeader } = filterAdminNavForRole(user.role as PlatformRole);

  return (
    <>
      <link rel="stylesheet" href="/assets/css/admin-bni-php.css" />
      <AdminSessionStorage accountIdStr={accountIdStr} />
      <AdminChromeClient
        userName={userName}
        userEmail={user.email}
        navMain={navMain}
        navBni={navBni}
        showBniHeader={showBniHeader}
      >
        {children}
      </AdminChromeClient>
    </>
  );
}
