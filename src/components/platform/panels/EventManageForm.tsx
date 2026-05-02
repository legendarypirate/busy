import { saveEventAction } from "@/app/platform/events-actions";

/**
 * Server Action form shell — keeps `action={saveEventAction}` in a dedicated module
 * (avoids tooling/React noise around `method` + function `action` on large panels).
 */
export default function EventManageForm({
  children,
  returnContext,
}: {
  children: React.ReactNode;
  /** When set, redirects after save/delete go to `/admin/meetings` instead of `/platform/events`. */
  returnContext?: "admin";
}) {
  return (
    <form id="eventManageForm" action={saveEventAction}>
      {returnContext === "admin" ? <input type="hidden" name="return_context" value="admin" /> : null}
      {children}
    </form>
  );
}
