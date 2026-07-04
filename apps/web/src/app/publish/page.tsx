"use client";

import { FormEvent, useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BODY_TYPES,
  CAR_MAKES,
  COLORS,
  CONDITIONS,
  DRIVE_TYPES,
  INTERIOR_MATERIALS,
  FUEL_TYPES,
  getCompatibleEngineTypes,
  getCompatibleTransmissions,
  getModelsForMake
} from "@/lib/car-data";
import { MediaProtocolInput, validateMediaProtocol } from "@/lib/media-protocol";
import { trackEvent } from "@/lib/analytics/client";
import { LISTING_PLANS, FREE_LISTING_CONCURRENT_LIMIT, formatListingPlanPrice, type PlanType } from "@/lib/listing-plans";
import { useLaunchPromo } from "@/hooks/use-launch-promo";
import {
  processImageForUpload,
  formatFileSize,
  type ProcessedImage
} from "@/lib/image-processor";
import { ListingAiAnalyzePanel } from "@/components/listings/listing-ai-analyze-panel";
import { ListingPublishEaseTip } from "@/components/listings/listing-publish-ease-tip";
import type { VehicleAiSuggestion } from "@/lib/ai/listing-vision-types";

const STEPS = ["Mediya", "Avtomobil", "Plan", "Yoxlama"] as const;
type Step = (typeof STEPS)[number];

interface TrustApiResponse {
  ok: boolean;
  trustScore?: number;
  errors?: string[];
  signals?: {
    vinVerification: { status: string };
    mileageFlag?: { message: string; severity: string };
    sellerVerified: boolean;
    mediaComplete: boolean;
  };
}

const initialMedia: MediaProtocolInput = {
  imageCount: 0,
  engineVideoDurationSec: 0,
  hasFrontAngle: false,
  hasRearAngle: false,
  hasLeftSide: false,
  hasRightSide: false,
  hasDashboard: false,
  hasInterior: false,
  hasOdometer: false,
  hasTrunk: false
};

const mediaAngles: { key: keyof MediaProtocolInput; label: string }[] = [
  { key: "hasFrontAngle", label: "Ön" },
  { key: "hasRearAngle", label: "Arxa" },
  { key: "hasLeftSide", label: "Sol tərəf" },
  { key: "hasRightSide", label: "Sağ tərəf" },
  { key: "hasDashboard", label: "Ön panel" },
  { key: "hasInterior", label: "Salon" },
  { key: "hasOdometer", label: "Yürüş sayğacı" },
  { key: "hasTrunk", label: "Baqaj" }
];

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Şəkil oxuna bilmədi"));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Şəkil oxuna bilmədi"));
    };
    reader.readAsDataURL(file);
  });
}

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex w-full max-w-full items-center justify-between gap-1 sm:justify-center sm:gap-0">
        {STEPS.map((step, i) => (
          <div key={step} className="flex min-w-0 flex-1 items-center sm:flex-none">
            <div className="flex min-w-0 flex-1 flex-col items-center sm:flex-row sm:flex-none">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition sm:h-9 sm:w-9 sm:text-sm ${
                  i < idx
                    ? "bg-brand-600 text-slate-900"
                    : i === idx
                      ? "bg-brand-600 text-slate-900 ring-4 ring-brand-100"
                      : "bg-white/63 text-slate-400"
                }`}
              >
                {i < idx ? (
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-1 max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight sm:mt-0 sm:ml-2 sm:px-0 sm:text-sm sm:mr-6 ${
                  i === idx ? "text-[#0057FF]" : "text-slate-400"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-px min-w-2 flex-1 sm:mx-0 sm:mr-6 sm:h-px sm:w-8 sm:flex-none ${i < idx ? "bg-brand-600" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PublishImageUploadZone({
  uploadedImages,
  maxImages,
  minimumRequiredImages,
  uploadProcessing,
  uploadErrors,
  fileInputRef,
  onSelectFiles,
  onRemoveImage,
  compact = false
}: {
  uploadedImages: ProcessedImage[];
  maxImages: number;
  minimumRequiredImages: number;
  uploadProcessing: boolean;
  uploadErrors: string[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSelectFiles: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="label mb-0">Şəkillər</label>
        <span className="text-xs text-slate-400">
          {uploadedImages.length} / {maxImages} şəkil
        </span>
      </div>
      <p className="mb-2 text-xs text-slate-500">
        Minimum <strong>{minimumRequiredImages} əsas şəkil</strong> əlavə edin. Daha çox şəkil elanın keyfiyyətini artırır.
      </p>

      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition ${
          compact ? "min-h-[100px] p-4" : "min-h-[120px] p-5"
        } ${
          uploadProcessing
            ? "border-[#0057FF]/40 bg-[#0057FF]/5"
            : "border-slate-900/15 bg-white/60 hover:border-[#0057FF]/60 hover:bg-[#0057FF]/5"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onSelectFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => onSelectFiles(e.target.files)}
        />
        {uploadProcessing ? (
          <div className="flex items-center gap-2 text-sm text-[#0057FF]">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Şəkillər sıxılır…
          </div>
        ) : (
          <>
            <svg className={`text-slate-400 ${compact ? "h-7 w-7" : "h-8 w-8"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-[#0057FF]">Fayl seçin</span> və ya bura sürükləyin
            </p>
            <p className="text-xs text-slate-400">
              JPEG · PNG · WebP · HEIC — istənilən ölçü qəbul olunur, sistem avtomatik sıxır
            </p>
          </>
        )}
      </div>

      {uploadErrors.length > 0 && (
        <div className="mt-2 rounded-xl alert-danger border p-3">
          {uploadErrors.map((e, i) => (
            <p key={i} className="text-xs text-red-700">{e}</p>
          ))}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {uploadedImages.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-900/10 bg-white/63">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(img.file)}
                alt={`Şəkil ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 text-center text-[9px] text-white">
                {formatFileSize(img.compressedSizeBytes)}
                {img.wasResized && " · sıxıldı"}
              </div>
              <button
                type="button"
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(i);
                }}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadedImages.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-400">
          💾 Cəmi: {formatFileSize(uploadedImages.reduce((s, img) => s + img.compressedSizeBytes, 0))} · Sistem avtomatik JPEG 85%-ə çevirmişdir
        </p>
      )}
    </div>
  );
}

export default function PublishPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("Mediya");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceAzn, setPriceAzn] = useState(0);
  const [city, setCity] = useState("Bakı");
  const [vin, setVin] = useState("");
  const [vinInfoType, setVinInfoType] = useState<"link" | "document">("link");
  const [vinInfoUrl, setVinInfoUrl] = useState("");
  const [vinDocumentRef, setVinDocumentRef] = useState("");
  const [serviceHistoryType, setServiceHistoryType] = useState<"link" | "document">("link");
  const [serviceHistoryUrl, setServiceHistoryUrl] = useState("");
  const [serviceHistoryDocumentRef, setServiceHistoryDocumentRef] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2020);
  const [declaredMileageKm, setDeclaredMileageKm] = useState(0);
  const [fuelType, setFuelType] = useState("Benzin");
  const [engineType, setEngineType] = useState("Atmosfer");
  const [transmission, setTransmission] = useState("Avtomat");
  const [bodyType, setBodyType] = useState("");
  const [driveType, setDriveType] = useState("");
  const [color, setColor] = useState("");
  const [vehicleCondition, setVehicleCondition] = useState("");
  const [engineVolumeCc, setEngineVolumeCc] = useState<number | "">("");
  const [interiorMaterial, setInteriorMaterial] = useState("");
  const [hasSunroof, setHasSunroof] = useState(false);
  const [creditAvailable, setCreditAvailable] = useState(false);
  const [barterAvailable, setBarterAvailable] = useState(false);
  const [seatHeating, setSeatHeating] = useState(false);
  const [seatCooling, setSeatCooling] = useState(false);
  const [camera360, setCamera360] = useState(false);
  const [parkingSensors, setParkingSensors] = useState(false);
  const [adaptiveCruise, setAdaptiveCruise] = useState(false);
  const [laneAssist, setLaneAssist] = useState(false);
  const [ownersCount, setOwnersCount] = useState<number | "">("");
  const [hasServiceBook, setHasServiceBook] = useState(false);
  const [hasRepairHistory, setHasRepairHistory] = useState(false);
  const vinVerified = false;
  const sellerVerified = false;
  const [media, setMedia] = useState<MediaProtocolInput>(initialMedia);
  const [planType, setPlanType] = useState<PlanType>("free");
  const launchPromo = useLaunchPromo();
  const planPriceLabel = useCallback(
    (planId: PlanType) =>
      launchPromo.active && planId !== "free"
        ? "Pulsuz (kampaniya)"
        : formatListingPlanPrice(planId, typeof priceAzn === "number" ? priceAzn : undefined),
    [launchPromo.active, priceAzn]
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TrustApiResponse | null>(null);
  const [vehicleValidationVisible, setVehicleValidationVisible] = useState(false);
  const [mediaValidationVisible, setMediaValidationVisible] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<string[]>([]);

  // ── Image upload state ──────────────────────────────────────────────────
  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPlan = useMemo(
    () => LISTING_PLANS.find((plan) => plan.id === planType) ?? LISTING_PLANS[0],
    [planType]
  );
  const minimumRequiredImages = useMemo(() => Math.min(currentPlan.maxImages, 8), [currentPlan.maxImages]);
  const mediaCheck = useMemo(
    () => validateMediaProtocol(media, { minimumImageCount: minimumRequiredImages, requireVideo: false }),
    [media, minimumRequiredImages]
  );
  const vehicleStepErrors = useMemo(() => {
    const errors: string[] = [];
    if (!title.trim()) errors.push("Elan başlığını daxil edin.");
    if (!make.trim()) errors.push("Markanı daxil edin.");
    if (!model.trim()) errors.push("Modeli daxil edin.");
    if (!priceAzn || priceAzn <= 0) errors.push("Qiyməti 0-dan böyük daxil edin.");
    if (!city.trim()) errors.push("Şəhəri seçin.");
    if (vin.trim() && !VIN_PATTERN.test(vin.trim().toUpperCase())) {
      errors.push("VIN kodu 17 simvol olmalı və I/O/Q hərflərini içerməməlidir.");
    }
    if (!declaredMileageKm && declaredMileageKm !== 0) {
      errors.push("Yürüş məlumatını daxil edin.");
    } else if (declaredMileageKm < 0) {
      errors.push("Yürüş mənfi ola bilməz.");
    }
    if (engineVolumeCc !== "" && engineVolumeCc < 0) {
      errors.push("Mühərrik həcmi mənfi ola bilməz.");
    }
    if (ownersCount !== "" && ownersCount < 1) {
      errors.push("Sahib sayı 1 və ya daha çox olmalıdır.");
    }
    if (year < 1950 || year > 2026) {
      errors.push("Avtomobil ilini düzgün daxil edin.");
    }
    return errors;
  }, [city, declaredMileageKm, engineVolumeCc, make, model, ownersCount, priceAzn, title, vin, year]);
  const availableModels = useMemo(() => getModelsForMake(make), [make]);
  const availableEngineTypes = useMemo(() => getCompatibleEngineTypes(fuelType), [fuelType]);
  const availableTransmissions = useMemo(() => getCompatibleTransmissions(fuelType), [fuelType]);
  const isElectricPowertrain = fuelType === "Elektrik";

  function updateBoolean(field: keyof MediaProtocolInput, value: boolean) {
    setMedia((prev) => ({ ...prev, [field]: value }));
  }

  function handleVehicleNext() {
    setVehicleValidationVisible(true);
    if (vehicleStepErrors.length > 0) return;
    setReviewErrors([]);
    setStep("Plan");
  }

  function handleMediaNext() {
    setMediaValidationVisible(true);
    if (!mediaCheck.isComplete) return;
    setReviewErrors([]);
    setStep("Avtomobil");
  }

  function handlePlanNext() {
    setReviewErrors([]);
    setStep("Yoxlama");
  }

  const applyVehicleAiSuggestion = useCallback((suggestion: VehicleAiSuggestion) => {
    if (suggestion.title) setTitle(suggestion.title);
    if (suggestion.make) setMake(suggestion.make);
    if (suggestion.model) setModel(suggestion.model);
    if (suggestion.year) setYear(suggestion.year);
    if (suggestion.color) setColor(suggestion.color);
    if (suggestion.bodyType) setBodyType(suggestion.bodyType);
    if (suggestion.fuelType) setFuelType(suggestion.fuelType);
    if (suggestion.engineType) setEngineType(suggestion.engineType);
    if (suggestion.transmission) setTransmission(suggestion.transmission);
    if (suggestion.driveType) setDriveType(suggestion.driveType);
    if (suggestion.vehicleCondition) setVehicleCondition(suggestion.vehicleCondition);
    if (suggestion.vin) setVin(suggestion.vin);
    if (suggestion.declaredMileageKm !== undefined) setDeclaredMileageKm(suggestion.declaredMileageKm);
    if (suggestion.priceAzn) setPriceAzn(suggestion.priceAzn);
    if (suggestion.description?.trim()) setDescription(suggestion.description.trim());
    if (suggestion.mediaAngles) {
      setMedia((prev) => ({
        ...prev,
        imageCount: uploadedImages.length,
        hasFrontAngle: suggestion.mediaAngles?.hasFrontAngle ?? prev.hasFrontAngle,
        hasRearAngle: suggestion.mediaAngles?.hasRearAngle ?? prev.hasRearAngle,
        hasLeftSide: suggestion.mediaAngles?.hasLeftSide ?? prev.hasLeftSide,
        hasRightSide: suggestion.mediaAngles?.hasRightSide ?? prev.hasRightSide,
        hasDashboard: suggestion.mediaAngles?.hasDashboard ?? prev.hasDashboard,
        hasInterior: suggestion.mediaAngles?.hasInterior ?? prev.hasInterior,
        hasOdometer: suggestion.mediaAngles?.hasOdometer ?? prev.hasOdometer,
        hasTrunk: suggestion.mediaAngles?.hasTrunk ?? prev.hasTrunk
      }));
    }
  }, [uploadedImages.length]);

  const handleImageFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const plan = LISTING_PLANS.find((p) => p.id === planType);
      const maxImages = plan?.maxImages ?? 8;

      setUploadProcessing(true);
      setUploadErrors([]);
      const newErrors: string[] = [];
      const newImages: ProcessedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        if (uploadedImages.length + newImages.length >= maxImages) {
          newErrors.push(`Maksimum ${maxImages} şəkil əlavə etmək olar (bu plan: ${plan?.nameAz}).`);
          break;
        }
        const result = await processImageForUpload(files[i]);
        if (result.ok) {
          newImages.push(result);
        } else {
          newErrors.push(`${files[i].name}: ${result.error}`);
        }
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
      setUploadErrors(newErrors);
      setMedia((prev) => ({
        ...prev,
        imageCount: uploadedImages.length + newImages.length
      }));
      setUploadProcessing(false);
    },
    [planType, uploadedImages]
  );

  const removeUploadedImage = useCallback((index: number) => {
    setUploadedImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setMedia((m) => ({ ...m, imageCount: next.length }));
      return next;
    });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setReviewErrors([]);
    setVehicleValidationVisible(true);
    setMediaValidationVisible(true);

    if (!mediaCheck.isComplete) {
      setStep("Mediya");
      return;
    }

    if (vehicleStepErrors.length > 0) {
      setStep("Avtomobil");
      return;
    }

    setSubmitting(true);
    try {
    await trackEvent("listing_publish_attempted", { vin, city, sellerVerified, vinVerified });

    const response = await fetch("/api/trust/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: vin || crypto.randomUUID(),
        title,
        priceAzn,
        city,
        vehicle: { vin, make, model, year, declaredMileageKm },
        vinVerified,
        sellerVerified,
        mediaProtocol: media
      })
    });

    if (response.status === 401) {
      router.push("/login?next=/publish");
      return;
    }

    const payload = (await response.json()) as TrustApiResponse;
    if (payload.ok) {
      await trackEvent("listing_published", { vin, city, trustScore: payload.trustScore ?? null });
      const imageUrls = await Promise.all(uploadedImages.map(async (entry) => await fileToDataUrl(entry.file)));
      const imageHashes = uploadedImages.map((entry) => entry.perceptualHash);

      const createResponse = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() || `${make} ${model} üçün yaradılan elan.`,
          vinInfoUrl: vinInfoType === "link" ? vinInfoUrl.trim() || undefined : undefined,
          vinDocumentRef: vinInfoType === "document" ? vinDocumentRef.trim() || undefined : undefined,
          serviceHistoryUrl: serviceHistoryType === "link" ? serviceHistoryUrl.trim() || undefined : undefined,
          serviceHistoryDocumentRef:
            serviceHistoryType === "document" ? serviceHistoryDocumentRef.trim() || undefined : undefined,
          priceAzn,
          city,
          fuelType,
          engineType,
          transmission,
          bodyType: bodyType || undefined,
          driveType: driveType || undefined,
          color: color || undefined,
          condition: vehicleCondition || undefined,
          engineVolumeCc: engineVolumeCc === "" ? undefined : engineVolumeCc,
          interiorMaterial: interiorMaterial || undefined,
          hasSunroof,
          creditAvailable,
          barterAvailable,
          seatHeating,
          seatCooling,
          camera360,
          parkingSensors,
          adaptiveCruise,
          laneAssist,
          ownersCount: ownersCount === "" ? undefined : ownersCount,
          hasServiceBook,
          hasRepairHistory,
          sellerType: "private",
          vehicle: { vin: vin.trim().toUpperCase(), make, model, year, declaredMileageKm },
          vinVerified,
          sellerVerified,
          mediaProtocol: media,
          imageUrls,
          imageHashes,
          planType
        })
      });

      const createPayload = (await createResponse.json()) as {
        ok: boolean;
        id?: string;
        error?: string;
        errors?: string[];
        paymentRequired?: boolean;
      };
      if (createPayload.ok && createPayload.id) {
        if (createPayload.paymentRequired) {
          const paymentResponse = await fetch("/api/payments/listing-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: createPayload.id,
              planType,
              source: "publish"
            })
          });
          const paymentPayload = (await paymentResponse.json()) as {
            ok: boolean;
            error?: string;
            checkoutUrl?: string;
            status?: string;
          };
          if (paymentPayload.ok && paymentPayload.checkoutUrl) {
            router.push(paymentPayload.checkoutUrl);
            router.refresh();
            return;
          }
          if (paymentPayload.ok && paymentPayload.status === "succeeded") {
            // Açılış kampaniyası ilə plan bank ödənişi olmadan dərhal aktivləşdi.
            router.push(`/listings/${createPayload.id}`);
            router.refresh();
            return;
          }
          setReviewErrors([paymentPayload.error || "Ödəniş axını başladılmadı."]);
          setSubmitting(false);
          return;
        }

        router.push(`/listings/${createPayload.id}`);
        router.refresh();
        return;
      }
      setReviewErrors(createPayload.errors ?? [createPayload.error || "Elan yaradıla bilmədi."]);
      return;
    }
    setReviewErrors(payload.errors ?? ["Məlumatlarda düzəliş lazımdır."]);
    } catch (error) {
      console.error("publish submit error:", error);
      setReviewErrors(["Şəbəkə xətası baş verdi. Zəhmət olmasa yenidən cəhd edin."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white/60 py-6 sm:py-10">
      <div className="mx-auto min-w-0 max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Elan yerləşdir</h1>
          <p className="mt-2 text-slate-500">
            Şəkil yükləyin — AI sahələri doldurmağa kömək edəcək. Siz yalnız yoxlayıb redaktə edin.
          </p>
        </div>

        <ListingPublishEaseTip variant="vehicle" className="mb-6" />

        <div className="mb-6 rounded-2xl border border-[#0057FF]/20 bg-[#0057FF]/5 p-4 text-sm text-slate-700">
          Avtomobilinizi hərrac formatında satmaq istəyirsinizsə, ayrıca{" "}
          <Link href="/auction/sell" className="font-semibold text-[#0057FF] hover:underline">Auksion lotu yarat</Link>{" "}
          axınından istifadə edin. Auksionda əsas satış ödənişi platformadan keçmir.
        </div>
        <div className="mb-6 rounded-2xl border glass-panel border-slate-900/10 p-4 text-sm text-slate-700">
          EkoMobil məlumatların yerləşdirilməsi və yayımlanması üçün platformadır. Elan məzmununun düzgünlüyü, tamlığı və
          aktuallığı satıcının məsuliyyətindədir. VIN, servis tarixçəsi və digər istinadların əlavə edilməsi elanın
          keyfiyyətini yüksəldir.
        </div>

        <StepIndicator current={step} />

        {!result ? (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Step 1: Media */}
            {step === "Avtomobil" && (
              <div className="card space-y-5 p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Avtomobil məlumatları</h2>

                <div>
                  <label className="label">Elan başlığı</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="məs: Toyota Corolla 2019" required />
                </div>

                <div>
                  <label className="label">Təsvir</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field min-h-[120px]"
                    placeholder="Avtomobilin vəziyyəti, komplektasiya, servis tarixçəsi və digər detallar. AI analizi işə salınıbsa, təsvir avtomatik doldurulur — redaktə edə bilərsiniz."
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Xarici link, telefon və ya mesajlaşma tətbiqi əlaqələri əlavə etməyin — belə elanlar avtomatik rədd edilir.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Marka</label>
                    <select
                      value={make}
                      onChange={(e) => {
                        setMake(e.target.value);
                        setModel("");
                      }}
                      className="input-field"
                      required
                    >
                      <option value="">Marka seçin</option>
                      {CAR_MAKES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="input-field"
                      disabled={!make}
                      required
                    >
                      <option value="">{make ? "Model seçin" : "Əvvəl marka seçin"}</option>
                      {availableModels.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={seatHeating}
                      onChange={(e) => setSeatHeating(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    Oturacaq isidilməsi
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={seatCooling}
                      onChange={(e) => setSeatCooling(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    Oturacaq soyudulması
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={camera360}
                      onChange={(e) => setCamera360(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    360 kamera
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={parkingSensors}
                      onChange={(e) => setParkingSensors(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    Park sensoru
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={adaptiveCruise}
                      onChange={(e) => setAdaptiveCruise(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    Adaptive cruise control
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={laneAssist}
                      onChange={(e) => setLaneAssist(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    Zolaq izləmə (lane assist)
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Sahib sayı</label>
                    <input
                      type="number"
                      value={ownersCount}
                      onChange={(e) => setOwnersCount(e.target.value ? Number(e.target.value) : "")}
                      className="input-field"
                      min={1}
                      placeholder="məs: 2"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasServiceBook}
                        onChange={(e) => setHasServiceBook(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#0057FF]"
                      />
                      Servis kitabçası var
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={hasRepairHistory}
                        onChange={(e) => setHasRepairHistory(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#0057FF]"
                      />
                      Təmir tarixçəsi var
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">İl</label>
                    <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field" min={1990} max={2026} required />
                  </div>
                  <div>
                    <label className="label">Yürüş (km)</label>
                    <input type="number" value={declaredMileageKm || ""} onChange={(e) => setDeclaredMileageKm(Number(e.target.value))} className="input-field" placeholder="72000" required />
                  </div>
                </div>

                <div>
                  <label className="label">VIN kodu</label>
                  <input
                    value={vin}
                    onChange={(e) => {
                      const normalized = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
                      setVin(normalized);
                    }}
                    className="input-field font-mono tracking-widest uppercase"
                    placeholder="17 simvol"
                    maxLength={17}
                  />
                  <p className="mt-1 text-xs text-slate-400">VIN kodu 17 simvol olmalıdır (I/O/Q hərfləri istifadə edilmir).</p>
                  <p className="mt-1 text-xs text-[#0057FF]">
                    VIN məcburi deyil, amma əlavə edildikdə elan alıcı üçün daha etibarlı görünür.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-900/10 bg-white/60 p-4">
                  <p className="text-sm font-medium text-slate-900">Etibarı artıran məlumatlar (tövsiyə olunur)</p>
                  <p className="mt-1 text-xs text-slate-600">
                    VIN və servis tarixçəsini açıq link və ya sənəd istinadı kimi paylaşa bilərsiniz. Bu məlumatlar alıcı üçün
                    daha şəffaf təqdimat yaradır.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">VIN məlumat formatı</label>
                      <select
                        value={vinInfoType}
                        onChange={(e) => setVinInfoType(e.target.value as "link" | "document")}
                        className="input-field"
                      >
                        <option value="link">Açıq link</option>
                        <option value="document">Sənəd istinadı</option>
                      </select>
                      {vinInfoType === "link" ? (
                        <input
                          type="url"
                          value={vinInfoUrl}
                          onChange={(e) => setVinInfoUrl(e.target.value)}
                          className="input-field mt-2"
                          placeholder="https://..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={vinDocumentRef}
                          onChange={(e) => setVinDocumentRef(e.target.value)}
                          className="input-field mt-2"
                          placeholder="Məs: vin-report.pdf və ya sənəd ID"
                        />
                      )}
                    </div>
                    <div>
                      <label className="label">Servis tarixçə formatı</label>
                      <select
                        value={serviceHistoryType}
                        onChange={(e) => setServiceHistoryType(e.target.value as "link" | "document")}
                        className="input-field"
                      >
                        <option value="link">Açıq link</option>
                        <option value="document">Sənəd istinadı</option>
                      </select>
                      {serviceHistoryType === "link" ? (
                        <input
                          type="url"
                          value={serviceHistoryUrl}
                          onChange={(e) => setServiceHistoryUrl(e.target.value)}
                          className="input-field mt-2"
                          placeholder="https://..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={serviceHistoryDocumentRef}
                          onChange={(e) => setServiceHistoryDocumentRef(e.target.value)}
                          className="input-field mt-2"
                          placeholder="Məs: service-history.pdf və ya sənəd ID"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="label">Qiymət (₼)</label>
                    <input type="number" value={priceAzn || ""} onChange={(e) => setPriceAzn(Number(e.target.value))} className="input-field" placeholder="19800" required />
                  </div>
                  <div>
                    <label className="label">Yanacaq</label>
                    <select
                      value={fuelType}
                      onChange={(e) => {
                        const nextFuelType = e.target.value;
                        setFuelType(nextFuelType);
                        const nextCompatibleEngines = getCompatibleEngineTypes(nextFuelType);
                        const nextCompatibleTransmissions = getCompatibleTransmissions(nextFuelType);
                        setEngineType(nextCompatibleEngines[0] ?? "");
                        setTransmission(nextCompatibleTransmissions[0] ?? "");
                        if (nextFuelType === "Elektrik") {
                          setEngineVolumeCc("");
                        }
                      }}
                      className="input-field"
                    >
                      {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Mühərrik növü</label>
                    <select value={engineType} onChange={(e) => setEngineType(e.target.value)} className="input-field">
                      {availableEngineTypes.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ötürücü</label>
                    <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="input-field">
                      {availableTransmissions.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Ban növü</label>
                    <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="input-field">
                      <option value="">Seçilməyib</option>
                      {BODY_TYPES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ötürmə növü</label>
                    <select value={driveType} onChange={(e) => setDriveType(e.target.value)} className="input-field">
                      <option value="">Seçilməyib</option>
                      {DRIVE_TYPES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Rəng</label>
                    <select value={color} onChange={(e) => setColor(e.target.value)} className="input-field">
                      <option value="">Seçilməyib</option>
                      {COLORS.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Vəziyyət</label>
                    <select value={vehicleCondition} onChange={(e) => setVehicleCondition(e.target.value)} className="input-field">
                      <option value="">Seçilməyib</option>
                      {CONDITIONS.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Mühərrik həcmi (cc)</label>
                    <input
                      type="number"
                      value={engineVolumeCc}
                      onChange={(e) => setEngineVolumeCc(e.target.value ? Number(e.target.value) : "")}
                      className="input-field"
                      placeholder="məs: 2000"
                      min={0}
                      disabled={isElectricPowertrain}
                    />
                    {isElectricPowertrain && (
                      <p className="mt-1 text-xs text-slate-400">Elektrik avtomobillərdə mühərrik həcmi tətbiq edilmir.</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Salon materialı</label>
                    <select value={interiorMaterial} onChange={(e) => setInteriorMaterial(e.target.value)} className="input-field">
                      <option value="">Seçilməyib</option>
                      {INTERIOR_MATERIALS.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasSunroof}
                    onChange={(e) => setHasSunroof(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0057FF]"
                  />
                  Lyuku var
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={creditAvailable}
                      onChange={(e) => setCreditAvailable(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    Kreditə uyğundur
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={barterAvailable}
                      onChange={(e) => setBarterAvailable(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#0057FF]"
                    />
                    Barter mümkündür
                  </label>
                </div>

                <div>
                  <label className="label">Şəhər</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field">
                    {["Bakı", "Sumqayıt", "Gəncə", "Lənkəran", "Mingəçevir", "Digər"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {vehicleValidationVisible && vehicleStepErrors.length > 0 && (
                  <div className="rounded-xl alert-warning border p-4">
                    <p className="text-sm font-medium text-amber-700">Növbəti mərhələyə keçmək üçün bunları tamamlayın:</p>
                    <ul className="mt-2 space-y-1">
                      {vehicleStepErrors.map((error) => (
                        <li key={error} className="text-sm text-amber-700">
                          - {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setStep("Mediya")} className="btn-secondary flex-1 justify-center py-3">
                  Geri
                </button>
                <button type="button" onClick={handleVehicleNext} className="btn-primary flex-1 justify-center py-3">
                  Növbəti: Plan
                </button>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle info */}
            {step === "Mediya" && (
              <div className="card space-y-6 p-4 sm:p-8">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Mediya protokolu</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Daha çox foto = daha yüksək etibar balı = daha sürətli satış
                  </p>
                </div>

                {/* Photo angle guide */}
                <div className="rounded-2xl border border-[#0057FF]/20 bg-[#0057FF]/4 p-4">
                  <p className="mb-3 text-sm font-semibold text-[#0057FF]">📸 Tövsiyə olunan şəkil ardıcıllığı</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      {
                        label: "Ön sol 3/4", priority: "Əsas", tip: "Gündüz çəkin, kölgəsiz. Arxa fon sadə.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <rect x="8" y="18" width="60" height="20" rx="4" fill="#0057FF" opacity=".15"/>
                            <rect x="12" y="20" width="52" height="16" rx="3" fill="#0057FF" opacity=".25"/>
                            <ellipse cx="22" cy="38" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="22" cy="38" rx="4" ry="4" fill="#94a3b8"/>
                            <ellipse cx="58" cy="38" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="58" cy="38" rx="4" ry="4" fill="#94a3b8"/>
                            <rect x="14" y="18" width="24" height="10" rx="2" fill="#bae6fd" opacity=".7"/>
                            <rect x="42" y="18" width="16" height="10" rx="2" fill="#bae6fd" opacity=".7"/>
                            <path d="M5 32 L14 24" stroke="#0057FF" strokeWidth="2" strokeDasharray="3,2"/>
                            <circle cx="5" cy="33" r="3" fill="#0057FF"/>
                            <text x="1" y="46" fontSize="7" fill="#0057FF" fontWeight="bold">📷</text>
                          </svg>
                        )
                      },
                      {
                        label: "Arxa sağ 3/4", priority: "Əsas", tip: "Nömrə boşqabı aydın görünməlidir.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <rect x="8" y="18" width="60" height="20" rx="4" fill="#7c3aed" opacity=".15"/>
                            <rect x="12" y="20" width="52" height="16" rx="3" fill="#7c3aed" opacity=".25"/>
                            <ellipse cx="22" cy="38" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="22" cy="38" rx="4" ry="4" fill="#94a3b8"/>
                            <ellipse cx="58" cy="38" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="58" cy="38" rx="4" ry="4" fill="#94a3b8"/>
                            <rect x="42" y="22" width="22" height="8" rx="1.5" fill="#bae6fd" opacity=".7"/>
                            <rect x="28" y="28" width="24" height="4" rx="1" fill="#f1f5f9" stroke="#94a3b8" strokeWidth=".5"/>
                            <path d="M75 32 L66 24" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3,2"/>
                            <circle cx="75" cy="33" r="3" fill="#7c3aed"/>
                            <text x="71" y="46" fontSize="7" fill="#7c3aed" fontWeight="bold">📷</text>
                          </svg>
                        )
                      },
                      {
                        label: "Sol profil", priority: "Vacib", tip: "Tam boy — ön təkərdən arxa təkərə qədər.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <rect x="6" y="18" width="66" height="18" rx="3" fill="#16a34a" opacity=".15"/>
                            <rect x="10" y="20" width="58" height="14" rx="2" fill="#16a34a" opacity=".2"/>
                            <ellipse cx="19" cy="36" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="19" cy="36" rx="4" ry="4" fill="#94a3b8"/>
                            <ellipse cx="61" cy="36" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="61" cy="36" rx="4" ry="4" fill="#94a3b8"/>
                            <rect x="14" y="17" width="20" height="11" rx="2" fill="#bae6fd" opacity=".7"/>
                            <rect x="38" y="17" width="20" height="11" rx="2" fill="#bae6fd" opacity=".5"/>
                            <path d="M40 48 L40 36" stroke="#16a34a" strokeWidth="2" strokeDasharray="3,2"/>
                            <circle cx="40" cy="50" r="2.5" fill="#16a34a"/>
                            <text x="36" y="58" fontSize="6" fill="#16a34a" fontWeight="bold">📷</text>
                          </svg>
                        )
                      },
                      {
                        label: "Sağ profil", priority: "Vacib", tip: "Sol profil ilə eyni şərtlər.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <rect x="6" y="18" width="66" height="18" rx="3" fill="#d97706" opacity=".15"/>
                            <rect x="10" y="20" width="58" height="14" rx="2" fill="#d97706" opacity=".2"/>
                            <ellipse cx="19" cy="36" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="19" cy="36" rx="4" ry="4" fill="#94a3b8"/>
                            <ellipse cx="61" cy="36" rx="7" ry="7" fill="#334155"/>
                            <ellipse cx="61" cy="36" rx="4" ry="4" fill="#94a3b8"/>
                            <rect x="14" y="17" width="20" height="11" rx="2" fill="#bae6fd" opacity=".7"/>
                            <rect x="38" y="17" width="20" height="11" rx="2" fill="#bae6fd" opacity=".5"/>
                            <path d="M40 48 L40 36" stroke="#d97706" strokeWidth="2" strokeDasharray="3,2"/>
                            <circle cx="40" cy="50" r="2.5" fill="#d97706"/>
                          </svg>
                        )
                      },
                      {
                        label: "Salon / ön panel", priority: "Vacib", tip: "Sürücü qapısı açıq. Ön panel, sükan və ekranlar aydın görünsün.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <rect x="10" y="10" width="60" height="32" rx="4" fill="#0057FF" opacity=".1" stroke="#0057FF" strokeWidth=".5"/>
                            <rect x="14" y="13" width="34" height="18" rx="2" fill="#bae6fd" opacity=".5"/>
                            <circle cx="28" cy="31" r="8" fill="#334155" opacity=".3"/>
                            <circle cx="28" cy="31" r="5" fill="#64748b" opacity=".4"/>
                            <rect x="18" y="25" width="14" height="1.5" rx=".7" fill="#0057FF" opacity=".6"/>
                            <rect x="52" y="13" width="14" height="25" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth=".5"/>
                            <rect x="54" y="15" width="10" height="12" rx="1" fill="#bae6fd" opacity=".5"/>
                          </svg>
                        )
                      },
                      {
                        label: "Arxa oturacaq", priority: "Tövsiyə", tip: "Arxa salon rahatlığı.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <rect x="10" y="8" width="60" height="36" rx="4" fill="#7c3aed" opacity=".08" stroke="#7c3aed" strokeWidth=".5"/>
                            <rect x="15" y="12" width="20" height="28" rx="3" fill="#e2e8f0" stroke="#cbd5e1"/>
                            <rect x="45" y="12" width="20" height="28" rx="3" fill="#e2e8f0" stroke="#cbd5e1"/>
                            <rect x="17" y="30" width="16" height="8" rx="2" fill="#cbd5e1"/>
                            <rect x="47" y="30" width="16" height="8" rx="2" fill="#cbd5e1"/>
                          </svg>
                        )
                      },
                      {
                        label: "Yürüş sayğacı", priority: "Vacib", tip: "Yürüş açıq oxunmalıdır. Gecə rejimi yox.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <circle cx="40" cy="28" r="18" fill="#334155" opacity=".9"/>
                            <circle cx="40" cy="28" r="14" fill="#1e293b"/>
                            <text x="28" y="31" fontSize="8" fill="#f1f5f9" fontWeight="bold">72 415</text>
                            <text x="33" y="39" fontSize="5" fill="#94a3b8">km</text>
                            <path d="M40 18 L42 28" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )
                      },
                      {
                        label: "Mühərrik", priority: "Tövsiyə", tip: "Kapoton açıq. Yağ-su doldurma qapaqları görünsün.",
                        icon: (
                          <svg viewBox="0 0 80 50" className="h-12 w-full" fill="none">
                            <rect x="8" y="14" width="64" height="26" rx="4" fill="#334155" opacity=".15"/>
                            <rect x="14" y="18" width="52" height="18" rx="3" fill="#475569" opacity=".3"/>
                            <rect x="20" y="21" width="18" height="12" rx="2" fill="#64748b" opacity=".5"/>
                            <rect x="42" y="21" width="18" height="12" rx="2" fill="#64748b" opacity=".4"/>
                            <circle cx="30" cy="20" r="3" fill="#0057FF" opacity=".7"/>
                            <circle cx="50" cy="20" r="3" fill="#f59e0b" opacity=".7"/>
                            <path d="M8 14 L72 14" stroke="#94a3b8" strokeWidth=".5"/>
                          </svg>
                        )
                      }
                    ].map((angle) => (
                      <div key={angle.label} className="rounded-xl border glass-panel border-slate-900/10 p-2.5 text-center">
                        <div className="mb-1.5">{angle.icon}</div>
                        <p className="text-xs font-semibold text-slate-700 leading-tight">{angle.label}</p>
                        <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          angle.priority === "Əsas" ? "bg-[#0057FF]/10 text-[#0057FF]" :
                          angle.priority === "Vacib" ? "bg-emerald-500/10 text-emerald-700" :
                          "bg-white/63 text-slate-500"
                        }`}>
                          {angle.priority}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-400 leading-tight">{angle.tip}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-[#0057FF]/70">
                    💡 Xarici şəkillər gündüz çəkiləndə, iç şəkillər yaxşı işıqlı mühitdə çəkiləndə alıcının marağı 2x artır.
                  </p>
                </div>

                {/* ── Real image upload ───────────────────────────────────── */}
                <PublishImageUploadZone
                  uploadedImages={uploadedImages}
                  maxImages={currentPlan.maxImages}
                  minimumRequiredImages={minimumRequiredImages}
                  uploadProcessing={uploadProcessing}
                  uploadErrors={uploadErrors}
                  fileInputRef={fileInputRef}
                  onSelectFiles={(files) => void handleImageFiles(files)}
                  onRemoveImage={removeUploadedImage}
                />

                <ListingAiAnalyzePanel
                  analysisContext="vehicle"
                  planType={planType}
                  externalImages={uploadedImages}
                  onApplyVehicle={applyVehicleAiSuggestion}
                />

                {/* ── Angle checklist ─────────────────────────────────────── */}
                <div>
                  <label className="label mb-3">Çəkilmiş bucaqları işarələyin</label>
                  <p className="mb-3 text-xs text-slate-500">
                    &quot;Ön panel&quot; dedikdə sükan, cihazlar paneli və mərkəzi ekranın göründüyü ön salon şəkli nəzərdə tutulur.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {mediaAngles.map(({ key, label }) => (
                      <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        media[key] ? "border-[#0057FF]/40 bg-[#0057FF]/5" : "glass-panel border-slate-900/10 hover:border-slate-900/15"
                      }`}>
                        <input
                          type="checkbox"
                          checked={media[key] as boolean}
                          onChange={(e) => updateBoolean(key, e.target.checked)}
                          className="h-4 w-4 rounded accent-[#0057FF]"
                        />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        {media[key] && (
                          <svg className="ml-auto h-4 w-4 text-[#0057FF]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Video duration ──────────────────────────────────────── */}
                {LISTING_PLANS.find(p => p.id === planType)?.videoEnabled && (
                  <div>
                    <label className="label">Mühərrik videosu (saniyə)</label>
                    <input
                      type="number"
                      value={media.engineVideoDurationSec}
                      onChange={(e) => setMedia((p) => ({ ...p, engineVideoDurationSec: Number(e.target.value) }))}
                      className="input-field"
                      min={0}
                      max={60}
                    />
                    <p className="mt-1 text-xs text-slate-400">15–30 saniyə tövsiyə olunur. Video yükləmə müddəti ödəniş sonrası aktivləşir.</p>
                  </div>
                )}

                {mediaValidationVisible && !mediaCheck.isComplete && (
                  <div className="rounded-xl alert-warning border p-4">
                    <p className="text-sm font-medium text-amber-700 mb-2">Çatışmayan tələblər:</p>
                    <ul className="space-y-1">
                      {mediaCheck.missingRequirements.map((req) => (
                        <li key={req} className="text-sm text-amber-700 flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-amber-500/100 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={handleMediaNext} className="btn-primary w-full justify-center py-3 sm:flex-1">
                    Növbəti: Avtomobil
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Plan selection */}
            {step === "Plan" && (
              <div className="card space-y-6 p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Elan planı</h2>
                <p className="text-sm text-slate-500">Elanınızın necə görünməsini seçin</p>

                {/* Free plan limit note */}
                <div className="rounded-xl border border-slate-900/10 bg-white/60 px-4 py-3 text-xs text-slate-600 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-700">Pulsuz plan:</span>{" "}
                    eyni anda yalnız <strong>{FREE_LISTING_CONCURRENT_LIMIT} aktiv pulsuz elan</strong> yerləşdirə bilərsiniz.
                    İkinci elan üçün ilk elanın müddəti bitməli, yaxud Standart/VIP plan seçilməlidir.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Şəkil limiti:</span> Pulsuz plan üçün də indi {LISTING_PLANS[0].maxImages} şəkil əlavə etmək olar.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Salon iseniz</span> — aylıq abunəliyi olan <a href="/pricing#dealer" className="text-[#0057FF] underline">Salon planına</a> keçin: toplu CSV yükləmə + CRM.
                  </p>
                </div>

                {launchPromo.active && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
                    {launchPromo.badge ?? "Açılış kampaniyası — bütün planlar hazırda pulsuzdur"}
                  </div>
                )}

                {planType !== "free" && !launchPromo.active && (
                  <div className="rounded-xl border border-[#0057FF]/20 bg-[#0057FF]/5 px-4 py-3 text-sm text-[#0057FF]">
                    Ödənişli plan seçiləndə elan əvvəlcə qaralama kimi yaradılır, Kapital Bank ödənişi tamamlanandan sonra aktivləşir.
                  </div>
                )}

                <div className="grid gap-3">
                  {LISTING_PLANS.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition ${
                        planType === plan.id
                          ? "border-[#0057FF] bg-[#0057FF]/5"
                          : "glass-panel border-slate-900/10 hover:border-slate-900/15"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={planType === plan.id}
                        onChange={() => setPlanType(plan.id)}
                        className="mt-1 h-4 w-4 accent-[#0057FF]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{plan.nameAz}</span>
                          <span className="font-bold text-slate-900 shrink-0">
                            {planPriceLabel(plan.id)}
                          </span>
                        </div>
                        {/* Plan details chips */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">
                            {plan.durationDays} gün aktiv
                          </span>
                          <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">
                            {plan.maxImages} şəkil
                          </span>
                          {plan.priceAzn > 0 && (
                            <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">
                              birdəfəlik ödəniş
                            </span>
                          )}
                          <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">
                            {plan.maxImageSizeKb >= 1024 ? `${(plan.maxImageSizeKb/1024).toFixed(0)} MB` : `${plan.maxImageSizeKb} KB`}/foto
                          </span>
                          {plan.videoEnabled && (
                            <span className="rounded-md bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-xs">
                              {plan.maxVideos} video ({plan.maxVideoSizeMb} MB)
                            </span>
                          )}
                          {plan.featuredInHome && (
                            <span className="rounded-md bg-amber-500/15 text-amber-700 px-2 py-0.5 text-xs font-medium">
                              ⭐ Ön səhifə
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep("Avtomobil")} className="btn-secondary flex-1 justify-center py-3">
                    Geri
                  </button>
                  <button type="button" onClick={handlePlanNext} className="btn-primary flex-1 justify-center py-3">
                    Növbəti: Yoxlama
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === "Yoxlama" && (
              <div className="card space-y-6 p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Məlumatları yoxlayın</h2>

                <div className="rounded-xl bg-white/60 divide-y divide-slate-900/10">
                  {[
                    ["Elan başlığı", title],
                    ["Marka / Model", `${make} ${model}`],
                    ["İl / Yürüş", `${year} / ${declaredMileageKm.toLocaleString()} km`],
                    ["Yanacaq / Mühərrik / Ötürücü", `${fuelType} / ${engineType} / ${transmission}`],
                    ["Ban / Ötürmə", `${bodyType || "—"} / ${driveType || "—"}`],
                    ["Rəng / Vəziyyət", `${color || "—"} / ${vehicleCondition || "—"}`],
                    ["Mühərrik / Salon", `${engineVolumeCc === "" ? "—" : `${engineVolumeCc} cc`} / ${interiorMaterial || "—"}`],
                    ["Lyuk", hasSunroof ? "Var" : "Yox"],
                    ["Kredit / Barter", `${creditAvailable ? "Var" : "Yox"} / ${barterAvailable ? "Var" : "Yox"}`],
                    ["Komfort paket", `${seatHeating ? "Isitmə" : "—"}, ${seatCooling ? "Soyutma" : "—"}, ${camera360 ? "360 kamera" : "—"}, ${parkingSensors ? "Park sensoru" : "—"}`],
                    ["Sürücü asistentləri", `${adaptiveCruise ? "ACC" : "—"} / ${laneAssist ? "Lane assist" : "—"}`],
                    ["Sahib / Tarixçə", `${ownersCount === "" ? "—" : ownersCount} / ${hasServiceBook ? "Servis kitabçası" : "—"} / ${hasRepairHistory ? "Təmir tarixçəsi" : "—"}`],
                    ["Qiymət", `${priceAzn.toLocaleString()} ₼`],
                    ["Şəhər", city],
                    ["VIN", vin || "—"],
                    ["VIN məlumatı", vinInfoType === "link" ? vinInfoUrl || "—" : vinDocumentRef || "—"],
                    [
                      "Servis tarixçəsi",
                      serviceHistoryType === "link" ? serviceHistoryUrl || "—" : serviceHistoryDocumentRef || "—"
                    ],
                    ["Mediya", mediaCheck.isComplete ? "Tam ✓" : `Çatışmayan: ${mediaCheck.missingRequirements.length}`],
                    ["Plan", `${LISTING_PLANS.find((p) => p.id === planType)?.nameAz ?? planType} (${planPriceLabel(planType)})`]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>

                {reviewErrors.length > 0 && (
                  <div className="rounded-xl alert-warning border p-4">
                    <p className="text-sm font-medium text-amber-700">Dərc etməzdən əvvəl bunları düzəldin:</p>
                    <ul className="mt-2 space-y-1">
                      {reviewErrors.map((error) => (
                        <li key={error} className="text-sm text-amber-700">
                          - {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep("Plan")} className="btn-secondary flex-1 justify-center py-3">
                    Geri
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
                    {submitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Yoxlanılır...
                      </>
                    ) : planType === "free" || launchPromo.active ? "Elan yerləşdir" : "Ödənişə keç"}
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Result screen */
          <div className="card space-y-6 p-4 text-center sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Elan qəbul edildi!</h2>
              <p className="mt-2 text-slate-500">Etibar xalınız: <strong className="text-[#0057FF]">{result.trustScore}/100</strong></p>
            </div>
            {result.signals?.mileageFlag && (
              <div className="rounded-xl alert-warning border p-4 text-sm text-amber-700 text-left">
                <strong>Yürüş xəbərdarlığı:</strong> {result.signals.mileageFlag.message}
              </div>
            )}
            <button onClick={() => { setResult(null); setStep("Mediya"); }} className="btn-secondary">
              Yenidən cəhd et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
