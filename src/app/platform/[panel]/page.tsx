import { redirect } from "next/navigation";
import { PLATFORM_PANEL_SLUGS } from "@/components/platform/platform-nav";
import JobsPlatformPanel from "@/components/platform/panels/JobsPlatformPanel";
import MediaPanel from "@/components/platform/panels/MediaPanel";
import NewsPlatformPanel from "@/components/platform/panels/NewsPlatformPanel";
import OpportunitiesPlatformPanel from "@/components/platform/panels/OpportunitiesPlatformPanel";
import PartnersPlatformPanel from "@/components/platform/panels/PartnersPlatformPanel";
import PremiumPanel from "@/components/platform/panels/PremiumPanel";
import ProfilePanel from "@/components/platform/panels/ProfilePanel";
import ShopOrdersInPanel from "@/components/platform/panels/ShopOrdersInPanel";
import ShopOrdersOutPanel from "@/components/platform/panels/ShopOrdersOutPanel";
import ShopPlatformPanel from "@/components/platform/panels/ShopPlatformPanel";
import EventsPanel from "@/components/platform/panels/EventsPanel";
import TripsPanel from "@/components/platform/panels/TripsPanel";

type Props = {
  params: Promise<{ panel: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlatformPanelRoute({ params, searchParams }: Props) {
  const { panel } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!PLATFORM_PANEL_SLUGS.has(panel)) {
    redirect("/platform");
  }

  switch (panel) {
    case "profile":
      return <ProfilePanel />;
    case "media":
      return <MediaPanel />;
    case "premium":
      return <PremiumPanel />;
    case "partners":
      return <PartnersPlatformPanel />;
    case "shop":
      return <ShopPlatformPanel />;
    case "shop_orders_in":
      return <ShopOrdersInPanel />;
    case "shop_orders":
      return <ShopOrdersOutPanel />;
    case "news":
      return <NewsPlatformPanel />;
    case "jobs":
      return <JobsPlatformPanel />;
    case "opportunities":
      return <OpportunitiesPlatformPanel />;
    case "events":
      return <EventsPanel searchParams={sp} />;
    case "trips":
      return <TripsPanel searchParams={sp} />;
    default:
      redirect("/platform");
  }
}
