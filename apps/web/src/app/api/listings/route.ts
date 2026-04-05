import { NextResponse } from "next/server";
import { buildTrustSignals, estimateTrustScore } from "@/lib/trust-score";
import { ListingInput, validateListingInput, validatePartListingInput, type PartListingPublishInput } from "@/lib/listing";
import { getServerSessionUser } from "@/lib/auth";
import { isPaidPlan } from "@/lib/listing-plans";
import { createListingFallback, createListingRecord, listListings } from "@/server/listing-store";
import type { VehicleIdentity } from "@/lib/vehicle";
import type { ListingKind } from "@/lib/marketplace-types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = {
    city: searchParams.get("city") || undefined,
    make: searchParams.get("make") || undefined,
    model: searchParams.get("model") || undefined,
    search: searchParams.get("q") || undefined,
    fuelType: searchParams.get("fuelType") || undefined,
    transmission: searchParams.get("transmission") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minYear: searchParams.get("minYear") ? Number(searchParams.get("minYear")) : undefined,
    maxYear: searchParams.get("maxYear") ? Number(searchParams.get("maxYear")) : undefined,
    vinVerified: searchParams.get("vinVerified") === "1" ? true : undefined,
    sellerVerified: searchParams.get("sellerVerified") === "1" ? true : undefined,
    sellerType: (searchParams.get("sellerType") as "private" | "dealer" | null) ?? undefined,
    partCategory: searchParams.get("partCategory") || undefined,
    partSubcategory: searchParams.get("partSubcategory") || undefined,
    partBrand: searchParams.get("partBrand") || undefined,
    partCondition: (searchParams.get("partCondition") as "new" | "used" | "refurbished" | null) ?? undefined,
    inStock: searchParams.get("inStock") === "1" ? true : undefined,
    listingKind: (searchParams.get("listingKind") as ListingKind | null) ?? undefined,
    sort: (searchParams.get("sort") as
      | "trust_desc"
      | "price_asc"
      | "price_desc"
      | "year_desc"
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
        transmission?: string;
        sellerType?: "private" | "dealer";
        planType?: "free" | "standard" | "vip";
      })
    | (PartListingPublishInput & {
        description?: string;
        sellerType?: "private" | "dealer";
        planType?: "free" | "standard" | "vip";
      });

  const sessionUser = await getServerSessionUser();
  const requestedPlanType = (payload as { planType?: "free" | "standard" | "vip" }).planType ?? "free";

  if (isPaidPlan(requestedPlanType) && !sessionUser) {
    return NextResponse.json(
      { ok: false, error: "Paid plan seçimi üçün əvvəlcə daxil olun." },
      { status: 401 }
    );
  }

  if ("listingKind" in payload && payload.listingKind === "part") {
    const partPayload = payload as PartListingPublishInput & {
      description?: string;
      sellerType?: "private" | "dealer";
      planType?: "free" | "standard" | "vip";
    };
    const validation = validatePartListingInput(partPayload);
    if (!validation.isValid) {
      return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
    }

    const category = partPayload.partCategory?.trim() || "Avtomobil hissəsi";
    const partLine = partPayload.partName?.trim() || "Ümumi";
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
      transmission: "—",
      vin: "PARTS-NOVIN",
      sellerType: partPayload.sellerType || "private",
      planType: isPaidPlan(requestedPlanType) ? "free" : requestedPlanType,
      status: (isPaidPlan(requestedPlanType) ? "draft" : "active") as "draft" | "active",
      listingKind: "part" as const,
      partCategory: category,
      partSubcategory: partPayload.partSubcategory?.trim() || undefined,
      partBrand: partPayload.partBrand?.trim() || undefined,
      partCondition: partPayload.partCondition || undefined,
      partOemCode: partPayload.partOemCode?.trim() || undefined,
      partSku: partPayload.partSku?.trim() || undefined,
      partQuantity: partPayload.partQuantity ?? 0,
      partCompatibility: partPayload.partCompatibility?.trim() || undefined,
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
    transmission?: string;
    sellerType?: "private" | "dealer";
    planType?: "free" | "standard" | "vip";
  };

  const validation = validateListingInput(vehiclePayload);
  if (!validation.isValid) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const trustSignals = buildTrustSignals({
    vehicle: vehiclePayload.vehicle,
    vinVerified: vehiclePayload.vinVerified,
    sellerVerified: vehiclePayload.sellerVerified,
    mediaComplete: validation.mediaComplete,
    latestMileageEvent: vehiclePayload.latestMileageEvent
  });

  const trustScore = estimateTrustScore(trustSignals);
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
    fuelType: vehiclePayload.fuelType || "Benzin",
    transmission: vehiclePayload.transmission || "Avtomat",
    vin: vehiclePayload.vehicle.vin,
    sellerType: vehiclePayload.sellerType || "private",
    planType: isPaidPlan(requestedPlanType) ? "free" : requestedPlanType,
    status: (isPaidPlan(requestedPlanType) ? "draft" : "active") as "draft" | "active",
    listingKind: "vehicle" as const,
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
