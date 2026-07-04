"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListingAiAnalyzePanel } from "@/components/listings/listing-ai-analyze-panel";
import { ListingPublishEaseTip } from "@/components/listings/listing-publish-ease-tip";
import type { PartBulkProductSuggestion } from "@/lib/ai/listing-vision-types";
import { LISTING_PLANS, type PlanType } from "@/lib/listing-plans";
import { PART_AUTHENTICITY_OPTIONS, PART_CONDITIONS } from "@/lib/parts-catalog";
import type { ProcessedImage } from "@/lib/image-processor";

type PartCondition = "new" | "used" | "refurbished";
type PartAuthenticity = "original" | "oem" | "aftermarket";

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

interface DraftProduct {
  id: string;
  title: string;
  partName: string;
  partCategory: string;
  partBrand: string;
  partCondition: PartCondition;
  partAuthenticity: PartAuthenticity;
  partOemCode: string;
  partSku: string;
  priceAzn: number | "";
  partQuantity: number;
  description: string;
  imageIndices: number[];
}

function normalizeCondition(value: unknown): PartCondition {
  return value === "used" || value === "refurbished" ? value : "new";
}

function normalizeAuthenticity(value: unknown): PartAuthenticity {
  return value === "original" || value === "aftermarket" ? value : "oem";
}

function toDraft(product: PartBulkProductSuggestion, index: number): DraftProduct {
  return {
    id: `draft-${index}-${Date.now()}`,
    title: product.title ?? product.partName ?? `Məhsul ${index + 1}`,
    partName: product.partName ?? "",
    partCategory: product.partCategory ?? "Universal məhsullar",
    partBrand: product.partBrand ?? "",
    partCondition: normalizeCondition(product.partCondition),
    partAuthenticity: normalizeAuthenticity(product.partAuthenticity),
    partOemCode: product.partOemCode ?? "",
    partSku: product.partSku ?? "",
    priceAzn: product.priceAzn ?? "",
    partQuantity: product.partQuantity ?? 1,
    description: product.description ?? "",
    imageIndices: product.imageIndices ?? []
  };
}

export function PartsBulkPublishForm({ storeAccessEnabled }: { storeAccessEnabled: boolean }) {
  const router = useRouter();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [city, setCity] = useState("Bakı");
  const [sellerType, setSellerType] = useState<"private" | "dealer">(storeAccessEnabled ? "dealer" : "private");
  const [planType, setPlanType] = useState<PlanType>("free");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const applyBulkParts = useCallback((products: PartBulkProductSuggestion[]) => {
    setDrafts(products.map((product, index) => toDraft(product, index)));
  }, []);

  const canPublish =
    drafts.length > 0 &&
    drafts.every(
      (d) =>
        d.title.trim() &&
        d.partName.trim() &&
        d.partBrand.trim() &&
        (d.partOemCode.trim() || d.partSku.trim()) &&
        typeof d.priceAzn === "number" &&
        d.priceAzn > 0
    );

  const incompleteCount = drafts.filter(
    (d) =>
      !d.title.trim() ||
      !d.partName.trim() ||
      !d.partBrand.trim() ||
      (!d.partOemCode.trim() && !d.partSku.trim()) ||
      !(typeof d.priceAzn === "number" && d.priceAzn > 0)
  ).length;

  const previewMap = useMemo(() => {
    return images.map((img) => URL.createObjectURL(img.file));
  }, [images]);

  function updateDraft(id: string, patch: Partial<DraftProduct>) {
    setDrafts((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function publishAll() {
    if (!canPublish) return;
    setSubmitting(true);
    setError(null);
    setSuccessCount(0);
    let created = 0;
    const failures: string[] = [];

    try {
      for (const draft of drafts) {
        const selectedImages = draft.imageIndices
          .filter((idx) => idx >= 0 && idx < images.length)
          .map((idx) => images[idx]);
        const fallbackImages = selectedImages.length > 0 ? selectedImages : images.slice(0, 4);
        const imageUrls = await Promise.all(fallbackImages.map(async (entry) => await fileToDataUrl(entry.file)));

        const response = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingKind: "part",
            title: draft.title.trim(),
            description: draft.description.trim() || `${draft.partName} — toplu yükləmə`,
            priceAzn: Number(draft.priceAzn),
            city,
            partCategory: draft.partCategory,
            partName: draft.partName.trim(),
            partBrand: draft.partBrand.trim() || undefined,
            partCondition: draft.partCondition,
            partAuthenticity: draft.partAuthenticity,
            partOemCode: draft.partOemCode.trim() || undefined,
            partSku: draft.partSku.trim() || undefined,
            partQuantity: draft.partQuantity,
            sellerType: storeAccessEnabled ? "dealer" : sellerType,
            planType: storeAccessEnabled ? "free" : planType,
            sellerVerified: false,
            imageUrls,
            mediaProtocol: {
              imageCount: imageUrls.length,
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

        const payload = (await response.json()) as { ok: boolean; id?: string; error?: string; errors?: string[] };
        if (!response.ok || !payload.ok || !payload.id) {
          failures.push(`${draft.title}: ${payload.errors?.[0] ?? payload.error ?? "xəta"}`);
          continue;
        }
        created += 1;
        setSuccessCount(created);
      }

      if (created === 0) {
        setError(failures[0] ?? "Heç bir elan yaradıla bilmədi.");
        setSubmitting(false);
        return;
      }
      if (failures.length > 0) {
        setError(`${created} elan yaradıldı, ${failures.length} uğursuz: ${failures[0]}`);
        setSubmitting(false);
        return;
      }
      router.push("/parts");
      router.refresh();
    } catch (err) {
      console.error("bulk publish error:", err);
      setError("Şəbəkə xətası baş verdi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/parts" className="hover:text-[#0057FF]">
          Mağaza elanları
        </Link>
        <span className="mx-2">/</span>
        <Link href="/parts/publish" className="hover:text-[#0057FF]">
          Yeni elan
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Toplu yükləmə</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Toplu məhsul elanı</h1>
      <p className="mt-2 text-slate-600">
        Çox sayda məhsul şəklini bir dəfəyə yükləyin — AI ayrı elanlar yaradacaq, siz yoxlayacaqsınız.
      </p>

      <ListingAiAnalyzePanel
        analysisContext="part_bulk"
        bulkMode
        onImagesChange={setImages}
        onApplyBulkParts={applyBulkParts}
        className="mt-6"
      />

      <ListingPublishEaseTip variant="part_bulk" className="mt-4" />

      {drafts.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{drafts.length} elan hazırlanıb</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="input-field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Şəhər" />
              {storeAccessEnabled ? (
                <input className="input-field bg-emerald-500/10" value="Mağaza (abunə)" readOnly />
              ) : (
                <select className="input-field" value={sellerType} onChange={(e) => setSellerType(e.target.value as "private" | "dealer")}>
                  <option value="private">Fərdi</option>
                  <option value="dealer">Mağaza</option>
                </select>
              )}
              {!storeAccessEnabled ? (
                <select className="input-field" value={planType} onChange={(e) => setPlanType(e.target.value as PlanType)}>
                  {LISTING_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nameAz}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input-field bg-emerald-500/10" value="Mağaza planı limiti" readOnly />
              )}
            </div>
          </div>

          {drafts.map((draft) => (
            <div key={draft.id} className="card space-y-3 p-4">
              <div className="flex flex-wrap gap-2">
                {(draft.imageIndices.length > 0 ? draft.imageIndices : images.map((_, i) => i).slice(0, 3)).map((idx) =>
                  previewMap[idx] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={previewMap[idx]} alt="" className="h-14 w-14 rounded-lg border object-cover" />
                  ) : null
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-field"
                  value={draft.title}
                  onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                  placeholder="Elan başlığı"
                />
                <input
                  className="input-field"
                  value={draft.partName}
                  onChange={(e) => updateDraft(draft.id, { partName: e.target.value })}
                  placeholder="Məhsul adı"
                />
                <input
                  className="input-field"
                  value={draft.partCategory}
                  onChange={(e) => updateDraft(draft.id, { partCategory: e.target.value })}
                  placeholder="Kateqoriya"
                />
                <input
                  className="input-field"
                  value={draft.partBrand}
                  onChange={(e) => updateDraft(draft.id, { partBrand: e.target.value })}
                  placeholder="Brend"
                />
                <input
                  className="input-field"
                  value={draft.partOemCode}
                  onChange={(e) => updateDraft(draft.id, { partOemCode: e.target.value })}
                  placeholder="OEM kodu"
                />
                <input
                  className="input-field"
                  value={draft.partSku}
                  onChange={(e) => updateDraft(draft.id, { partSku: e.target.value })}
                  placeholder="SKU"
                />
                <select
                  className="input-field"
                  value={draft.partCondition}
                  onChange={(e) => updateDraft(draft.id, { partCondition: e.target.value as PartCondition })}
                >
                  {PART_CONDITIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={draft.partAuthenticity}
                  onChange={(e) => updateDraft(draft.id, { partAuthenticity: e.target.value as PartAuthenticity })}
                >
                  {PART_AUTHENTICITY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <input
                  className="input-field"
                  type="number"
                  value={draft.priceAzn}
                  onChange={(e) => updateDraft(draft.id, { priceAzn: e.target.value ? Number(e.target.value) : "" })}
                  placeholder="Qiymət (₼)"
                />
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  value={draft.partQuantity}
                  onChange={(e) => updateDraft(draft.id, { partQuantity: Number(e.target.value) || 1 })}
                  placeholder="Stok"
                />
              </div>
              {(!draft.partBrand.trim() || (!draft.partOemCode.trim() && !draft.partSku.trim())) && (
                <p className="text-xs text-amber-600">
                  Brend və ən azı OEM kodu və ya SKU daxil edilməlidir.
                </p>
              )}
              <textarea
                className="input-field min-h-[72px]"
                value={draft.description}
                onChange={(e) => updateDraft(draft.id, { description: e.target.value })}
                placeholder="Açıqlama"
              />
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {!canPublish && incompleteCount > 0 && (
            <p className="text-sm text-amber-600">
              {incompleteCount} elanda çatışmayan məlumat var (başlıq, məhsul adı, brend, OEM/SKU, qiymət).
            </p>
          )}
          {successCount > 0 && submitting && (
            <p className="text-sm text-emerald-700">{successCount} / {drafts.length} elan yaradılır…</p>
          )}

          <button
            type="button"
            disabled={!canPublish || submitting}
            onClick={() => void publishAll()}
            className="btn-primary w-full justify-center py-3 disabled:opacity-50"
          >
            {submitting ? "Yerləşdirilir…" : `${drafts.length} elanı yerləşdir`}
          </button>
        </div>
      )}
    </div>
  );
}
