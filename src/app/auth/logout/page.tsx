import { redirect } from "next/navigation";
import { clearPlatformSessionCookies } from "@/lib/platform-session-cookies";

/** Clears platform cookies (same names as login / Google callback) and returns home. */
export default async function LogoutPage() {
  await clearPlatformSessionCookies();
  redirect("/");
}
