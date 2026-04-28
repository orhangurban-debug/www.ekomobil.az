"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary text-sm"
    >
      Çap et / PDF
    </button>
  );
}
