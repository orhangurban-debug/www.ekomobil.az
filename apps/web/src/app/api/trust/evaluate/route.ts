import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { ListingInput, validateListingInput } from "@/lib/listing";
import { enqueueManualReview } from "@/server/review-store";
import { evaluateTrustInput, upsertTrustSignals } from "@/server/trust-store";
import { validateListingOwnership } from "@/server/listing-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`trust-evaluate:${user.id}:${ip}`, 30, 1);
  if (!limit.ok) return rateLimitResponse(60);

  let payload: ListingInput & { listingId?: string };
  try {
    payload = (await req.json()) as ListingInput & { listingId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  const validation = validateListingInput(payload);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        ok: false,
        errors: validation.errors
      },
      { status: 400 }
    );
  }

  // If the caller wants to persist trust signals for an existing listing, they must own it.
  if (payload.listingId) {
    const ownership = await validateListingOwnership(payload.listingId, user.id);
    if (!ownership.ok) {
      return NextResponse.json(
        { ok: false, error: ownership.error ?? "Bu elan üçün icazəniz yoxdur" },
        { status: 403 }
      );
    }
  }

  const evaluated = evaluateTrustInput(payload);
  const signals = {
    ...evaluated.signals,
    mediaComplete: validation.mediaComplete
  };
  const trustScore = evaluated.trustScore;

  let manualReview = null;
  if (signals.mileageFlag?.severity === "high_risk") {
    manualReview = await enqueueManualReview({
      listingId: payload.listingId ?? (payload.vehicle.vin || crypto.randomUUID()),
      reasonCode: signals.mileageFlag.reasonCode,
      message: signals.mileageFlag.message
    });
  }

  if (payload.listingId) {
    try {
      await upsertTrustSignals({
        listingId: payload.listingId,
        trustScore,
        vinVerified: signals.vinVerification.status === "verified",
        sellerVerified: signals.sellerVerified,
        mediaComplete: signals.mediaComplete,
        mileageFlagSeverity: signals.mileageFlag?.severity,
        mileageFlagMessage: signals.mileageFlag?.message,
        serviceHistorySummary: evaluated.serviceHistorySummary,
        riskSummary: evaluated.riskSummary
      });
    } catch {
      // Local dev may not have DB connectivity yet.
    }
  }

  return NextResponse.json({
    ok: true,
    trustScore,
    signals,
    serviceHistorySummary: evaluated.serviceHistorySummary,
    riskSummary: evaluated.riskSummary,
    manualReview
  });
}
