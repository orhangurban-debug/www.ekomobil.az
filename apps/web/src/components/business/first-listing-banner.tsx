import Link from "next/link";

export function FirstListingBanner({
  businessType,
  show
}: {
  businessType: "salon" | "magaza";
  show: boolean;
}) {
  if (!show) return null;

  const isSalon = businessType === "salon";
  const href = isSalon ? "/publish" : "/parts/publish";
  const panelHref = isSalon ? "/dealer" : "/parts/store";
  const emoji = isSalon ? "🚗" : "📦";
  const title = isSalon ? "Salon hesabınız aktivdir" : "Mağaza hesabınız aktivdir";
  const subtitle = isSalon
    ? "İlk avtomobil elanınızı əlavə edin — admin yoxlamasından sonra siyahıda görünəcək."
    : "İlk hissə elanınızı (SKU) əlavə edin — admin yoxlamasından sonra mağaza kataloqunda görünəcək.";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-semibold text-emerald-900">{title}</p>
          <p className="mt-0.5 text-sm text-emerald-800">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={href}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          İlk elanınızı əlavə edin
        </Link>
        <Link
          href={panelHref}
          className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
        >
          Panelə keç
        </Link>
      </div>
    </div>
  );
}
