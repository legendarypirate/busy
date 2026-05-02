import { saveEventAction } from "@/app/platform/events-actions";
import PlatformPostTokenHidden from "@/components/platform/PlatformPostTokenHidden";

/**
 * Server Action form shell — keeps `action={saveEventAction}` in a dedicated module
 * (avoids tooling/React noise around `method` + function `action` on large panels).
 */
export default function EventManageForm({
  children,
  postToken,
}: {
  children: React.ReactNode;
  postToken: string | null;
}) {
  return (
    <form id="eventManageForm" action={saveEventAction}>
      <PlatformPostTokenHidden token={postToken} />
      {children}
    </form>
  );
}
