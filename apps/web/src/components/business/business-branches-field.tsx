"use client";

import { AZERBAIJAN_CITIES } from "@/lib/car-data";
import type { BusinessProfileBranch } from "@/lib/business-branches";
import { MAX_BUSINESS_BRANCHES } from "@/lib/business-branches";

function emptyBranch(): BusinessProfileBranch {
  return { city: "", label: "", address: "", mapUrl: "", phone: "", workingHours: "" };
}

export function BusinessBranchesField({
  primaryCity,
  value,
  onChange,
  canUseAddress = true,
  label = "Filiallar",
  hint = "Əsas ofisdən başqa filiallarınızı əlavə edin: şəhər, ünvan və paylaşıla bilən xəritə linki."
}: {
  primaryCity: string;
  value: BusinessProfileBranch[];
  onChange: (branches: BusinessProfileBranch[]) => void;
  canUseAddress?: boolean;
  label?: string;
  hint?: string;
}) {
  const cityOptions = AZERBAIJAN_CITIES.filter((city) => city !== primaryCity);

  function updateAt(index: number, patch: Partial<BusinessProfileBranch>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addBranch() {
    if (value.length >= MAX_BUSINESS_BRANCHES) return;
    onChange([...value, emptyBranch()]);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">{label}</label>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>

      {value.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Hələ filial əlavə edilməyib.
        </p>
      )}

      {value.map((branch, index) => (
        <div key={`branch-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">Filial {index + 1}</p>
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Sil
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Şəhər *</span>
              <select
                className="input-field"
                value={branch.city}
                onChange={(e) => updateAt(index, { city: e.target.value })}
              >
                <option value="">Seçin</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Filial adı</span>
              <input
                className="input-field"
                value={branch.label ?? ""}
                onChange={(e) => updateAt(index, { label: e.target.value })}
                placeholder="Məs: Gəncə filialı"
              />
            </label>
          </div>

          {canUseAddress && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Ünvan</span>
              <input
                className="input-field"
                value={branch.address ?? ""}
                onChange={(e) => updateAt(index, { address: e.target.value })}
                placeholder="Küçə, bina, orientir"
              />
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-600">Xəritə linki (paylaşıla bilən)</span>
            <input
              className="input-field"
              value={branch.mapUrl ?? ""}
              onChange={(e) => updateAt(index, { mapUrl: e.target.value })}
              placeholder="https://maps.google.com/... və ya https://2gis.az/..."
            />
            <p className="text-[11px] text-slate-400">Google Maps, Apple Maps, Yandex və ya 2GIS linki əlavə edin.</p>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Telefon</span>
              <input
                className="input-field"
                value={branch.phone ?? ""}
                onChange={(e) => updateAt(index, { phone: e.target.value })}
                placeholder="+994..."
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">İş saatları</span>
              <input
                className="input-field"
                value={branch.workingHours ?? ""}
                onChange={(e) => updateAt(index, { workingHours: e.target.value })}
                placeholder="B.e-C. 09:00-18:00"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addBranch}
        disabled={value.length >= MAX_BUSINESS_BRANCHES}
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        + Filial əlavə et
      </button>
    </div>
  );
}
