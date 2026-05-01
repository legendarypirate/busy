import { redirect } from "next/navigation";
import MediaHeroShell from "@/components/platform/panels/MediaHeroShell";
import { mediaUrl } from "@/lib/media-url";
import { getPlatformSession } from "@/lib/platform-session";
import { prisma } from "@/lib/prisma";

function heroSlidesFromBiz(json: unknown): string[] {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return [];
  }
  const raw = (json as Record<string, unknown>).hero_slides;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((u): u is string => typeof u === "string").map((u) => mediaUrl(u));
}

export default async function MediaPanel() {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/media");
  }

  const profile = await prisma.platformProfile.findUnique({
    where: { accountId: session.id },
    select: { businessJson: true },
  });

  const slides = heroSlidesFromBiz(profile?.businessJson ?? null);

  return <MediaHeroShell slides={slides} />;
}
