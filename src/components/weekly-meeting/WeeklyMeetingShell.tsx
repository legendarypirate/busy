/** Scoped shell for Tailwind-based weekly-meeting UI (alongside legacy Bootstrap elsewhere). */
export default function WeeklyMeetingShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-0 font-sans text-slate-900 antialiased">{children}</div>;
}
