import { NextResponse } from "next/server";
import { ListingInput, validateListingInput } from "@/lib/listing";
import { enqueueManualReview } from "@/server/review-store";
import { evaluateTrustInput, upsertTrustSignals } from "@/server/trust-store";

export async function POST(req: Request) {
  const payload = (await req.json()) as ListingInput & { listingId?: string };

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

  const evaluated = evaluateTrustInput(payload);
  const signals = {
    ...evaluated.signals,
    mediaComplete: validation.mediaComplete
  };
  const trustScore = evaluated.trustScore;

  let manualReview = null;
  if (signals.mileageFlag?.severity === "high_risk") {
    manualReview = await enqueueManualReview({
      listingId: payload.listingId ?? payload.vehicle.vin || crypto.randomUUID(),
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
