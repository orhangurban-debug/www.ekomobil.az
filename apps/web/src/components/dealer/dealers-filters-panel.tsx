"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AZERBAIJAN_CITIES } from "@/lib/car-data";

export function DealersFiltersPanel({
  initialCity,
  initialVerified
}: {
  initialCity?: string;
  initialVerified?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(initialCity ?? "Hamısı");
  const [verifiedOnly, setVerifiedOnly] = useState(Boolean(initialVerified));
  const activeCount = (city !== "Hamısı" ? 1 : 0) + (verifiedOnly ? 1 : 0);

  function apply(nextCity = city, nextVerifiedOnly = verifiedOnly) {
    const params = new URLSearchParams();
    if (nextCity && nextCity !== "Hamısı") params.set("city", nextCity);
    if (nextVerifiedOnly) params.set("verified", "1");
    const query = params.toString();
    router.push(query ? `/dealers?${query}` : "/dealers");
  }

  function reset() {
    setCity("Hamısı");
    setVerifiedOnly(false);
    setOpen(false);
    router.push("/dealers");
  }

  const panel = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Şəhər</label>
        <select
          className="input-field"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            apply(e.target.value, verifiedOnly);
          }}
        >
          <option value="Hamısı">Bütün şəhərlər</option>
          {AZERBAIJAN_CITIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={verifiedOnly}
          className="h-4 w-4 rounded accent-[#0057FF]"
          onChange={(e) => {
            setVerifiedOnly(e.target.checked);
            apply(city, e.target.checked);
          }}
        />
        Yalnız təsdiqlənmiş salonlar
      </label>

      {activeCount > 0 && (
        <button type="button" className="btn-secondary pb-2.5 text-xs" onClick={reset}>
          Sıfırla
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
          Filterlər {activeCount > 0 ? `(${activeCount})` : ""}
        </button>
      </div>

      {/* Desktop panel */}
      <div className="mb-6 hidden rounded-2xl border glass-panel border-slate-900/10 p-4 lg:block">
        {panel}
      </div>

      {/* Mobile bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-slate-900/10 bg-white px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="sticky top-0 mb-4 flex items-center justify-between border-b border-slate-900/10 bg-white pb-2">
              <h2 className="font-semibold text-slate-900">Filterlər {activeCount > 0 ? `(${activeCount})` : ""}</h2>
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-xs">Bağla</button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
