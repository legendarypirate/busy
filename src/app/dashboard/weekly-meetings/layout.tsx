import { connection } from "next/server";
import { redirect } from "next/navigation";
import WeeklyMeetingShell from "@/components/weekly-meeting/WeeklyMeetingShell";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";

export default async function WeeklyMeetingsAuthLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getPlatformSession();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/dashboard/weekly-meetings")}`);
  }
  return <WeeklyMeetingShell>{children}</WeeklyMeetingShell>;
}
