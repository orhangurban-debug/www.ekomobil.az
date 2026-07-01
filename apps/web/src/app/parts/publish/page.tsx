"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListingAiAnalyzePanel } from "@/components/listings/listing-ai-analyze-panel";
import type { PartAiSuggestion } from "@/lib/ai/listing-vision-types";
import {
  PART_AUTHENTICITY_OPTIONS,
  PART_BRANDS,
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_SUBCATEGORIES_BY_CATEGORY
} from "@/lib/parts-catalog";
import { LISTING_PLANS, type PlanType } from "@/lib/listing-plans";
import { formatFileSize, processImageForUpload, type ProcessedImage } from "@/lib/image-processor";

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Şəkil oxuna bilmədi"));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Şəkil oxuna bilmədi"));
    };
    reader.readAsDataURL(file);
  });
}

export default function PartsPublishPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Bakı");
  const [priceAzn, setPriceAzn] = useState<number | "">("");
  const [partCategory, setPartCategory] = useState("");
  const [partSubcategory, setPartSubcategory] = useState("");
  const [partName, setPartName] = useState("");
  const [partBrand, setPartBrand] = useState("");
  const [partCondition, setPartCondition] = useState<"new" | "used" | "refurbished">("new");
  const [partAuthenticity, setPartAuthenticity] = useState<"original" | "oem" | "aftermarket">("oem");
  const [partOemCode, setPartOemCode] = useState("");
  const [partSku, setPartSku] = useState("");
  const [partQuantity, setPartQuantity] = useState<number | "">(1);
  const [partCompatibility, setPartCompatibility] = useState("");
  const [sellerType, setSellerType] = useState<"private" | "dealer">("dealer");
  const [planType, setPlanType] = useState<PlanType>("free");

  const maxImages = 8;
  const subcategories = useMemo(() => {
    if (!partCategory) return [];
    return PART_SUBCATEGORIES_BY_CATEGORY[partCategory] ?? [];
  }, [partCategory]);

  const applyPartAiSuggestion = useCallback((suggestion: PartAiSuggestion) => {
    if (suggestion.title) setTitle(suggestion.title);
    if (suggestion.partName) setPartName(suggestion.partName);
    if (suggestion.partCategory) {
      setPartCategory(suggestion.partCategory);
      setPartSubcategory(suggestion.partSubcategory ?? "");
    } else if (suggestion.partSubcategory) {
      setPartSubcategory(suggestion.partSubcategory);
    }
    if (suggestion.partBrand) setPartBrand(suggestion.partBrand);
    if (suggestion.partCondition) setPartCondition(suggestion.partCondition);
    if (suggestion.partAuthenticity) setPartAuthenticity(suggestion.partAuthenticity);
    if (suggestion.partOemCode) setPartOemCode(suggestion.partOemCode);
    if (suggestion.partSku) setPartSku(suggestion.partSku);
    if (suggestion.partCompatibility) setPartCompatibility(suggestion.partCompatibility);
    if (suggestion.description) setDescription(suggestion.description);
    if (suggestion.priceAzn) setPriceAzn(suggestion.priceAzn);
    if (suggestion.partQuantity) setPartQuantity(suggestion.partQuantity);
  }, []);

  async function handleImageFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadProcessing(true);
    setUploadErrors([]);
    const next: ProcessedImage[] = [];
    const localErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (uploadedImages.length + next.length >= maxImages) {
        localErrors.push(`Maksimum ${maxImages} şəkil.`);
        break;
      }
      const processed = await processImageForUpload(files[i]);
      if (processed.ok) next.push(processed);
      else localErrors.push(`${files[i].name}: ${processed.error}`);
    }

    setUploadedImages((prev) => [...prev, ...next]);
    setUploadErrors(localErrors);
    setUploadProcessing(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const imageUrls =
        uploadedImages.length > 0
          ? await Promise.all(uploadedImages.map(async (entry) => await fileToDataUrl(entry.file)))
          : undefined;

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
          partAuthenticity,
          partOemCode: partOemCode.trim() || undefined,
          partSku: partSku.trim() || undefined,
          partQuantity: Number(partQuantity || 0),
          partCompatibility: partCompatibility.trim() || undefined,
          sellerType,
          planType,
          sellerVerified: false,
          imageUrls,
          mediaProtocol: {
            imageCount: uploadedImages.length || 4,
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

      const payload = (await response.json()) as {
        ok: boolean;
        id?: string;
        errors?: string[];
        error?: string;
        paymentRequired?: boolean;
      };
      if (response.status === 401) {
        router.push("/login?next=/parts/publish");
        return;
      }
      if (!response.ok || !payload.ok || !payload.id) {
        setError(payload.errors?.[0] || payload.error || "Hissə elanı yaradıla bilmədi.");
        setSubmitting(false);
        return;
      }
      if (payload.paymentRequired) {
        const paymentResponse = await fetch("/api/payments/listing-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: payload.id,
            planType,
            source: "publish"
          })
        });
        const paymentPayload = (await paymentResponse.json()) as {
          ok: boolean;
          error?: string;
          checkoutUrl?: string;
        };
        if (paymentPayload.ok && paymentPayload.checkoutUrl) {
          router.push(paymentPayload.checkoutUrl);
          router.refresh();
          return;
        }
        setError(paymentPayload.error || "Ödəniş axını başladılmadı.");
        setSubmitting(false);
        return;
      }
      router.push(`/listings/${payload.id}`);
      router.refresh();
    } catch (err) {
      console.error("parts publish error:", err);
      setError("Şəbəkə xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/parts" className="hover:text-[#0891B2]">
          Mağaza elanları
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Yeni hissə elanı</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Yeni hissə elanı</h1>
          <p className="mt-2 text-slate-600">Təkər, aksesuar, yağ və digər məhsullar üçün strukturlaşdırılmış elan formu.</p>
        </div>
        <Link
          href="/parts/publish/bulk"
          className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100"
        >
          Toplu yükləmə (30 şəkil)
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 card p-6">
        <div>
          <label className="label">Şəkillər</label>
          <div
            className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center"
            onClick={() => document.getElementById("part-image-input")?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleImageFiles(e.dataTransfer.files);
            }}
          >
            <input
              id="part-image-input"
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={(e) => void handleImageFiles(e.target.files)}
            />
            {uploadProcessing ? (
              <p className="text-sm text-slate-600">Şəkillər hazırlanır…</p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">Şəkil əlavə et</p>
                <p className="text-xs text-slate-500">
                  {uploadedImages.length} / {maxImages} · minimum 4 tövsiyə olunur
                </p>
              </>
            )}
          </div>
          {uploadErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {uploadErrors.map((item) => (
                <p key={item} className="text-xs text-red-600">
                  {item}
                </p>
              ))}
            </div>
          )}
          {uploadedImages.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(img.file)} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[9px] text-white">
                    {formatFileSize(img.compressedSizeBytes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ListingAiAnalyzePanel
          listingKind="part"
          maxImages={maxImages}
          optional
          externalImages={uploadedImages}
          onApplyPart={applyPartAiSuggestion}
        />

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
            <select className="input-field" value={partBrand} onChange={(e) => setPartBrand(e.target.value)} required>
              <option value="">Seçin</option>
              {PART_BRANDS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Orijinallıq</label>
            <select className="input-field" value={partAuthenticity} onChange={(e) => setPartAuthenticity(e.target.value as "original" | "oem" | "aftermarket")}>
              {PART_AUTHENTICITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
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
        </div>

        <div>
          <label className="label">Elan planı</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {LISTING_PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPlanType(plan.id)}
                className={`rounded-lg border p-3 text-left ${
                  planType === plan.id
                    ? "border-[#0891B2] bg-[#0891B2]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{plan.nameAz}</p>
                <p className="text-xs text-slate-500">
                  {plan.priceAzn === 0 ? "Pulsuz" : `${plan.priceAzn} ₼ / ${plan.durationDays} gün`}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Paid plan seçiləndə elan əvvəl draft olaraq yaranır və ödənişdən sonra aktivləşir.
          </p>
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
