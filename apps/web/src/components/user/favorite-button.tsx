"use client";

import { useState } from "react";

export function FavoriteButton({
  listingId,
  initialFavorited = false
}: {
  listingId: string;
  initialFavorited?: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function onToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);
    const response = await fetch("/api/user/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId })
    });
    if (response.ok) {
      const payload = (await response.json()) as { favorited: boolean };
      setFavorited(payload.favorited);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:text-red-500"
      aria-label="favorite"
    >
      <svg className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.071 3.298a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.298c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.298a1 1 0 00-.363-1.118L2.98 8.725c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.298z" />
      </svg>
    </button>
  );
}
