"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AZERBAIJAN_CITIES } from "@/lib/car-data";
import { PART_BRANDS, PART_CATEGORIES, PART_CONDITIONS, PART_SUBCATEGORIES_BY_CATEGORY } from "@/lib/parts-catalog";

interface PartsQueryState {
  city?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerType?: "private" | "dealer";
  sellerVerified?: boolean;
  partCategory?: string;
  partSubcategory?: string;
  partBrand?: string;
  partCondition?: "new" | "used" | "refurbished";
  inStock?: boolean;
  sort?: "trust_desc" | "price_asc" | "price_desc" | "recent";
}

function buildUrl(query: PartsQueryState) {
  const params = new URLSearchParams();
  if (query.city && query.city !== "Hamısı") params.set("city", query.city);
  if (query.search) params.set("q", query.search);
  if (query.minPrice) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice) params.set("maxPrice", String(query.maxPrice));
  if (query.sellerType) params.set("sellerType", query.sellerType);
  if (query.sellerVerified) params.set("sellerVerified", "1");
  if (query.partCategory) params.set("partCategory", query.partCategory);
  if (query.partSubcategory) params.set("partSubcategory", query.partSubcategory);
  if (query.partBrand) params.set("partBrand", query.partBrand);
  if (query.partCondition) params.set("partCondition", query.partCondition);
  if (query.inStock) params.set("inStock", "1");
  if (query.sort) params.set("sort", query.sort);
  const search = params.toString();
  return search ? `/parts?${search}` : "/parts";
}

export function PartsFiltersPanel({
  initialQuery
}: {
  initialQuery: PartsQueryState;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<PartsQueryState>({
    city: initialQuery.city ?? "Hamısı",
    search: initialQuery.search ?? "",
    minPrice: initialQuery.minPrice,
    maxPrice: initialQuery.maxPrice,
    sellerType: initialQuery.sellerType,
    sellerVerified: initialQuery.sellerVerified,
    partCategory: initialQuery.partCategory,
    partSubcategory: initialQuery.partSubcategory,
    partBrand: initialQuery.partBrand,
    partCondition: initialQuery.partCondition,
    inStock: initialQuery.inStock,
    sort: initialQuery.sort ?? "recent"
  });

  const subcategories = useMemo(() => {
    if (!query.partCategory) return [];
    return PART_SUBCATEGORIES_BY_CATEGORY[query.partCategory] ?? [];
  }, [query.partCategory]);

  const activeCount = useMemo(
    () =>
      [
        query.city && query.city !== "Hamısı",
        query.search,
        query.minPrice,
        query.maxPrice,
        query.sellerType,
        query.sellerVerified,
        query.partCategory,
        query.partSubcategory,
        query.partBrand,
        query.partCondition,
        query.inStock
      ].filter(Boolean).length,
    [query]
  );

  function apply(next = query) {
    router.push(buildUrl(next));
    setOpen(false);
  }

  function reset() {
    const next: PartsQueryState = { city: "Hamısı", sort: "recent" };
    setQuery(next);
    router.push("/parts");
    setOpen(false);
  }

  const panel = (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <div>
        <label className="label">Axtarış</label>
        <input
          className="input-field"
          value={query.search ?? ""}
          onChange={(e) => setQuery((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Məhsul adı, OEM, SKU"
        />
      </div>

      <div>
        <label className="label">Kateqoriya</label>
        <select
          className="input-field"
          value={query.partCategory ?? ""}
          onChange={(e) => setQuery((prev) => ({ ...prev, partCategory: e.target.value || undefined, partSubcategory: undefined }))}
        >
          <option value="">Hamısı</option>
          {PART_CATEGORIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {subcategories.length > 0 && (
        <div>
          <label className="label">Alt kateqoriya</label>
          <select
            className="input-field"
            value={query.partSubcategory ?? ""}
            onChange={(e) => setQuery((prev) => ({ ...prev, partSubcategory: e.target.value || undefined }))}
          >
            <option value="">Hamısı</option>
            {subcategories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Brend</label>
        <select
          className="input-field"
          value={query.partBrand ?? ""}
          onChange={(e) => setQuery((prev) => ({ ...prev, partBrand: e.target.value || undefined }))}
        >
          <option value="">Hamısı</option>
          {PART_BRANDS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Vəziyyət</label>
        <select
          className="input-field"
          value={query.partCondition ?? ""}
          onChange={(e) =>
            setQuery((prev) => ({
              ...prev,
              partCondition: (e.target.value || undefined) as PartsQueryState["partCondition"]
            }))
          }
        >
          <option value="">Hamısı</option>
          {PART_CONDITIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

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

      <div>
        <label className="label">Satıcı tipi</label>
        <select
          className="input-field"
          value={query.sellerType ?? ""}
          onChange={(e) => setQuery((prev) => ({ ...prev, sellerType: (e.target.value || undefined) as "private" | "dealer" | undefined }))}
        >
          <option value="">Hamısı</option>
          <option value="private">Fərdi</option>
          <option value="dealer">Mağaza / diler</option>
        </select>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 p-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={query.inStock ?? false}
            onChange={(e) => setQuery((prev) => ({ ...prev, inStock: e.target.checked || undefined }))}
            className="h-4 w-4 rounded accent-[#0891B2]"
          />
          Stokda olanlar
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

      <div>
        <label className="label">Sıralama</label>
        <select
          className="input-field"
          value={query.sort ?? "recent"}
          onChange={(e) => {
            const next = { ...query, sort: e.target.value as PartsQueryState["sort"] };
            setQuery(next);
            apply(next);
          }}
        >
          <option value="recent">Ən yenilər</option>
          <option value="price_asc">Qiymət: ucuzdan bahalıya</option>
          <option value="price_desc">Qiymət: bahalıdan ucuza</option>
          <option value="trust_desc">Etibar: yüksəkdən aşağı</option>
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

      <div className="hidden lg:block card p-5">{panel}</div>

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
