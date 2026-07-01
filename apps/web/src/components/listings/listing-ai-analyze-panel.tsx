"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ListingAiAnalyzeResult,
  PartAiSuggestion,
  PartBulkProductSuggestion,
  VehicleAiSuggestion
} from "@/lib/ai/listing-vision-types";
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

function confidenceLabel(value?: number): string {
  if (value === undefined) return "";
  if (value >= 0.75) return "yüksək";
  if (value >= 0.45) return "orta";
  return "aşağı";
}

interface ListingAiAnalyzePanelProps {
  listingKind: "vehicle" | "part";
  bulkMode?: boolean;
  maxImages: number;
  optional?: boolean;
  /** Parent-in artıq yüklədiyi şəkillər (məs. avtomobil Media addımı) */
  externalImages?: ProcessedImage[];
  onApplyVehicle?: (suggestion: VehicleAiSuggestion) => void;
  onApplyPart?: (suggestion: PartAiSuggestion) => void;
  onApplyBulkParts?: (products: PartBulkProductSuggestion[]) => void;
  onImagesChange?: (images: ProcessedImage[]) => void;
  className?: string;
}

export function ListingAiAnalyzePanel({
  listingKind,
  bulkMode = false,
  maxImages,
  optional = false,
  externalImages,
  onApplyVehicle,
  onApplyPart,
  onApplyBulkParts,
  onImagesChange,
  className = ""
}: ListingAiAnalyzePanelProps) {
  const [ownImages, setOwnImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ListingAiAnalyzeResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [skipped, setSkipped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = externalImages ?? ownImages;
  const managesOwnUploads = externalImages === undefined;

  useEffect(() => {
    fetch("/api/ai/analyze-listing")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && typeof d.remaining === "number") setRemaining(d.remaining);
      })
      .catch(() => undefined);
  }, [result]);

  const title = useMemo(() => {
    if (bulkMode) return "AI toplu məhsul analizi";
    if (listingKind === "vehicle") return "AI avtomobil analizi";
    return "AI məhsul analizi";
  }, [bulkMode, listingKind]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !managesOwnUploads) return;
      setProcessing(true);
      setErrors([]);
      const next: ProcessedImage[] = [];
      const localErrors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        if (ownImages.length + next.length >= maxImages) {
          localErrors.push(`Maksimum ${maxImages} şəkil.`);
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
    [managesOwnUploads, maxImages, onImagesChange, ownImages]
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
          listingKind,
          imageUrls,
          bulkMode
        })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: ListingAiAnalyzeResult;
        remaining?: number;
      };
      if (!response.ok || !payload.ok || !payload.result) {
        setErrors([payload.error ?? "Analiz uğursuz oldu."]);
        return;
      }
      setResult(payload.result);
      if (typeof payload.remaining === "number") setRemaining(payload.remaining);
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
  }

  if (skipped && optional) return null;

  return (
    <div className={`rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-900">{title}</p>
          <p className="mt-1 text-xs text-violet-700/80">
            {bulkMode
              ? `${maxImages} şəkilə qədər yükləyin — AI eyni məhsulları qruplaşdırıb ayrı elanlar təklif edəcək.`
              : "Şəkilləri yükləyin — AI marka, model, kateqoriya və digər sahələri avtomatik dolduracaq. Siz redaktə edə bilərsiniz."}
            {optional ? " Bu addım istəyə bağlıdır." : ""}
          </p>
        </div>
        {remaining !== null && (
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-800">
            Qalan: {remaining}
          </span>
        )}
      </div>

      {managesOwnUploads && (
        <div className="mt-4">
          <div
            className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-violet-200 bg-white/70 p-4 text-center transition hover:border-violet-400"
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
                  {images.length} / {maxImages} · JPEG, PNG, WebP, HEIC
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
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[8px] text-white">
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
          {images.length} şəkil seçilib — AI analiz üçün hazırdır.
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
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Formaya tətbiq et
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
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
          {(result.vehicle?.notes || result.part?.notes) && (
            <p className="mt-2 text-xs text-amber-700">{result.vehicle?.notes ?? result.part?.notes}</p>
          )}

          {result.vehicle && (
            <ul className="mt-3 space-y-1 text-xs text-slate-700">
              {[
                ["Başlıq", result.vehicle.title],
                ["Marka", result.vehicle.make],
                ["Model", result.vehicle.model],
                ["İl", result.vehicle.year],
                ["Rəng", result.vehicle.color],
                ["Yanacaq", result.vehicle.fuelType],
                ["Yürüş", result.vehicle.declaredMileageKm],
                ["VIN", result.vehicle.vin]
              ].map(([label, value]) =>
                value ? (
                  <li key={String(label)}>
                    <span className="text-slate-500">{label}:</span> {String(value)}
                    {result.vehicle?.fieldConfidence?.[String(label).toLowerCase()] !== undefined && (
                      <span className="ml-1 text-violet-600">
                        ({confidenceLabel(result.vehicle.fieldConfidence[String(label).toLowerCase()])})
                      </span>
                    )}
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
                ["OEM", result.part.partOemCode]
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
              <p className="text-xs font-medium text-slate-600">
                {result.bulkProducts.length} ayrı məhsul tapıldı
              </p>
              {result.bulkProducts.map((product, idx) => (
                <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
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
