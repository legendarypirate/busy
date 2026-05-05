"use client";

type Props = {
  action: (formData: FormData) => Promise<void>;
  tripId: number;
  destination: string;
  /** Icon-only, fits tight action row in admin trip list */
  compact?: boolean;
};

export default function AdminTripDeleteButton({ action, tripId, destination, compact = false }: Props) {
  return (
    <form action={action} className={compact ? "m-0 d-inline-flex align-self-stretch" : "d-inline"}>
      <input type="hidden" name="trip_id" value={tripId} />
      <button
        type="submit"
        className={`btn btn-outline-danger ${compact ? "btn-sm px-1 py-0 lh-1 h-100 rounded-0 border-0 border-start" : "btn-sm"}`}
        title="Устгах"
        aria-label="Устгах"
        onClick={(e) => {
          const label = destination.trim() || `ID ${tripId}`;
          const ok = window.confirm(
            `«${label}» аяллыг устгах уу?\n\nЭнэ үйлдлийг буцаах боломжгүй. Холбогдох бүртгэлийн форм, хариултууд устгагдана.`,
          );
          if (!ok) {
            e.preventDefault();
          }
        }}
      >
        <i className="fas fa-trash" style={compact ? { fontSize: "0.7rem" } : undefined} aria-hidden />
        {!compact ? (
          <>
            {" "}
            Устгах
          </>
        ) : null}
      </button>
    </form>
  );
}
