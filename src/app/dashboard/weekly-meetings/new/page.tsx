import type { Metadata } from "next";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import CreateWeeklyMeetingForm from "@/components/weekly-meeting/CreateWeeklyMeetingForm";

export const metadata: Metadata = {
  title: "7 хоногийн хурал үүсгэх | BUSY.mn",
};

export default function NewWeeklyMeetingPage() {
  return (
    <DashboardPage maxWidthClass="max-w-5xl">
      <DashboardBreadcrumb
        className="mb-3"
        items={[
          { label: "7 хоногийн хурал", href: "/dashboard/weekly-meetings" },
          { label: "Шинэ" },
        ]}
      />
      <CreateWeeklyMeetingForm />
    </DashboardPage>
  );
}
