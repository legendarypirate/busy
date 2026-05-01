import Link from "next/link";
import {
  BUSY_PARTICIPANT_JOURNEY_LEAD,
  BUSY_PARTICIPANT_JOURNEY_STEPS,
  BUSY_PARTICIPANT_JOURNEY_TITLE,
} from "@/lib/busy-platform-vision";

/** Marketing + product anchor: canonical **Оролцогч** funnel (home → follow-up). */
export default function BusyParticipantJourney() {
  return (
    <div className="busy-vision-journey mt-5 pt-4 border-top" id="busy-participant-journey">
      <div className="text-center mb-3">
        <h3 className="h5 fw-bold mb-1">{BUSY_PARTICIPANT_JOURNEY_TITLE}</h3>
        <p className="small text-muted mx-auto mb-0" style={{ maxWidth: "40rem" }}>
          {BUSY_PARTICIPANT_JOURNEY_LEAD}
        </p>
      </div>
      <ol className="busy-vision-journey-list list-unstyled mb-0 mx-auto" style={{ maxWidth: "28rem" }}>
        {BUSY_PARTICIPANT_JOURNEY_STEPS.map((step, i) => (
          <li key={step.id} className="busy-vision-journey-item">
            <div className="busy-vision-journey-step d-flex align-items-start gap-3">
              <span className="busy-vision-journey-num flex-shrink-0" aria-hidden>
                {i + 1}
              </span>
              <span className="small fw-medium text-body pt-1">{step.label}</span>
            </div>
            {i < BUSY_PARTICIPANT_JOURNEY_STEPS.length - 1 ? (
              <div className="busy-vision-journey-arrow text-center text-primary small py-1" aria-hidden>
                ↓
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="text-center small text-muted mt-4 mb-0">
        Аялал, эвентээс эхлэх:{" "}
        <Link href="/trips" className="text-primary">
          Аялал
        </Link>
        {" · "}
        <Link href="/events" className="text-primary">
          Эвент
        </Link>
        {" · "}
        <Link href="/dashboard" className="text-primary">
          Dashboard
        </Link>
      </p>
    </div>
  );
}
