import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bniEventPublicListSelect } from "@/lib/prisma-event-select";

/** Public list: upcoming events (same idea as legacy `events.php`). Trips-style: degrade to empty on DB errors. */
export async function GET() {
  const events = await prisma.bniEvent
    .findMany({
      take: 80,
      orderBy: { startsAt: "asc" },
      where: { endsAt: { gte: new Date() } },
      select: bniEventPublicListSelect,
    })
    .catch(() => []);

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id.toString(),
      title: e.title,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      eventType: e.eventType,
      chapterName: e.chapter.name,
      chapterSlug: e.chapter.slug,
      regionName: e.chapter.region.name,
    })),
  });
}
