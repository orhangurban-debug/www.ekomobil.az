"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SaveSearchButton } from "@/components/user/save-search-button";
import {
  CAR_MAKES,
  AZERBAIJAN_CITIES,
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  DRIVE_TYPES,
  INTERIOR_MATERIALS,
  COLORS,
  CONDITIONS,
  getModelsForMake
} from "@/lib/car-data";

interface QueryState {
  city?: string;
  make?: string;
  model?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  driveType?: string;
  color?: string;
  condition?: string;
  minEngineVolumeCc?: number;
  maxEngineVolumeCc?: number;
  interiorMaterial?: string;
  hasSunroof?: boolean;
  creditAvailable?: boolean;
  barterAvailable?: boolean;
  vinProvided?: boolean;
  sellerType?: "private" | "dealer";
  sellerVerified?: boolean;
  sort?: "trust_desc" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc" | "recent";
}

function buildUrl(query: QueryState, basePath: string) {
  const params = new URLSearchParams();
  if (query.city && query.city !== "Hamısı") params.set("city", query.city);
  if (query.make && query.make !== "Hamısı") params.set("make", query.make);
  if (query.model && query.model !== "Hamısı") params.set("model", query.model);
  if (query.search) params.set("q", query.search);
  if (query.minPrice) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice) params.set("maxPrice", String(query.maxPrice));
  if (query.minYear) params.set("minYear", String(query.minYear));
  if (query.maxYear) params.set("maxYear", String(query.maxYear));
  if (query.minMileage) params.set("minMileage", String(query.minMileage));
  if (query.maxMileage) params.set("maxMileage", String(query.maxMileage));
  if (query.fuelType) params.set("fuelType", query.fuelType);
  if (query.transmission) params.set("transmission", query.transmission);
  if (query.bodyType) params.set("bodyType", query.bodyType);
  if (query.driveType) params.set("driveType", query.driveType);
  if (query.color) params.set("color", query.color);
  if (query.condition) params.set("condition", query.condition);
  if (query.minEngineVolumeCc) params.set("minEngineVolumeCc", String(query.minEngineVolumeCc));
  if (query.maxEngineVolumeCc) params.set("maxEngineVolumeCc", String(query.maxEngineVolumeCc));
  if (query.interiorMaterial) params.set("interiorMaterial", query.interiorMaterial);
  if (query.hasSunroof) params.set("hasSunroof", "1");
  if (query.creditAvailable) params.set("creditAvailable", "1");
  if (query.barterAvailable) params.set("barterAvailable", "1");
  if (query.vinProvided) params.set("vinProvided", "1");
  if (query.sellerType) params.set("sellerType", query.sellerType);
  if (query.sellerVerified) params.set("sellerVerified", "1");
  if (query.sort) params.set("sort", query.sort);
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

export function ListingsFiltersPanel({
  initialQuery,
  sortOptions,
  basePath = "/listings"
}: {
  initialQuery: QueryState;
  sortOptions: Array<{ value: QueryState["sort"]; label: string }>;
  basePath?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [query, setQuery] = useState<QueryState>({
    city: initialQuery.city ?? "Hamısı",
    make: initialQuery.make ?? "Hamısı",
    model: initialQuery.model ?? "Hamısı",
    search: initialQuery.search ?? "",
    minPrice: initialQuery.minPrice,
    maxPrice: initialQuery.maxPrice,
    minYear: initialQuery.minYear,
    maxYear: initialQuery.maxYear,
    minMileage: initialQuery.minMileage,
    maxMileage: initialQuery.maxMileage,
    fuelType: initialQuery.fuelType,
    transmission: initialQuery.transmission,
    bodyType: initialQuery.bodyType,
    driveType: initialQuery.driveType,
    color: initialQuery.color,
    condition: initialQuery.condition,
    minEngineVolumeCc: initialQuery.minEngineVolumeCc,
    maxEngineVolumeCc: initialQuery.maxEngineVolumeCc,
    interiorMaterial: initialQuery.interiorMaterial,
    hasSunroof: initialQuery.hasSunroof,
    creditAvailable: initialQuery.creditAvailable,
    barterAvailable: initialQuery.barterAvailable,
    vinProvided: initialQuery.vinProvided,
    sellerType: initialQuery.sellerType,
    sellerVerified: initialQuery.sellerVerified,
    sort: initialQuery.sort ?? "recent"
  });

  // Models for selected make
  const availableModels = useMemo(() => {
    if (!query.make || query.make === "Hamısı") return [];
    return getModelsForMake(query.make);
  }, [query.make]);

  const activeCount = useMemo(
    () =>
      [
        query.city && query.city !== "Hamısı",
        query.make && query.make !== "Hamısı",
        query.model && query.model !== "Hamısı",
        query.search,
        query.minPrice,
        query.maxPrice,
        query.minYear,
        query.maxYear,
        query.minMileage,
        query.maxMileage,
        query.fuelType,
        query.transmission,
        query.bodyType,
        query.driveType,
        query.color,
        query.condition,
        query.minEngineVolumeCc,
        query.maxEngineVolumeCc,
        query.interiorMaterial,
        query.hasSunroof,
        query.creditAvailable,
        query.barterAvailable,
        query.vinProvided,
        query.sellerType,
        query.sellerVerified
      ].filter(Boolean).length,
    [query]
  );

  // Count active advanced filters for badge
  const advancedCount = useMemo(
    () =>
      [
        query.city && query.city !== "Hamısı",
        query.fuelType,
        query.transmission,
        query.bodyType,
        query.driveType,
        query.color,
        query.condition,
        query.minEngineVolumeCc,
        query.maxEngineVolumeCc,
        query.interiorMaterial,
        query.hasSunroof,
        query.creditAvailable,
        query.barterAvailable,
        query.vinProvided,
        query.sellerType,
        query.sellerVerified
      ].filter(Boolean).length,
    [query]
  );

  function apply(nextQuery = query) {
    router.push(buildUrl(nextQuery, basePath));
    setOpen(false);
  }

  function reset() {
    const nextQuery: QueryState = { city: "Hamısı", make: "Hamısı", model: "Hamısı", sort: "recent" };
    setQuery(nextQuery);
    router.push(basePath);
    setOpen(false);
  }

  function handleMakeChange(make: string) {
    setQuery((prev) => ({ ...prev, make, model: "Hamısı" }));
  }

  const panel = (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">

      {/* Search */}
      <div>
        <label className="label">Axtarış</label>
        <input
          className="input-field"
          value={query.search ?? ""}
          onChange={(e) => setQuery((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Marka, model və ya açar söz"
        />
      </div>

      {/* Make */}
      <div>
        <label className="label">Marka</label>
        <select
          className="input-field"
          value={query.make ?? "Hamısı"}
          onChange={(e) => handleMakeChange(e.target.value)}
        >
          <option value="Hamısı">Bütün markalar</option>
          {CAR_MAKES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Model — shows only when a make is selected */}
      {availableModels.length > 0 && (
        <div>
          <label className="label">Model</label>
          <select
            className="input-field"
            value={query.model ?? "Hamısı"}
            onChange={(e) => setQuery((prev) => ({ ...prev, model: e.target.value }))}
          >
            <option value="Hamısı">Bütün modellər</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      {/* Price range */}
      <div>
        <label className="label">Qiymət (₼)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input-field"
            type="number"
            value={query.minPrice ?? ""}
            onChange={(e) => setQuery((prev) => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="Min"
          />
          <input
            className="input-field"
            type="number"
            value={query.maxPrice ?? ""}
            onChange={(e) => setQuery((prev) => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="Max"
          />
        </div>
        {/* Quick price presets */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[
            { label: "< 15K", max: 15000 },
            { label: "15–30K", min: 15000, max: 30000 },
            { label: "30–60K", min: 30000, max: 60000 },
            { label: "60K+", min: 60000 }
          ].map((p) => {
            const active = query.minPrice === p.min && query.maxPrice === p.max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => setQuery((prev) => ({ ...prev, minPrice: p.min, maxPrice: p.max }))}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                  active
                    ? "border-[#0891B2] bg-[#0891B2]/10 text-[#0891B2]"
                    : "border-slate-200 text-slate-500 hover:border-[#0891B2]/40 hover:text-[#0891B2]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Year range */}
      <div>
        <label className="label">İl</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input-field"
            type="number"
            value={query.minYear ?? ""}
            onChange={(e) => setQuery((prev) => ({ ...prev, minYear: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="Min"
          />
          <input
            className="input-field"
            type="number"
            value={query.maxYear ?? ""}
            onChange={(e) => setQuery((prev) => ({ ...prev, maxYear: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="Max"
          />
        </div>
      </div>

      {/* Mileage */}
      <div>
        <label className="label">Yürüş (km)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input-field"
            type="number"
            value={query.minMileage ?? ""}
            onChange={(e) => setQuery((prev) => ({ ...prev, minMileage: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="Min"
          />
          <input
            className="input-field"
            type="number"
            value={query.maxMileage ?? ""}
            onChange={(e) => setQuery((prev) => ({ ...prev, maxMileage: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="Max"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="label">Sıralama</label>
        <select
          className="input-field"
          value={query.sort ?? "recent"}
          onChange={(e) => {
            const nextQuery = { ...query, sort: e.target.value as QueryState["sort"] };
            setQuery(nextQuery);
            apply(nextQuery);
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Advanced filters — collapsible */}
      <div className="rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700"
        >
          <span>
            Ətraflı filterlər
            {advancedCount > 0 && (
              <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0891B2] px-1 text-[10px] font-bold text-white">
                {advancedCount}
              </span>
            )}
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {advancedOpen && (
          <div className="space-y-3 border-t border-slate-100 px-3 pb-3 pt-3">
            <div>
              <label className="label">Şəhər</label>
              <select className="input-field" value={query.city ?? "Hamısı"} onChange={(e) => setQuery((prev) => ({ ...prev, city: e.target.value }))}>
                <option value="Hamısı">Bütün şəhərlər</option>
                {AZERBAIJAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Yanacaq növü</label>
              <select className="input-field" value={query.fuelType ?? ""} onChange={(e) => setQuery((prev) => ({ ...prev, fuelType: e.target.value || undefined }))}>
                <option value="">Hamısı</option>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Ötürücü qutusu</label>
              <select className="input-field" value={query.transmission ?? ""} onChange={(e) => setQuery((prev) => ({ ...prev, transmission: e.target.value || undefined }))}>
                <option value="">Hamısı</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Ban növü</label>
              <select className="input-field" value={query.bodyType ?? ""} onChange={(e) => setQuery((prev) => ({ ...prev, bodyType: e.target.value || undefined }))}>
                <option value="">Hamısı</option>
                {BODY_TYPES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Ötürmə növü</label>
              <select className="input-field" value={query.driveType ?? ""} onChange={(e) => setQuery((prev) => ({ ...prev, driveType: e.target.value || undefined }))}>
                <option value="">Hamısı</option>
                {DRIVE_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Rəng</label>
              <select className="input-field" value={query.color ?? ""} onChange={(e) => setQuery((prev) => ({ ...prev, color: e.target.value || undefined }))}>
                <option value="">Hamısı</option>
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Vəziyyət</label>
              <select className="input-field" value={query.condition ?? ""} onChange={(e) => setQuery((prev) => ({ ...prev, condition: e.target.value || undefined }))}>
                <option value="">Hamısı</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Mühərrik həcmi (cc)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-field"
                  type="number"
                  value={query.minEngineVolumeCc ?? ""}
                  onChange={(e) => setQuery((prev) => ({ ...prev, minEngineVolumeCc: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Min"
                />
                <input
                  className="input-field"
                  type="number"
                  value={query.maxEngineVolumeCc ?? ""}
                  onChange={(e) => setQuery((prev) => ({ ...prev, maxEngineVolumeCc: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="label">Salon materialı</label>
              <select
                className="input-field"
                value={query.interiorMaterial ?? ""}
                onChange={(e) => setQuery((prev) => ({ ...prev, interiorMaterial: e.target.value || undefined }))}
              >
                <option value="">Hamısı</option>
                {INTERIOR_MATERIALS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Satıcı tipi</label>
              <select className="input-field" value={query.sellerType ?? ""} onChange={(e) => setQuery((prev) => ({ ...prev, sellerType: (e.target.value || undefined) as "private" | "dealer" | undefined }))}>
                <option value="">Hamısı</option>
                <option value="private">Fərdi</option>
                <option value="dealer">Diler</option>
              </select>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={query.hasSunroof ?? false}
                  onChange={(e) => setQuery((prev) => ({ ...prev, hasSunroof: e.target.checked || undefined }))}
                  className="h-4 w-4 rounded accent-[#0891B2]"
                />
                Lyuku var
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={query.vinProvided ?? false}
                  onChange={(e) => setQuery((prev) => ({ ...prev, vinProvided: e.target.checked || undefined }))}
                  className="h-4 w-4 rounded accent-[#0891B2]"
                />
                VIN daxil edilib
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={query.creditAvailable ?? false}
                  onChange={(e) => setQuery((prev) => ({ ...prev, creditAvailable: e.target.checked || undefined }))}
                  className="h-4 w-4 rounded accent-[#0891B2]"
                />
                Kreditə uyğundur
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={query.barterAvailable ?? false}
                  onChange={(e) => setQuery((prev) => ({ ...prev, barterAvailable: e.target.checked || undefined }))}
                  className="h-4 w-4 rounded accent-[#0891B2]"
                />
                Barter mümkündür
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={query.sellerVerified ?? false}
                  onChange={(e) => setQuery((prev) => ({ ...prev, sellerVerified: e.target.checked || undefined }))}
                  className="h-4 w-4 rounded accent-[#0891B2]"
                />
                Satıcı doğrulanmış
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={reset}>Sıfırla</button>
        <button type="button" className="btn-primary flex-1" onClick={() => apply()}>Tətbiq et</button>
      </div>

      <div className="hidden pt-1 lg:block">
        <SaveSearchButton queryParams={query} />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
          Filterlər {activeCount > 0 ? `(${activeCount})` : ""}
        </button>
        <SaveSearchButton queryParams={query} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block card p-5">{panel}</div>

      {/* Mobile bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Filterlər {activeCount > 0 ? `(${activeCount})` : ""}</h2>
              <button onClick={() => setOpen(false)} className="btn-secondary text-xs">Bağla</button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
