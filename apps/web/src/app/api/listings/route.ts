import { NextResponse } from "next/server";
import { buildTrustSignals, estimateTrustScore } from "@/lib/trust-score";
import { ListingInput, validateListingInput, validatePartListingInput, type PartListingPublishInput } from "@/lib/listing";
import { getServerSessionUser } from "@/lib/auth";
import { getCompatibleEngineTypes, getCompatibleTransmissions } from "@/lib/car-data";
import { FREE_LISTING_CONCURRENT_LIMIT, isPaidPlan } from "@/lib/listing-plans";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getEffectivePartsPlan } from "@/server/business-plan-store";
import {
  createListingFallback,
  countConcurrentFreeVehicleListingsForUser,
  createListingRecord,
  hasRecentPartDuplicate,
  hasRecentVehicleDuplicate,
  listListings
} from "@/server/listing-store";
import type { VehicleIdentity } from "@/lib/vehicle";
import type { ListingKind } from "@/lib/marketplace-types";

const SUSPICIOUS_TEXT_PATTERNS: RegExp[] = [
  /whatsapp/i,
  /telegram/i,
  /t\.me\//i,
  /instagram\.com/i,
  /@[\w.]{3,}/i,
  /https?:\/\//i,
  /\+?\d[\d\s\-()]{6,}/
];

function containsSuspiciousText(value: string | undefined): boolean {
  if (!value) return false;
  return SUSPICIOUS_TEXT_PATTERNS.some((pattern) => pattern.test(value));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = {
    city: searchParams.get("city") || undefined,
    make: searchParams.get("make") || undefined,
    model: searchParams.get("model") || undefined,
    search: searchParams.get("q") || undefined,
    fuelType: searchParams.get("fuelType") || undefined,
    engineType: searchParams.get("engineType") || undefined,
    transmission: searchParams.get("transmission") || undefined,
    bodyType: searchParams.get("bodyType") || undefined,
    driveType: searchParams.get("driveType") || undefined,
    color: searchParams.get("color") || undefined,
    condition: searchParams.get("condition") || undefined,
    minEngineVolumeCc: searchParams.get("minEngineVolumeCc") ? Number(searchParams.get("minEngineVolumeCc")) : undefined,
    maxEngineVolumeCc: searchParams.get("maxEngineVolumeCc") ? Number(searchParams.get("maxEngineVolumeCc")) : undefined,
    interiorMaterial: searchParams.get("interiorMaterial") || undefined,
    hasSunroof: searchParams.get("hasSunroof") === "1" ? true : undefined,
    creditAvailable: searchParams.get("creditAvailable") === "1" ? true : undefined,
    barterAvailable: searchParams.get("barterAvailable") === "1" ? true : undefined,
    vinProvided: searchParams.get("vinProvided") === "1" ? true : undefined,
    seatHeating: searchParams.get("seatHeating") === "1" ? true : undefined,
    seatCooling: searchParams.get("seatCooling") === "1" ? true : undefined,
    camera360: searchParams.get("camera360") === "1" ? true : undefined,
    parkingSensors: searchParams.get("parkingSensors") === "1" ? true : undefined,
    adaptiveCruise: searchParams.get("adaptiveCruise") === "1" ? true : undefined,
    laneAssist: searchParams.get("laneAssist") === "1" ? true : undefined,
    maxOwnersCount: searchParams.get("maxOwnersCount") ? Number(searchParams.get("maxOwnersCount")) : undefined,
    hasServiceBook: searchParams.get("hasServiceBook") === "1" ? true : undefined,
    hasRepairHistory: searchParams.get("hasRepairHistory") === "1" ? true : undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minYear: searchParams.get("minYear") ? Number(searchParams.get("minYear")) : undefined,
    maxYear: searchParams.get("maxYear") ? Number(searchParams.get("maxYear")) : undefined,
    minMileage: searchParams.get("minMileage") ? Number(searchParams.get("minMileage")) : undefined,
    maxMileage: searchParams.get("maxMileage") ? Number(searchParams.get("maxMileage")) : undefined,
    vinVerified: searchParams.get("vinVerified") === "1" ? true : undefined,
    sellerVerified: searchParams.get("sellerVerified") === "1" ? true : undefined,
    sellerType: (searchParams.get("sellerType") as "private" | "dealer" | null) ?? undefined,
    partCategory: searchParams.get("partCategory") || undefined,
    partSubcategory: searchParams.get("partSubcategory") || undefined,
    partBrand: searchParams.get("partBrand") || undefined,
    partCondition: (searchParams.get("partCondition") as "new" | "used" | "refurbished" | null) ?? undefined,
    partAuthenticity: (searchParams.get("partAuthenticity") as "original" | "oem" | "aftermarket" | null) ?? undefined,
    inStock: searchParams.get("inStock") === "1" ? true : undefined,
    listingKind: (searchParams.get("listingKind") as ListingKind | null) ?? undefined,
    sort: (searchParams.get("sort") as
      | "trust_desc"
      | "price_asc"
      | "price_desc"
      | "year_desc"
      | "mileage_asc"
      | "recent"
      | null) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 9
  };

  const result = await listListings(query);
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  const payload = (await req.json()) as
    | (ListingInput & {
        description?: string;
        fuelType?: string;
        engineType?: string;
        transmission?: string;
        bodyType?: string;
        driveType?: string;
        color?: string;
        condition?: string;
        engineVolumeCc?: number;
        interiorMaterial?: string;
        hasSunroof?: boolean;
        creditAvailable?: boolean;
        barterAvailable?: boolean;
        seatHeating?: boolean;
        seatCooling?: boolean;
        camera360?: boolean;
        parkingSensors?: boolean;
        adaptiveCruise?: boolean;
        laneAssist?: boolean;
        ownersCount?: number;
        hasServiceBook?: boolean;
        hasRepairHistory?: boolean;
        imageUrls?: string[];
        sellerType?: "private" | "dealer";
        planType?: "free" | "standard" | "vip";
      })
    | (PartListingPublishInput & {
        description?: string;
        imageUrls?: string[];
        sellerType?: "private" | "dealer";
        planType?: "free" | "standard" | "vip";
      });

  const sessionUser = await getServerSessionUser();
  const requestedPlanType = (payload as { planType?: "free" | "standard" | "vip" }).planType ?? "free";
  const clientIp = getClientIp(req);

  // Listing creation is always account-bound to reduce multi-account abuse and improve accountability.
  if (!sessionUser) {
    return NextResponse.json(
      { ok: false, error: "Elan yerləşdirmək üçün hesabınıza daxil olun." },
      { status: 401 }
    );
  }

  const limiterKey = `listing-create:${sessionUser.id}:${clientIp}`;
  const limitCheck = await checkRateLimit(
    limiterKey,
    requestedPlanType === "free" ? 6 : 20,
    24 * 60
  );
  if (!limitCheck.ok) {
    return rateLimitResponse(limitCheck.retryAfterSeconds ?? 60);
  }

  if ("listingKind" in payload && payload.listingKind === "part") {
    const partPayload = payload as PartListingPublishInput & {
      description?: string;
      imageUrls?: string[];
      sellerType?: "private" | "dealer";
      planType?: "free" | "standard" | "vip";
    };
    if ((partPayload.sellerType ?? "private") === "dealer" && !["dealer", "admin"].includes(sessionUser.role)) {
      return NextResponse.json(
        { ok: false, error: "Mağaza/diler kimi hissə elanı üçün dealer hesabı tələb olunur." },
        { status: 403 }
      );
    }

    const effectivePartsPlan =
      (partPayload.sellerType ?? "private") === "dealer"
        ? await getEffectivePartsPlan(sessionUser.id)
        : { perListingMaxImages: 4 };

    const validation = validatePartListingInput(partPayload, {
      maxImageCount: effectivePartsPlan.perListingMaxImages
    });
    if (!validation.isValid) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }

    const category = partPayload.partCategory?.trim() || "Avtomobil hissəsi";
    const partLine = partPayload.partName?.trim() || "Ümumi";
    if (containsSuspiciousText(partPayload.title) || containsSuspiciousText(partPayload.description)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Elan mətnində xarici əlaqə/link və ya şübhəli kontakt məlumatı var. Bu məlumatları platforma daxili əlaqə ilə paylaşın."
        },
        { status: 400 }
      );
    }
    const hasDuplicatePart = await hasRecentPartDuplicate({
      userId: sessionUser.id,
      partOemCode: partPayload.partOemCode,
      partSku: partPayload.partSku,
      partCategory: category,
      partName: partLine,
      globalScope: requestedPlanType === "free"
    });
    if (hasDuplicatePart) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Bu məhsul üçün son 90 gün ərzində eyni və ya oxşar elan artıq mövcuddur. Mövcud elanı redaktə edin."
        },
        { status: 409 }
      );
    }
    const dummyVehicle: VehicleIdentity = {
      vin: "PARTS-NOVIN",
      make: category,
      model: partLine,
      year: new Date().getFullYear(),
      declaredMileageKm: 0
    };

    const trustSignals = buildTrustSignals({
      vehicle: dummyVehicle,
      vinVerified: false,
      sellerVerified: partPayload.sellerVerified,
      mediaComplete: validation.mediaComplete
    });
    const trustScore = estimateTrustScore(trustSignals);

    const createInput = {
      ownerUserId: sessionUser?.id,
      title: partPayload.title.trim(),
      description: partPayload.description?.trim() || "",
      make: category,
      model: partLine,
      year: new Date().getFullYear(),
      city: partPayload.city.trim(),
      priceAzn: partPayload.priceAzn,
      mileageKm: 0,
      fuelType: "Digər",
      engineType: undefined,
      transmission: "—",
      vin: "PARTS-NOVIN",
      sellerType: partPayload.sellerType || "private",
      planType: isPaidPlan(requestedPlanType) ? "free" : requestedPlanType,
      status: (isPaidPlan(requestedPlanType) ? "draft" : "pending_review") as "draft" | "pending_review",
      listingKind: "part" as const,
      partCategory: category,
      partSubcategory: partPayload.partSubcategory?.trim() || undefined,
      partBrand: partPayload.partBrand?.trim() || undefined,
      partCondition: partPayload.partCondition || undefined,
      partAuthenticity: partPayload.partAuthenticity || undefined,
      partOemCode: partPayload.partOemCode?.trim() || undefined,
      partSku: partPayload.partSku?.trim() || undefined,
      partQuantity: partPayload.partQuantity ?? 0,
      partCompatibility: partPayload.partCompatibility?.trim() || undefined,
      imageUrls: partPayload.imageUrls,
      trust: {
        trustScore,
        vinVerified: false,
        sellerVerified: trustSignals.sellerVerified,
        mediaComplete: trustSignals.mediaComplete,
        mileageFlagSeverity: trustSignals.mileageFlag?.severity,
        mileageFlagMessage: trustSignals.mileageFlag?.message,
        serviceHistorySummary: "Hissə elanı — VIN tətbiq olunmur",
        riskSummary: "Media və satıcı siqnalları yoxlanıb"
      }
    };

    try {
      const created = await createListingRecord(createInput);
      return NextResponse.json({
        ok: true,
        id: created.id,
        trustScore,
        listingKind: "part",
        paymentRequired: isPaidPlan(requestedPlanType),
        requestedPlanType
      });
    } catch {
      const created = createListingFallback(createInput);
      return NextResponse.json({
        ok: true,
        id: created.id,
        trustScore,
        fallback: true,
        listingKind: "part",
        paymentRequired: isPaidPlan(requestedPlanType),
        requestedPlanType
      });
    }
  }

  const vehiclePayload = payload as ListingInput & {
    description?: string;
    fuelType?: string;
    engineType?: string;
    transmission?: string;
    bodyType?: string;
    driveType?: string;
    color?: string;
    condition?: string;
    engineVolumeCc?: number;
    interiorMaterial?: string;
    hasSunroof?: boolean;
    creditAvailable?: boolean;
    barterAvailable?: boolean;
    seatHeating?: boolean;
    seatCooling?: boolean;
    camera360?: boolean;
    parkingSensors?: boolean;
    adaptiveCruise?: boolean;
    laneAssist?: boolean;
    ownersCount?: number;
    hasServiceBook?: boolean;
    hasRepairHistory?: boolean;
    imageUrls?: string[];
    sellerType?: "private" | "dealer";
    planType?: "free" | "standard" | "vip";
  };

  const validation = validateListingInput(vehiclePayload);
  if (!validation.isValid) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }
  if (containsSuspiciousText(vehiclePayload.title) || containsSuspiciousText(vehiclePayload.description)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Elan mətnində xarici əlaqə/link və ya şübhəli kontakt məlumatı var. Bu məlumatları platforma daxili əlaqə ilə paylaşın."
      },
      { status: 400 }
    );
  }

  const hasDuplicateVehicle = await hasRecentVehicleDuplicate({
    userId: sessionUser.id,
    vin: vehiclePayload.vehicle.vin,
    make: vehiclePayload.vehicle.make,
    model: vehiclePayload.vehicle.model,
    year: vehiclePayload.vehicle.year,
    globalScope: requestedPlanType === "free"
  });
  if (hasDuplicateVehicle) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Bu avtomobil üçün son 90 gün ərzində elan artıq mövcuddur. Dublikat yaratmaq əvəzinə mövcud elanı yeniləyin."
      },
      { status: 409 }
    );
  }

  if (!isPaidPlan(requestedPlanType)) {
    const currentFreeListings = await countConcurrentFreeVehicleListingsForUser(sessionUser.id);
    if (currentFreeListings >= FREE_LISTING_CONCURRENT_LIMIT) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Pulsuz plan limiti dolub: eyni anda maksimum ${FREE_LISTING_CONCURRENT_LIMIT} aktiv/yoxlamada pulsuz elan ola bilər. ` +
            "Yeni pulsuz elan üçün mövcud elanın müddəti bitməli, deaktiv/arxiv edilməli və ya planı yüksəldilməlidir."
        },
        { status: 409 }
      );
    }
  }

  const trustSignals = buildTrustSignals({
    vehicle: vehiclePayload.vehicle,
    vinVerified: vehiclePayload.vinVerified,
    sellerVerified: vehiclePayload.sellerVerified,
    mediaComplete: validation.mediaComplete,
    latestMileageEvent: vehiclePayload.latestMileageEvent
  });

  const trustScore = estimateTrustScore(trustSignals);
  const normalizedFuelType = vehiclePayload.fuelType || "Benzin";
  const compatibleEngineTypes = getCompatibleEngineTypes(normalizedFuelType);
  const requestedEngineType = vehiclePayload.engineType?.trim();
  const normalizedEngineType =
    requestedEngineType && compatibleEngineTypes.some((item) => item === requestedEngineType)
      ? requestedEngineType
      : compatibleEngineTypes[0] ?? undefined;
  const compatibleTransmissions = getCompatibleTransmissions(normalizedFuelType);
  const requestedTransmission = vehiclePayload.transmission || "Avtomat";
  const normalizedTransmission =
    compatibleTransmissions.some((item) => item === requestedTransmission)
      ? requestedTransmission
      : compatibleTransmissions[0] ?? requestedTransmission;

  const createInput = {
    ownerUserId: sessionUser?.id,
    title: vehiclePayload.title,
    description: vehiclePayload.description?.trim() || "",
    make: vehiclePayload.vehicle.make,
    model: vehiclePayload.vehicle.model,
    year: vehiclePayload.vehicle.year,
    city: vehiclePayload.city,
    priceAzn: vehiclePayload.priceAzn,
    mileageKm: vehiclePayload.vehicle.declaredMileageKm,
    fuelType: normalizedFuelType,
    engineType: normalizedEngineType,
    transmission: normalizedTransmission,
    vin: vehiclePayload.vehicle.vin.trim().toUpperCase(),
    vinProvided: Boolean(vehiclePayload.vehicle.vin.trim()),
    sellerType: vehiclePayload.sellerType || "private",
    bodyType: vehiclePayload.bodyType?.trim() || undefined,
    driveType: vehiclePayload.driveType?.trim() || undefined,
    color: vehiclePayload.color?.trim() || undefined,
    condition: vehiclePayload.condition?.trim() || undefined,
    engineVolumeCc:
      normalizedFuelType !== "Elektrik" &&
      typeof vehiclePayload.engineVolumeCc === "number" &&
      Number.isFinite(vehiclePayload.engineVolumeCc)
        ? Math.max(0, Math.round(vehiclePayload.engineVolumeCc))
        : undefined,
    interiorMaterial: vehiclePayload.interiorMaterial?.trim() || undefined,
    hasSunroof: vehiclePayload.hasSunroof === true ? true : undefined,
    creditAvailable: vehiclePayload.creditAvailable === true ? true : undefined,
    barterAvailable: vehiclePayload.barterAvailable === true ? true : undefined,
    seatHeating: vehiclePayload.seatHeating === true ? true : undefined,
    seatCooling: vehiclePayload.seatCooling === true ? true : undefined,
    camera360: vehiclePayload.camera360 === true ? true : undefined,
    parkingSensors: vehiclePayload.parkingSensors === true ? true : undefined,
    adaptiveCruise: vehiclePayload.adaptiveCruise === true ? true : undefined,
    laneAssist: vehiclePayload.laneAssist === true ? true : undefined,
    ownersCount:
      typeof vehiclePayload.ownersCount === "number" && Number.isFinite(vehiclePayload.ownersCount)
        ? Math.max(1, Math.round(vehiclePayload.ownersCount))
        : undefined,
    hasServiceBook: vehiclePayload.hasServiceBook === true ? true : undefined,
    hasRepairHistory: vehiclePayload.hasRepairHistory === true ? true : undefined,
    planType: isPaidPlan(requestedPlanType) ? "free" : requestedPlanType,
    status: (isPaidPlan(requestedPlanType) ? "draft" : "pending_review") as "draft" | "pending_review",
    listingKind: "vehicle" as const,
    imageUrls: vehiclePayload.imageUrls,
    trust: {
      trustScore,
      vinVerified: trustSignals.vinVerification.status === "verified",
      sellerVerified: trustSignals.sellerVerified,
      mediaComplete: trustSignals.mediaComplete,
      mileageFlagSeverity: trustSignals.mileageFlag?.severity,
      mileageFlagMessage: trustSignals.mileageFlag?.message,
      serviceHistorySummary: trustSignals.vinVerification.status === "verified" ? "Rəsmi yoxlama tamamlandı" : "Gözləyir",
      riskSummary: trustSignals.mileageFlag?.severity === "high_risk" ? "Yüksək risk" : "İlkin yoxlama tamamlandı"
    }
  };

  try {
    const created = await createListingRecord(createInput);
    return NextResponse.json({
      ok: true,
      id: created.id,
      trustScore,
      paymentRequired: isPaidPlan(requestedPlanType),
      requestedPlanType
    });
  } catch {
    const created = createListingFallback(createInput);
    return NextResponse.json({
      ok: true,
      id: created.id,
      trustScore,
      fallback: true,
      paymentRequired: isPaidPlan(requestedPlanType),
      requestedPlanType
    });
  }
}
