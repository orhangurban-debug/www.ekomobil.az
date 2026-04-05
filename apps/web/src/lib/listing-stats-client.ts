export async function trackListingStat(listingId: string, action: "view" | "contact_click" | "test_drive_click") {
  try {
    await fetch(`/api/listings/${listingId}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
  } catch {
    // non-blocking analytics
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("listing-stat-bump", { detail: { listingId, action } }));
  }
}
