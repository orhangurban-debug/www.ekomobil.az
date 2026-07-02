"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { AiAnalysisContext } from "@/lib/ai/listing-ai-quota";
import type {
  ListingAiAnalyzeResult,
  PartAiSuggestion,
  PartBulkProductSuggestion,
  ServiceAiSuggestion,
  VehicleAiSuggestion
} from "@/lib/ai/listing-vision-types";
import type { PlanType } from "@/lib/listing-plans";
import type { ServicePlanGroup } from "@/lib/ai/service-plan-limits";
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

interface QuotaInfo {
  remaining: number;
  dailyLimit: number;
  maxImages: number;
  maxBulkImages: number;
  planLabel: string;
  singleListingOnly: boolean;
  requiresAuth: boolean;
}

interface ListingAiAnalyzePanelProps {
  analysisContext: AiAnalysisContext;
  bulkMode?: boolean;
  maxImages?: number;
  optional?: boolean;
  planType?: PlanType;
  servicePlanGroup?: ServicePlanGroup;
  servicePlanId?: string;
  providerTypeHint?: string;
  externalImages?: ProcessedImage[];
  onApplyVehicle?: (suggestion: VehicleAiSuggestion) => void;
  onApplyPart?: (suggestion: PartAiSuggestion) => void;
  onApplyBulkParts?: (products: PartBulkProductSuggestion[]) => void;
  onApplyService?: (suggestion: ServiceAiSuggestion) => void;
  onImagesChange?: (images: ProcessedImage[]) => void;
  className?: string;
}

function listingKindFromContext(context: AiAnalysisContext): "vehicle" | "part" | "service" {
  if (context === "service") return "service";
  if (context === "vehicle") return "vehicle";
  return "part";
}

export function ListingAiAnalyzePanel({
  analysisContext,
  bulkMode = false,
  maxImages: maxImagesProp,
  optional = false,
  planType,
  servicePlanGroup,
  servicePlanId,
  providerTypeHint,
  externalImages,
  onApplyVehicle,
  onApplyPart,
  onApplyBulkParts,
  onApplyService,
  onImagesChange,
  className = ""
}: ListingAiAnalyzePanelProps) {
  const [ownImages, setOwnImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ListingAiAnalyzeResult | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = externalImages ?? ownImages;
  const managesOwnUploads = externalImages === undefined;
  const effectiveMaxImages = maxImagesProp ?? quota?.maxImages ?? (bulkMode ? quota?.maxBulkImages ?? 30 : 8);

  const quotaQuery = useMemo(() => {
    const params = new URLSearchParams({ context: analysisContext });
    if (planType) params.set("planType", planType);
    if (servicePlanGroup) params.set("servicePlanGroup", servicePlanGroup);
    if (servicePlanId) params.set("servicePlanId", servicePlanId);
    return params.toString();
  }, [analysisContext, planType, servicePlanGroup, servicePlanId]);

  useEffect(() => {
    fetch(`/api/ai/analyze-listing?${quotaQuery}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.quota) setQuota(d.quota as QuotaInfo);
      })
      .catch(() => undefined);
  }, [quotaQuery, result]);

  const title = useMemo(() => {
    if (analysisContext === "service") return "AI servis profili analizi";
    if (bulkMode || analysisContext === "part_bulk") return "AI toplu məhsul analizi";
    if (analysisContext === "vehicle") return "AI avtomobil analizi";
    return "AI məhsul analizi";
  }, [analysisContext, bulkMode]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !managesOwnUploads) return;
      setProcessing(true);
      setErrors([]);
      const next: ProcessedImage[] = [];
      const localErrors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        if (ownImages.length + next.length >= effectiveMaxImages) {
          localErrors.push(`Plan limiti: maksimum ${effectiveMaxImages} şəkil.`);
          break;
        }
        const processed = await processImageForUpload(files[i]);
        if (processed.ok) next.push(processed);
        else localErrors.push(`${files[i].name}: ${processed.error}`);
      }

      const merged = [...ownImages, ...next];
      setOwnImages(merged);
      onImagesChange?.(merged);
      setErrors(localErrors);
      setProcessing(false);
      setSkipped(false);
    },
    [effectiveMaxImages, managesOwnUploads, onImagesChange, ownImages]
  );

  async function runAnalysis() {
    if (images.length === 0) {
      setErrors(["Əvvəlcə ən az bir şəkil əlavə edin."]);
      return;
    }
    setAnalyzing(true);
    setErrors([]);
    setResult(null);
    try {
      const imageUrls = await Promise.all(images.map(async (img) => await fileToDataUrl(img.file)));
      const response = await fetch("/api/ai/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisContext,
          listingKind: listingKindFromContext(analysisContext),
          imageUrls,
          bulkMode: bulkMode || analysisContext === "part_bulk",
          planType,
          servicePlanGroup,
          servicePlanId,
          providerTypeHint
        })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        requiresAuth?: boolean;
        result?: ListingAiAnalyzeResult;
        quota?: QuotaInfo & { dailyLimit: number };
      };
      if (!response.ok || !payload.ok || !payload.result) {
        setErrors([payload.error ?? "Analiz uğursuz oldu."]);
        return;
      }
      setResult(payload.result);
      if (payload.quota) {
        setQuota({
          remaining: payload.quota.remaining,
          dailyLimit: payload.quota.dailyLimit,
          maxImages: payload.quota.maxImages,
          maxBulkImages: payload.quota.maxBulkImages,
          planLabel: payload.quota.planLabel,
          singleListingOnly: payload.quota.singleListingOnly,
          requiresAuth: false
        });
      }
    } catch {
      setErrors(["Şəbəkə xətası. Yenidən cəhd edin."]);
    } finally {
      setAnalyzing(false);
    }
  }

  function applyResult() {
    if (!result) return;
    if (result.vehicle && onApplyVehicle) onApplyVehicle(result.vehicle);
    if (result.part && onApplyPart) onApplyPart(result.part);
    if (result.bulkProducts && onApplyBulkParts) onApplyBulkParts(result.bulkProducts);
    if (result.service && onApplyService) onApplyService(result.service);
    setApplied(true);
  }

  if (skipped && optional) return null;

  return (
    <div className={`rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-900">{title}</p>
          <p className="mt-1 text-xs text-violet-700/80">
            {bulkMode || analysisContext === "part_bulk"
              ? `${effectiveMaxImages} şəkilə qədər — AI fərqli məhsulları qruplaşdıracaq.`
              : analysisContext === "service"
                ? "Emalatxana/servis şəkillərindən profil sahələrini təklif edir."
                : "Bütün şəkillər eyni elana (tək avtomobil/məhsul) aiddir — AI sahələri avtomatik dolduracaq."}
            {optional ? " Bu addım istəyə bağlıdır." : ""}
          </p>
          {quota?.planLabel && (
            <p className="mt-1 text-[11px] font-medium text-violet-600">
              Plan: {quota.planLabel} · gündə {quota.dailyLimit} analiz · elan başına {effectiveMaxImages} şəkil
            </p>
          )}
        </div>
        {quota && (
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-800">
            Qalan: {quota.remaining}/{quota.dailyLimit}
          </span>
        )}
      </div>

      {quota?.singleListingOnly && analysisContext === "vehicle" && (
        <div className="mt-3 rounded-xl alert-warning border px-3 py-2.5 text-xs text-amber-700">
          <strong>Salon / avtomobil qaydası:</strong> Yalnız <em>bir avtomobilin</em> şəkillərini yükləyin.
          Bir neçə avtomobil üçün ayrı-ayrı elan yaradın və ya{" "}
          <Link href="/dealer/import" className="font-semibold underline">
            CSV idxalı
          </Link>{" "}
          istifadə edin.
        </div>
      )}

      {managesOwnUploads && (
        <div className="mt-4">
          <div
            className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-violet-200 bg-white/95 p-4 text-center transition hover:border-violet-400"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            {processing ? (
              <p className="text-sm text-violet-700">Şəkillər hazırlanır…</p>
            ) : (
              <>
                <p className="text-sm font-medium text-violet-800">Şəkil əlavə et</p>
                <p className="text-xs text-violet-600/70">
                  {images.length} / {effectiveMaxImages} · JPEG, PNG, WebP, HEIC
                </p>
              </>
            )}
          </div>

          {images.length > 0 && (
            <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-6">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-violet-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(img.file)} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[8px] text-slate-900">
                    {formatFileSize(img.compressedSizeBytes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!managesOwnUploads && images.length > 0 && (
        <p className="mt-3 text-xs text-violet-700">
          {images.length} şəkil seçilib — AI analiz üçün hazırdır (plan limiti: {effectiveMaxImages}).
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={analyzing || images.length === 0}
          onClick={() => void runAnalysis()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {analyzing ? "Analiz edilir…" : "AI ilə analiz et"}
        </button>
        {optional && (
          <button
            type="button"
            onClick={() => setSkipped(true)}
            className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
          >
            Keç (manual doldur)
          </button>
        )}
        {result && (
          <button
            type="button"
            onClick={applyResult}
            className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/20"
          >
            Formaya tətbiq et
          </button>
        )}
      </div>

      {applied && (
        <p className="mt-3 text-xs font-medium text-emerald-700">
          Təklif formaya tətbiq olundu — sahələri yoxlayın və lazım gələrsə redaktə edin.
        </p>
      )}

      {errors.length > 0 && (
        <div className="mt-3 rounded-lg alert-danger border p-3">
          {errors.map((err) => (
            <p key={err} className="text-xs text-red-700">
              {err}
            </p>
          ))}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-violet-100 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-800">AI təklifi</p>
          <p className="mt-1 text-xs text-slate-500">{result.disclaimer}</p>
          {(result.vehicle?.notes || result.part?.notes || result.service?.notes) && (
            <p className="mt-2 text-xs text-amber-700">
              {result.vehicle?.notes ?? result.part?.notes ?? result.service?.notes}
            </p>
          )}

          {result.vehicle && (
            <ul className="mt-3 space-y-1 text-xs text-slate-700">
              {[
                ["Başlıq", result.vehicle.title],
                ["Marka", result.vehicle.make],
                ["Model", result.vehicle.model],
                ["İl", result.vehicle.year],
                ["Rəng", result.vehicle.color],
                ["Yürüş", result.vehicle.declaredMileageKm],
                ["VIN", result.vehicle.vin]
              ].map(([label, value]) =>
                value ? (
                  <li key={String(label)}>
                    <span className="text-slate-500">{label}:</span> {String(value)}
                  </li>
                ) : null
              )}
            </ul>
          )}

          {result.part && (
            <ul className="mt-3 space-y-1 text-xs text-slate-700">
              {[
                ["Başlıq", result.part.title],
                ["Məhsul", result.part.partName],
                ["Kateqoriya", result.part.partCategory],
                ["Brend", result.part.partBrand],
                ["OEM", result.part.partOemCode],
                ["Teqlər", result.part.searchKeywords?.join(", ")]
              ].map(([label, value]) =>
                value ? (
                  <li key={String(label)}>
                    <span className="text-slate-500">{label}:</span> {String(value)}
                  </li>
                ) : null
              )}
            </ul>
          )}

          {result.service && (
            <ul className="mt-3 space-y-1 text-xs text-slate-700">
              {[
                ["Ad", result.service.providerName],
                ["Tip", result.service.providerType],
                ["Şəhər", result.service.city],
                ["Ünvan", result.service.address],
                ["Tag-lar", result.service.suggestedTags?.join(", ")]
              ].map(([label, value]) =>
                value ? (
                  <li key={String(label)}>
                    <span className="text-slate-500">{label}:</span> {String(value)}
                  </li>
                ) : null
              )}
            </ul>
          )}

          {result.bulkProducts && result.bulkProducts.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-slate-600">{result.bulkProducts.length} ayrı məhsul tapıldı</p>
              {result.bulkProducts.map((product, idx) => (
                <div key={idx} className="rounded-lg border border-slate-100 bg-white/60 p-2 text-xs">
                  <p className="font-medium text-slate-800">
                    {product.title || product.partName || `Məhsul ${idx + 1}`}
                  </p>
                  <p className="text-slate-500">
                    Şəkillər: {(product.imageIndices ?? []).map((i) => i + 1).join(", ") || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
