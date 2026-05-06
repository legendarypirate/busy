import { ImageResponse } from "next/og";
import { dbBusinessTrip } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export default async function Image({ params }: Props) {
  const { id } = await params;
  const tripId = parseInt(id, 10);

  let title = "BUSY.mn — Бизнес аялал";
  let sub = "Олон улсын бизнес аялал";

  if (!Number.isNaN(tripId)) {
    try {
      const trip = await dbBusinessTrip().findUnique({
        where: { id: tripId },
        select: { destination: true, startDate: true, endDate: true },
      });
      if (trip) {
        title = (trip.destination || "").trim() || title;
        const start = trip.startDate ? formatMnDate(new Date(trip.startDate)).replace(/-/g, ".") : "";
        const end = trip.endDate ? formatMnDate(new Date(trip.endDate)).replace(/-/g, ".") : "";
        sub = start && end ? `${start} — ${end}` : sub;
      }
    } catch {
      // Keep safe fallback title/sub so OG image always renders for crawlers.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background:
            "linear-gradient(135deg, #0b2149 0%, #1d4ed8 50%, #0ea5e9 100%)",
          color: "white",
          padding: "64px 72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            opacity: 0.95,
            fontWeight: 600,
          }}
        >
          {sub}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            opacity: 0.9,
            letterSpacing: 0.5,
          }}
        >
          BUSY.mn
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
