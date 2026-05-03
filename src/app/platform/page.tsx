import DashboardPanel from "@/components/platform/panels/DashboardPanel";
import { loadPlatformDashboardStats } from "@/lib/platform-dashboard-stats";

export default async function PlatformDashboardPage() {
  const stats = await loadPlatformDashboardStats();
  return <DashboardPanel stats={stats} />;
}
