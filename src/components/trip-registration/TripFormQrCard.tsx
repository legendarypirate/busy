"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  formId: string;
  publicSlug: string;
  publicUrl: string;
  isPublished: boolean;
  /** Sidebar in form builder: tighter card and smaller QR */
  compact?: boolean;
};

export default function TripFormQrCard({ formId, publicSlug, publicUrl, isPublished, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const qrSrc = `/api/forms/${encodeURIComponent(formId)}/qr`;

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const qrSize = compact ? 140 : 200;

  return (
    <Card className={compact ? "gap-0 py-4 shadow-sm" : "shadow-sm"}>
      <CardHeader className={compact ? "space-y-1 px-4 pb-2 pt-0 sm:px-5" : ""}>
        <CardTitle className={compact ? "text-xs" : "text-sm"}>QR код</CardTitle>
        <CardDescription className={compact ? "text-[11px] leading-relaxed" : ""}>
          Оролцогчид скан хийж шууд бүртгэлийн хуудас руу орох боломжтой.
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? "space-y-2.5 px-4 sm:px-5" : "space-y-4"}>
        {isPublished && publicUrl ? (
          <>
            <div className={`flex justify-center rounded-lg border bg-muted/50 ${compact ? "p-2" : "p-4"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt={`QR: ${publicSlug}`}
                width={qrSize}
                height={qrSize}
                className={`rounded-md bg-background object-contain shadow-inner ${compact ? "size-[140px]" : "size-[200px]"}`}
              />
            </div>
            <p
              className={`break-all rounded-md bg-muted/60 font-mono leading-snug text-muted-foreground ${compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]"}`}
            >
              {publicUrl}
            </p>
            <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2 sm:flex-row"}`}>
              <Button type="button" variant="outline" size={compact ? "sm" : "default"} className="w-full" onClick={() => void copyLink()}>
                {copied ? "Хуулагдлаа" : "Линк хуулах"}
              </Button>
              <Button asChild size={compact ? "sm" : "default"} className="w-full">
                <a href={qrSrc} download={`busy-qr-${publicSlug}.png`}>
                  QR татах
                </a>
              </Button>
            </div>
          </>
        ) : (
          <p
            className={`rounded-md bg-amber-50 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100 ${compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-xs"}`}
          >
            QR болон нийтийн холбоос форм <span className="font-semibold">нийтлэгдсэний дараа</span> идэвхжинэ.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
