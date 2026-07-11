"use client";

import { AZERBAIJAN_CITIES } from "@/lib/car-data";

export function BranchCitiesField({
  primaryCity,
  value,
  onChange,
  label = "Filiallar (əlavə şəhərlər)",
  hint = "Əsas şəhərdən başqa filiallarınız varsa seçin. Sonradan profildən də redaktə edə bilərsiniz."
}: {
  primaryCity: string;
  value: string[];
  onChange: (cities: string[]) => void;
  label?: string;
  hint?: string;
}) {
  const options = AZERBAIJAN_CITIES.filter((city) => city !== primaryCity);

  function toggle(city: string) {
    onChange(value.includes(city) ? value.filter((item) => item !== city) : [...value, city]);
  }

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <p className="text-xs text-slate-500">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((city) => {
          const selected = value.includes(city);
          return (
            <button
              key={city}
              type="button"
              onClick={() => toggle(city)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selected
                  ? "border-[#0057FF] bg-[#0057FF]/10 text-[#0057FF]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-slate-500">
          Seçilmiş filiallar: <strong>{value.join(", ")}</strong>
        </p>
      )}
    </div>
  );
}
