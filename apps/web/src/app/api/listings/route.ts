import { NextResponse } from "next/server";
import { buildTrustSignals, estimateTrustScore } from "@/lib/trust-score";
import { ListingInput, validateListingInput } from "@/lib/listing";
import { getServerSessionUser } from "@/lib/auth";
import { isPaidPlan } from "@/lib/listing-plans";
import { createListingFallback, createListingRecord, listListings } from "@/server/listing-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = {
    city: searchParams.get("city") || undefined,
    make: searchParams.get("make") || undefined,
    search: searchParams.get("q") || undefined,
    fuelType: searchParams.get("fuelType") || undefined,
    transmission: searchParams.get("transmission") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minYear: searchParams.get("minYear") ? Number(searchParams.get("minYear")) : undefined,
    maxYear: searchParams.get("maxYear") ? Number(searchParams.get("maxYear")) : undefined,
    vinVerified: searchParams.get("vinVerified") === "1" ? true : undefined,
    sellerVerified: searchParams.get("sellerVerified") === "1" ? true : undefined,
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
  const payload = (await req.json()) as ListingInput & {
    description?: string;
    fuelType?: string;
    transmission?: string;
    sellerType?: "private" | "dealer";
    planType?: "free" | "standard" | "vip";
  };

  const validation = validateListingInput(payload);
  if (!validation.isValid) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  const sessionUser = await getServerSessionUser();
  const requestedPlanType = payload.planType ?? "free";
  if (isPaidPlan(requestedPlanType) && !sessionUser) {
    return NextResponse.json(
      { ok: false, error: "Paid plan seçimi üçün əvvəlcə daxil olun." },
      { status: 401 }
    );
  }

  const trustSignals = buildTrustSignals({
    vehicle: payload.vehicle,
    vinVerified: payload.vinVerified,
    sellerVerified: payload.sellerVerified,
    mediaComplete: validation.mediaComplete,
    latestMileageEvent: payload.latestMileageEvent
  });

  const trustScore = estimateTrustScore(trustSignals);
  const createInput = {
    ownerUserId: sessionUser?.id,
    title: payload.title,
    description: payload.description?.trim() || "",
    make: payload.vehicle.make,
    model: payload.vehicle.model,
    year: payload.vehicle.year,
    city: payload.city,
    priceAzn: payload.priceAzn,
    mileageKm: payload.vehicle.declaredMileageKm,
    fuelType: payload.fuelType || "Benzin",
    transmission: payload.transmission || "Avtomat",
    vin: payload.vehicle.vin,
    sellerType: payload.sellerType || "private",
    planType: isPaidPlan(requestedPlanType) ? "free" : requestedPlanType,
    status: (isPaidPlan(requestedPlanType) ? "draft" : "active") as "draft" | "active",
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
