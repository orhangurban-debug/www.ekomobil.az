"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AZERBAIJAN_CITIES } from "@/lib/car-data";
import { SERVICE_PROVIDER_GROUPS, SERVICE_PROVIDER_TYPE_LABELS } from "@/lib/services-marketplace";

interface ServicesQueryState {
  providerType?: string;
  city?: string;
}

function buildUrl(query: ServicesQueryState): string {
  const params = new URLSearchParams();
  if (query.providerType) params.set("type", query.providerType);
  if (query.city && query.city !== "Hamısı") params.set("city", query.city);
  const search = params.toString();
  return search ? `/services?${search}` : "/services";
}

export function ServicesFiltersPanel({ initialQuery }: { initialQuery: ServicesQueryState }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<ServicesQueryState>({
    providerType: initialQuery.providerType,
    city: initialQuery.city ?? "Hamısı"
  });

  const activeCount = useMemo(
    () => [query.providerType, query.city && query.city !== "Hamısı"].filter(Boolean).length,
    [query]
  );

  function apply(next = query) {
    router.push(buildUrl(next));
    setOpen(false);
  }

  function reset() {
    const next: ServicesQueryState = { city: "Hamısı" };
    setQuery(next);
    router.push("/services");
    setOpen(false);
  }

  const panel = (
    <div className="space-y-4">
      <div>
        <label className="label">Xidmət növü</label>
        <select
          className="input-field"
          value={query.providerType ?? ""}
          onChange={(e) => setQuery((prev) => ({ ...prev, providerType: e.target.value || undefined }))}
        >
          <option value="">Hamısı</option>
          {SERVICE_PROVIDER_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.types.map((type) => (
                <option key={type} value={type}>{SERVICE_PROVIDER_TYPE_LABELS[type]}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Şəhər</label>
        <select
          className="input-field"
          value={query.city ?? "Hamısı"}
          onChange={(e) => setQuery((prev) => ({ ...prev, city: e.target.value }))}
        >
          <option value="Hamısı">Bütün şəhərlər</option>
          {AZERBAIJAN_CITIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={reset}>Sıfırla</button>
        <button type="button" className="btn-primary flex-1" onClick={() => apply()}>Tətbiq et</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
          Filterlər {activeCount > 0 ? `(${activeCount})` : ""}
        </button>
      </div>

      <div className="glass-panel hidden p-5 lg:block">{panel}</div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-slate-900/10 bg-white p-5">
            <div className="sticky top-0 mb-4 flex items-center justify-between border-b border-slate-900/10 bg-white pb-2">
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
