"use client";

type Props = {
  action: (formData: FormData) => Promise<void>;
  tripId: number;
  destination: string;
};

export default function AdminTripDeleteButton({ action, tripId, destination }: Props) {
  return (
    <form action={action} className="d-inline">
      <input type="hidden" name="trip_id" value={tripId} />
      <button
        type="submit"
        className="btn btn-sm btn-outline-danger"
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
        <i className="fas fa-trash me-1" aria-hidden />
        Устгах
      </button>
    </form>
  );
}
