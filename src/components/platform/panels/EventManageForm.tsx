import { saveEventAction } from "@/app/platform/events-actions";

/**
 * Server Action form shell — keeps `action={saveEventAction}` in a dedicated module
 * (avoids tooling/React noise around `method` + function `action` on large panels).
 */
export default function EventManageForm({ children }: { children: React.ReactNode }) {
  return (
    <form id="eventManageForm" action={saveEventAction}>
      {children}
    </form>
  );
}
