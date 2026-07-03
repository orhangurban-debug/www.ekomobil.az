"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PART_AUTHENTICITY_OPTIONS,
  PART_BRANDS,
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_SUBCATEGORIES_BY_CATEGORY
} from "@/lib/parts-catalog";

export function OwnerEditPartListingButton(props: {
  listingId: string;
  title: string;
  description: string;
  city: string;
  priceAzn: number;
  partCategory?: string;
  partSubcategory?: string;
  partName?: string;
  partBrand?: string;
  partCondition?: "new" | "used" | "refurbished";
  partAuthenticity?: "original" | "oem" | "aftermarket";
  partOemCode?: string;
  partSku?: string;
  partQuantity?: number;
  partCompatibility?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: props.title,
    description: props.description,
    city: props.city,
    priceAzn: props.priceAzn,
    partCategory: props.partCategory ?? PART_CATEGORIES[0] ?? "",
    partSubcategory: props.partSubcategory ?? "",
    partName: props.partName ?? "",
    partBrand: props.partBrand ?? "",
    partCondition: props.partCondition ?? "new",
    partAuthenticity: props.partAuthenticity ?? "oem",
    partOemCode: props.partOemCode ?? "",
    partSku: props.partSku ?? "",
    partQuantity: props.partQuantity ?? 1,
    partCompatibility: props.partCompatibility ?? ""
  });
  const subcategoryOptions = useMemo(
    () => PART_SUBCATEGORIES_BY_CATEGORY[form.partCategory] ?? [],
    [form.partCategory]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/listings/${props.listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingKind: "part",
          title: form.title.trim(),
          description: form.description.trim(),
          city: form.city.trim(),
          priceAzn: Number(form.priceAzn),
          partCategory: form.partCategory,
          partSubcategory: form.partSubcategory || undefined,
          partName: form.partName.trim(),
          partBrand: form.partBrand || undefined,
          partCondition: form.partCondition,
          partAuthenticity: form.partAuthenticity,
          partOemCode: form.partOemCode.trim() || undefined,
          partSku: form.partSku.trim() || undefined,
          partQuantity: Number(form.partQuantity),
          partCompatibility: form.partCompatibility.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Yenilənmə uğursuz oldu.");
        setBusy(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Yenilənmə uğursuz oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary w-full justify-center py-3"
        onClick={() => setOpen(true)}
      >
        Elanı redaktə et
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-900/10 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Hissə elanını redaktə et</h3>
            <p className="mt-1 text-sm text-slate-500">
              Saxlandıqdan sonra elan avtomatik yenidən yoxlamaya göndəriləcək.
            </p>

            <form className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1" onSubmit={onSubmit}>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Başlıq"
                required
              />
              <textarea
                className="input-field min-h-[120px]"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Təsvir"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-field"
                  value={form.partName}
                  onChange={(e) => setForm((prev) => ({ ...prev, partName: e.target.value }))}
                  placeholder="Hissənin adı (məs: Əyləc diski)"
                  required
                />
                <input
                  className="input-field"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Şəhər"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="input-field"
                  value={form.partCategory}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextCategory = e.target.value;
                      const nextSubs = PART_SUBCATEGORIES_BY_CATEGORY[nextCategory] ?? [];
                      return {
                        ...prev,
                        partCategory: nextCategory,
                        partSubcategory: nextSubs.includes(prev.partSubcategory) ? prev.partSubcategory : ""
                      };
                    })
                  }
                >
                  {PART_CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={form.partSubcategory}
                  onChange={(e) => setForm((prev) => ({ ...prev, partSubcategory: e.target.value }))}
                >
                  <option value="">Alt kateqoriya seçin</option>
                  {subcategoryOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="input-field" value={form.partBrand} onChange={(e) => setForm((prev) => ({ ...prev, partBrand: e.target.value }))}>
                  <option value="">Brend</option>
                  {PART_BRANDS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={form.partCondition}
                  onChange={(e) => setForm((prev) => ({ ...prev, partCondition: e.target.value as typeof prev.partCondition }))}
                >
                  {PART_CONDITIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={form.partAuthenticity}
                  onChange={(e) => setForm((prev) => ({ ...prev, partAuthenticity: e.target.value as typeof prev.partAuthenticity }))}
                >
                  {PART_AUTHENTICITY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  value={form.priceAzn}
                  onChange={(e) => setForm((prev) => ({ ...prev, priceAzn: Number(e.target.value) }))}
                  placeholder="Qiymət (AZN)"
                  required
                />
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={form.partQuantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, partQuantity: Number(e.target.value) }))}
                  placeholder="Say (stok)"
                  required
                />
                <input
                  className="input-field"
                  value={form.partOemCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, partOemCode: e.target.value }))}
                  placeholder="OEM kodu"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-field"
                  value={form.partSku}
                  onChange={(e) => setForm((prev) => ({ ...prev, partSku: e.target.value }))}
                  placeholder="SKU (mağaza kodu)"
                />
                <input
                  className="input-field"
                  value={form.partCompatibility}
                  onChange={(e) => setForm((prev) => ({ ...prev, partCompatibility: e.target.value }))}
                  placeholder="Hansı modelə uyğundur (məs: Toyota Corolla 2018-2022)"
                />
              </div>
              {error && <p className="text-xs text-red-700">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Ləğv et
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Saxlanılır..." : "Yadda saxla və yoxlamaya göndər"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
