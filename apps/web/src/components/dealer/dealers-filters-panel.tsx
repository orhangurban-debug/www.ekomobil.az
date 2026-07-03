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
  const [city, setCity] = useState(initialCity ?? "Hamısı");
  const [verifiedOnly, setVerifiedOnly] = useState(Boolean(initialVerified));

  function apply(nextCity = city, nextVerifiedOnly = verifiedOnly) {
    const params = new URLSearchParams();
    if (nextCity && nextCity !== "Hamısı") params.set("city", nextCity);
    if (nextVerifiedOnly) params.set("verified", "1");
    const query = params.toString();
    router.push(query ? `/dealers?${query}` : "/dealers");
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border glass-panel border-slate-900/10 p-4">
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

      {(city !== "Hamısı" || verifiedOnly) && (
        <button
          type="button"
          className="btn-secondary pb-2.5 text-xs"
          onClick={() => {
            setCity("Hamısı");
            setVerifiedOnly(false);
            router.push("/dealers");
          }}
        >
          Sıfırla
        </button>
      )}
    </div>
  );
}
