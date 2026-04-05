"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PART_BRANDS, PART_CATEGORIES, PART_CONDITIONS, PART_SUBCATEGORIES_BY_CATEGORY } from "@/lib/parts-catalog";

export default function PartsPublishPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Bakı");
  const [priceAzn, setPriceAzn] = useState<number | "">("");
  const [partCategory, setPartCategory] = useState("");
  const [partSubcategory, setPartSubcategory] = useState("");
  const [partName, setPartName] = useState("");
  const [partBrand, setPartBrand] = useState("");
  const [partCondition, setPartCondition] = useState<"new" | "used" | "refurbished">("new");
  const [partOemCode, setPartOemCode] = useState("");
  const [partSku, setPartSku] = useState("");
  const [partQuantity, setPartQuantity] = useState<number | "">(1);
  const [partCompatibility, setPartCompatibility] = useState("");
  const [sellerType, setSellerType] = useState<"private" | "dealer">("dealer");
  const [mediaImageCount, setMediaImageCount] = useState<number | "">(4);

  const subcategories = useMemo(() => {
    if (!partCategory) return [];
    return PART_SUBCATEGORIES_BY_CATEGORY[partCategory] ?? [];
  }, [partCategory]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingKind: "part",
        title: title.trim(),
        description: description.trim(),
        priceAzn: Number(priceAzn),
        city,
        partCategory,
        partSubcategory: partSubcategory || undefined,
        partName: partName.trim(),
        partBrand: partBrand || undefined,
        partCondition,
        partOemCode: partOemCode.trim() || undefined,
        partSku: partSku.trim() || undefined,
        partQuantity: Number(partQuantity || 0),
        partCompatibility: partCompatibility.trim() || undefined,
        sellerType,
        sellerVerified: false,
        mediaProtocol: {
          imageCount: Number(mediaImageCount || 0),
          engineVideoDurationSec: 0,
          hasFrontAngle: false,
          hasRearAngle: false,
          hasLeftSide: false,
          hasRightSide: false,
          hasDashboard: false,
          hasInterior: false,
          hasOdometer: false,
          hasTrunk: false
        }
      })
    });

    const payload = (await response.json()) as { ok: boolean; id?: string; errors?: string[]; error?: string };
    if (!response.ok || !payload.ok || !payload.id) {
      setError(payload.errors?.[0] || payload.error || "Hissə elanı yaradıla bilmədi.");
      setSubmitting(false);
      return;
    }
    router.push(`/listings/${payload.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/parts" className="hover:text-[#0891B2]">Mağaza elanları</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Yeni hissə elanı</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Yeni hissə elanı</h1>
      <p className="mt-2 text-slate-600">Təkər, aksesuar, yağ və digər məhsullar üçün strukturlaşdırılmış elan formu.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 card p-6">
        <div>
          <label className="label">Elan başlığı</label>
          <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Məs: BOSCH Yağ filtri Toyota Corolla 2018+" required />
        </div>

        <div>
          <label className="label">Məhsul adı</label>
          <input className="input-field" value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Məs: Yağ filtri" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Kateqoriya</label>
            <select className="input-field" value={partCategory} onChange={(e) => { setPartCategory(e.target.value); setPartSubcategory(""); }} required>
              <option value="">Seçin</option>
              {PART_CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Alt kateqoriya</label>
            <select className="input-field" value={partSubcategory} onChange={(e) => setPartSubcategory(e.target.value)} disabled={subcategories.length === 0}>
              <option value="">Seçin</option>
              {subcategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Brend</label>
            <select className="input-field" value={partBrand} onChange={(e) => setPartBrand(e.target.value)}>
              <option value="">Seçin</option>
              {PART_BRANDS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vəziyyət</label>
            <select className="input-field" value={partCondition} onChange={(e) => setPartCondition(e.target.value as "new" | "used" | "refurbished")}>
              {PART_CONDITIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">OEM kodu</label>
            <input className="input-field" value={partOemCode} onChange={(e) => setPartOemCode(e.target.value)} placeholder="Məs: 90915-YZZE1" />
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input-field" value={partSku} onChange={(e) => setPartSku(e.target.value)} placeholder="Məs: FLT-TOY-001" />
          </div>
        </div>

        <div>
          <label className="label">Uyğunluq (marka/model/il/mühərrik)</label>
          <textarea
            className="input-field min-h-[96px]"
            value={partCompatibility}
            onChange={(e) => setPartCompatibility(e.target.value)}
            placeholder="Məs: Toyota Corolla 2014-2021 1.6 / Toyota Prius 2016-2020"
          />
        </div>

        <div>
          <label className="label">Açıqlama</label>
          <textarea className="input-field min-h-[96px]" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Qiymət (₼)</label>
            <input className="input-field" type="number" value={priceAzn} onChange={(e) => setPriceAzn(e.target.value ? Number(e.target.value) : "")} required />
          </div>
          <div>
            <label className="label">Stok sayı</label>
            <input className="input-field" type="number" min={0} value={partQuantity} onChange={(e) => setPartQuantity(e.target.value ? Number(e.target.value) : "")} />
          </div>
          <div>
            <label className="label">Şəkil sayı</label>
            <input className="input-field" type="number" min={4} value={mediaImageCount} onChange={(e) => setMediaImageCount(e.target.value ? Number(e.target.value) : "")} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Şəhər</label>
            <input className="input-field" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <label className="label">Satıcı tipi</label>
            <select className="input-field" value={sellerType} onChange={(e) => setSellerType(e.target.value as "private" | "dealer")}>
              <option value="dealer">Mağaza / diler</option>
              <option value="private">Fərdi</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
          {submitting ? "Yüklənir..." : "Hissə elanını yerləşdir"}
        </button>
      </form>
    </div>
  );
}
