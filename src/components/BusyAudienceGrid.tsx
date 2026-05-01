import {
  BUSY_ARCHITECTURE_RULE,
  BUSY_AUDIENCES,
  BUSY_PLATFORM_GOAL,
} from "@/lib/busy-platform-vision";
import BusyParticipantJourney from "@/components/BusyParticipantJourney";

/** Home / marketing: who BUSY serves + platform goal + **Оролцогч** journey. */
export default function BusyAudienceGrid() {
  return (
    <section className="busy-vision-audiences py-5" id="busy-audiences">
      <div className="container">
        <p className="text-center small fw-semibold text-primary mb-1">{BUSY_ARCHITECTURE_RULE}</p>
        <h2 className="h4 text-center fw-bold mb-2">BUSY.mn таван гол хэрэглэгчид үйлчилнэ</h2>
        <p className="text-center text-muted mx-auto mb-4" style={{ maxWidth: "42rem" }}>
          {BUSY_PLATFORM_GOAL}
        </p>
        <div className="row g-3">
          {BUSY_AUDIENCES.map((a) => (
            <div key={a.id} className="col-12 col-sm-6 col-lg-4">
              <div className="busy-vision-card h-100 p-3 rounded-3 border bg-white">
                <div className="d-flex align-items-start gap-3">
                  <div className="busy-vision-icon rounded-3 d-grid place-items-center flex-shrink-0">
                    <i className={a.iconClass} aria-hidden />
                  </div>
                  <div>
                    <h3 className="h6 fw-bold mb-1">{a.title}</h3>
                    <p className="small text-muted mb-0">{a.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <BusyParticipantJourney />
      </div>
    </section>
  );
}
