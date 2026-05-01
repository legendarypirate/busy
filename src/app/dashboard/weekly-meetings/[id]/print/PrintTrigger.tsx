"use client";

export default function PrintTrigger() {
  return (
    <button type="button" className="btn btn-sm btn-primary" onClick={() => window.print()}>
      Хэвлэх
    </button>
  );
}
