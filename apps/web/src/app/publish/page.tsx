"use client";

import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  processImageForUpload,
  type ProcessedImage
} from "@/lib/image-processor";
import { ListingAiAnalyzePanel } from "@/components/listings/listing-ai-analyze-panel";
import { PublishAuthGate, PublishLoginRequired } from "@/components/listings/publish-auth-notice";
import { PublishImageAngleTagger } from "@/components/listings/publish-image-angle-tagger";
import { VehiclePhotoGuide } from "@/components/listings/vehicle-photo-guide";
import {
  photoGuideCategoryFromBodyType,
  type VehiclePhotoGuideCategory
} from "@/lib/vehicle-photo-guide";
import {
  buildMediaAnglesFromTags,
  type ImagePhotoTag
} from "@/lib/vehicle-media-angles";
import type { VehicleAiSuggestion } from "@/lib/ai/listing-vision-types";
import { useRequireAuth } from "@/hooks/use-require-auth";

const STEPS = ["Şəkillər", "Məlumatlar", "Plan", "Yayımla"] as const;
type Step = (typeof STEPS)[number];

interface PublishErrorGuide {
  step: Step;
  messages: string[];
}

function resolvePublishErrorStep(messages: string[]): Step {
  const text = messages.join(" ").toLocaleLowerCase("az");
  if (/şəkil|rakurs|tərəf|panel|salon|baqaj|video|odometr|sayğac|cihazlar|ən azı \d+ şəkil/.test(text)) {
    return "Şəkillər";
  }
  if (/plan limiti|pulsuz plan|ödəniş|checkout|payment/.test(text)) {
    return "Plan";
  }
  if (/başlıq|qiymət|şəhər|vin|yürüş|avtomobil ili|mətn|link|kontakt|marka|model|məlumat/.test(text)) {
    return "Məlumatlar";
  }
  return "Yayımla";
}

function PublishStepErrorAlert({ guide }: { guide: PublishErrorGuide | null }) {
  if (!guide || guide.messages.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-800">
        Yayımlama dayandırıldı — «{guide.step}» addımında düzəldin:
      </p>
      <ul className="mt-2 space-y-1">
        {guide.messages.map((error) => (
          <li key={error} className="text-sm text-amber-700">
            • {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

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

export default function PublishPage() {
  const router = useRouter();
  const { loading: authLoading, ready: authReady } = useRequireAuth("/publish");
  const [step, setStep] = useState<Step>("Şəkillər");
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
  const [photoGuideCategory, setPhotoGuideCategory] = useState<VehiclePhotoGuideCategory>("car");
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
  const planPriceLabel = useCallback(
    (planId: PlanType) =>
      formatListingPlanPrice(planId, typeof priceAzn === "number" && priceAzn > 0 ? priceAzn : undefined),
    [priceAzn]
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TrustApiResponse | null>(null);
  const [vehicleValidationVisible, setVehicleValidationVisible] = useState(false);
  const [mediaValidationVisible, setMediaValidationVisible] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<string[]>([]);
  const [publishGuide, setPublishGuide] = useState<PublishErrorGuide | null>(null);

  // ── Image upload state ──────────────────────────────────────────────────
  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [imageAngleTags, setImageAngleTags] = useState<Array<ImagePhotoTag | null>>([]);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!("scrollRestoration" in history)) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  const currentPlan = useMemo(
    () => LISTING_PLANS.find((plan) => plan.id === planType) ?? LISTING_PLANS[0],
    [planType]
  );
  const minimumRequiredImages = useMemo(() => Math.min(currentPlan.maxImages, 8), [currentPlan.maxImages]);
  const resolvedMedia = useMemo(
    () => buildMediaAnglesFromTags(imageAngleTags, uploadedImages.length, media),
    [imageAngleTags, uploadedImages.length, media]
  );
  const mediaCheck = useMemo(
    () => validateMediaProtocol(resolvedMedia, { minimumImageCount: minimumRequiredImages, requireVideo: false }),
    [resolvedMedia, minimumRequiredImages]
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

  const goToStep = useCallback((next: Step) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setStep(next);
  }, []);

  const showPublishErrors = useCallback(
    (messages: string[]) => {
      const normalized = messages.length > 0 ? messages : ["Elan yayımlana bilmədi. Zəhmət olmasa yenidən cəhd edin."];
      const step = resolvePublishErrorStep(normalized);
      setReviewErrors(normalized);
      setPublishGuide({ step, messages: normalized });
      if (step === "Şəkillər") setMediaValidationVisible(true);
      if (step === "Məlumatlar") setVehicleValidationVisible(true);
      goToStep(step);
    },
    [goToStep]
  );

  useLayoutEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0 });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
    const frame = requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  function handleVehicleNext() {
    setVehicleValidationVisible(true);
    if (vehicleStepErrors.length > 0) return;
    setReviewErrors([]);
    goToStep("Plan");
  }

  function handleMediaNext() {
    setMediaValidationVisible(true);
    if (!mediaCheck.isComplete) return;
    setReviewErrors([]);
    goToStep("Məlumatlar");
  }

  function handlePlanNext() {
    setReviewErrors([]);
    goToStep("Yayımla");
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
    if (suggestion.bodyType) {
      const category = photoGuideCategoryFromBodyType(suggestion.bodyType);
      if (category) setPhotoGuideCategory(category);
    }
  }, []);

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

      setUploadedImages((prev) => {
        const nextImages = [...prev, ...newImages];
        setImageAngleTags((prevTags) => {
          const nextTags = [...prevTags, ...newImages.map(() => null)];
          setMedia((mediaPrev) => buildMediaAnglesFromTags(nextTags, nextImages.length, mediaPrev));
          return nextTags;
        });
        return nextImages;
      });
      setUploadErrors(newErrors);
      setUploadProcessing(false);
    },
    [planType, uploadedImages.length]
  );

  const assignImageAngle = useCallback((index: number, angle: ImagePhotoTag | null) => {
    setImageAngleTags((prevTags) => {
      const nextTags = [...prevTags];
      nextTags[index] = angle;
      setMedia((mediaPrev) => buildMediaAnglesFromTags(nextTags, nextTags.length, mediaPrev));
      return nextTags;
    });
  }, []);

  const removeUploadedImage = useCallback((index: number) => {
    setUploadedImages((prev) => {
      const nextImages = prev.filter((_, i) => i !== index);
      setImageAngleTags((prevTags) => {
        const nextTags = prevTags.filter((_, i) => i !== index);
        setMedia((mediaPrev) => buildMediaAnglesFromTags(nextTags, nextImages.length, mediaPrev));
        return nextTags;
      });
      return nextImages;
    });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setReviewErrors([]);
    setPublishGuide(null);
    setVehicleValidationVisible(true);
    setMediaValidationVisible(true);

    if (!mediaCheck.isComplete) {
      showPublishErrors(mediaCheck.missingRequirements);
      return;
    }

    if (vehicleStepErrors.length > 0) {
      showPublishErrors(vehicleStepErrors);
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
        mediaProtocol: resolvedMedia
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
          mediaProtocol: resolvedMedia,
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
      if (createResponse.status === 401) {
        router.push("/login?next=/publish");
        return;
      }
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
            router.push(`/listings/${createPayload.id}`);
            router.refresh();
            return;
          }
          showPublishErrors([paymentPayload.error || "Ödəniş axını başladılmadı."]);
          setSubmitting(false);
          return;
        }

        router.push(`/listings/${createPayload.id}`);
        router.refresh();
        return;
      }
      showPublishErrors(createPayload.errors ?? [createPayload.error || "Elan yaradıla bilmədi."]);
      return;
    }
    showPublishErrors(payload.errors ?? ["Məlumatlarda düzəliş lazımdır."]);
    } catch (error) {
      console.error("publish submit error:", error);
      showPublishErrors(["Şəbəkə xətası baş verdi. Zəhmət olmasa yenidən cəhd edin."]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-white/60 py-10">
        <div className="mx-auto max-w-2xl px-4">
          <PublishAuthGate loading={authLoading} />
          {!authLoading && <PublishLoginRequired returnPath="/publish" />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white/60 py-6 sm:py-10">
      <div className="mx-auto min-w-0 max-w-2xl px-4">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Maşını sat</h1>
          <p className="mt-1.5 text-sm text-slate-500">4 addım — şəkil, məlumat, plan, yayımla</p>
        </div>

        <StepIndicator current={step} />

        {!result ? (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Step 1: Media */}
            {step === "Məlumatlar" && (
              <div className="card space-y-5 p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Maşın haqqında</h2>

                {publishGuide?.step === "Məlumatlar" && <PublishStepErrorAlert guide={publishGuide} />}

                <ListingAiAnalyzePanel
                  analysisContext="vehicle"
                  planType={planType}
                  maxImages={currentPlan.maxImages}
                  externalImages={uploadedImages}
                  autoApply
                  onApplyVehicle={applyVehicleAiSuggestion}
                />

                <div>
                  <label className="label">Elan başlığı</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="məs: Toyota Corolla 2019" required />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Marka</label>
                    <input
                      list="publish-car-makes"
                      value={make}
                      onChange={(e) => {
                        setMake(e.target.value);
                        setModel("");
                      }}
                      className="input-field"
                      placeholder="Marka seçin və ya yazın"
                      required
                    />
                    <datalist id="publish-car-makes">
                      {CAR_MAKES.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-xs text-slate-400">Siyahıda yoxdursa əl ilə yaza bilərsiniz.</p>
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <input
                      list={availableModels.length > 0 ? "publish-car-models" : undefined}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="input-field"
                      placeholder={make.trim() ? "Model seçin və ya yazın" : "Əvvəl marka daxil edin"}
                      disabled={!make.trim()}
                      required
                    />
                    {availableModels.length > 0 && (
                      <datalist id="publish-car-models">
                        {availableModels.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    )}
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Qiymət (₼)</label>
                    <input type="number" value={priceAzn || ""} onChange={(e) => setPriceAzn(Number(e.target.value))} className="input-field" placeholder="19800" required />
                  </div>
                  <div>
                    <label className="label">Şəhər</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field">
                      {["Bakı", "Sumqayıt", "Gəncə", "Lənkəran", "Mingəçevir", "Digər"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                        if (nextFuelType === "Elektrik") setEngineVolumeCc("");
                      }}
                      className="input-field"
                    >
                      {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Mühərrik</label>
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

                <details className="rounded-xl border border-slate-900/10 bg-white/50">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
                    Əlavə məlumat (istəyə bağlı)
                  </summary>
                  <div className="space-y-4 border-t border-slate-900/10 px-4 pb-4 pt-3">
                <div>
                  <label className="label">Təsvir</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field min-h-[90px]"
                    placeholder="Maşının vəziyyəti və avadanlığı"
                  />
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

                <div>
                  <label className="label">VIN kodu</label>
                  <input
                    value={vin}
                    onChange={(e) => {
                      const normalized = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
                      setVin(normalized);
                    }}
                    className="input-field font-mono tracking-widest uppercase"
                    placeholder="17 simvol (istəyə bağlı)"
                    maxLength={17}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">VIN məlumatı</label>
                    {vinInfoType === "link" ? (
                      <input type="url" value={vinInfoUrl} onChange={(e) => setVinInfoUrl(e.target.value)} className="input-field" placeholder="Link" />
                    ) : (
                      <input type="text" value={vinDocumentRef} onChange={(e) => setVinDocumentRef(e.target.value)} className="input-field" placeholder="Sənəd" />
                    )}
                  </div>
                  <div>
                    <label className="label">Servis tarixçəsi</label>
                    {serviceHistoryType === "link" ? (
                      <input type="url" value={serviceHistoryUrl} onChange={(e) => setServiceHistoryUrl(e.target.value)} className="input-field" placeholder="Link" />
                    ) : (
                      <input type="text" value={serviceHistoryDocumentRef} onChange={(e) => setServiceHistoryDocumentRef(e.target.value)} className="input-field" placeholder="Sənəd" />
                    )}
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
                  </div>
                </details>

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
                <button type="button" onClick={() => goToStep("Şəkillər")} className="btn-secondary flex-1 justify-center py-3">
                  Geri
                </button>
                <button type="button" onClick={handleVehicleNext} className="btn-primary flex-1 justify-center py-3">
                  Davam et
                </button>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle info */}
            {step === "Şəkillər" && (
              <div className="card space-y-5 p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Şəkillər</h2>

                {publishGuide?.step === "Şəkillər" && <PublishStepErrorAlert guide={publishGuide} />}

                <PublishImageAngleTagger
                  uploadedImages={uploadedImages}
                  imageAngleTags={imageAngleTags}
                  media={media}
                  maxImages={currentPlan.maxImages}
                  planNameAz={currentPlan.nameAz}
                  minimumRequiredImages={minimumRequiredImages}
                  uploadProcessing={uploadProcessing}
                  uploadErrors={uploadErrors}
                  fileInputRef={fileInputRef}
                  onSelectFiles={(files) => void handleImageFiles(files)}
                  onRemoveImage={removeUploadedImage}
                  onAssignAngle={assignImageAngle}
                />

                <VehiclePhotoGuide
                  bodyType={bodyType}
                  category={photoGuideCategory}
                  onCategoryChange={setPhotoGuideCategory}
                />

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
                    Davam et
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Plan selection */}
            {step === "Plan" && (
              <div className="card space-y-5 p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Plan seçin</h2>

                {publishGuide?.step === "Plan" && <PublishStepErrorAlert guide={publishGuide} />}

                <details className="rounded-xl border border-slate-900/10 bg-white/50 text-xs text-slate-600">
                  <summary className="cursor-pointer px-4 py-2.5 font-medium text-slate-700">Plan qaydaları</summary>
                  <div className="space-y-2 border-t border-slate-900/10 px-4 py-3">
                    <p>
                      <strong>Pulsuz</strong> — {LISTING_PLANS[0].durationDays} gün aktiv, {LISTING_PLANS[0].maxImages} şəkil,
                      eyni anda {FREE_LISTING_CONCURRENT_LIMIT} aktiv elan.
                    </p>
                    <p>
                      <strong>Standart</strong> — {LISTING_PLANS[1].durationDays} gün aktiv, {LISTING_PLANS[1].maxImages} şəkil,
                      birdəfəlik ödəniş (qiymət avtomobildən asılıdır).
                    </p>
                    <p>
                      <strong>VIP</strong> — {LISTING_PLANS[2].durationDays} gün aktiv, {LISTING_PLANS[2].maxImages} şəkil,
                      birdəfəlik ödəniş, ön səhifədə vurğulanır.
                    </p>
                  </div>
                </details>

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
                  <button type="button" onClick={() => goToStep("Məlumatlar")} className="btn-secondary flex-1 justify-center py-3">
                    Geri
                  </button>
                  <button type="button" onClick={handlePlanNext} className="btn-primary flex-1 justify-center py-3">
                    Davam et
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === "Yayımla" && (
              <div className="card space-y-5 p-4 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Yoxlayın və yayımlayın</h2>

                {publishGuide?.step === "Yayımla" && <PublishStepErrorAlert guide={publishGuide} />}

                <div className="rounded-xl bg-white/60 divide-y divide-slate-900/10">
                  {[
                    ["Başlıq", title],
                    ["Avtomobil", `${make} ${model} · ${year}`],
                    ["Yürüş", `${declaredMileageKm.toLocaleString()} km`],
                    ["Qiymət", `${priceAzn.toLocaleString()} ₼`],
                    ["Şəhər", city],
                    ["Yanacaq", `${fuelType} · ${transmission}`],
                    ["Şəkillər", `${uploadedImages.length} şəkil`],
                    ["Plan", `${LISTING_PLANS.find((p) => p.id === planType)?.nameAz ?? planType} (${planPriceLabel(planType)})`]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>

                {publishGuide?.step === "Yayımla" && reviewErrors.length > 0 && (
                  <div className="rounded-xl alert-warning border p-4">
                    <p className="text-sm font-medium text-amber-700">Elan yayımlanmadı:</p>
                    <ul className="mt-2 space-y-1">
                      {reviewErrors.map((error) => (
                        <li key={error} className="text-sm text-amber-700">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => goToStep("Plan")} className="btn-secondary flex-1 justify-center py-3">
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
                    ) : planType === "free" ? "Elan yerləşdir" : "Ödənişə keç"}
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
            <button onClick={() => { setResult(null); goToStep("Şəkillər"); }} className="btn-secondary">
              Yenidən cəhd et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
