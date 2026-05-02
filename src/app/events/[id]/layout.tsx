import type { ReactNode } from "react";

export default function EventDetailLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/assets/css/hural-event-v3.css" />
      {children}
    </>
  );
}
