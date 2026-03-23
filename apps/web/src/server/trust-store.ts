import { buildTrustSignals, estimateTrustScore } from "@/lib/trust-score";
import { ListingInput } from "@/lib/listing";
import { getPgPool } from "@/lib/postgres";

export interface TrustEvaluationResult {
  trustScore: number;
  signals: ReturnType<typeof buildTrustSignals>;
  riskSummary: string;
  serviceHistorySummary: string;
}

export function evaluateTrustInput(input: ListingInput): TrustEvaluationResult {
  const signals = buildTrustSignals({
    vehicle: input.vehicle,
    vinVerified: input.vinVerified,
    sellerVerified: input.sellerVerified,
    mediaComplete: true,
    latestMileageEvent: input.latestMileageEvent
  });

  const trustScore = estimateTrustScore(signals);
  const riskSummary =
    signals.mileageFlag?.severity === "high_risk"
      ? "Yüksək risk — manual review tələb olunur"
      : signals.mileageFlag?.severity === "warning"
        ? "Orta risk — yürüş fərqi mövcuddur"
        : "Aşağı risk — ilkin yoxlama tamamlandı";

  const serviceHistorySummary = input.latestMileageEvent
    ? `Son servis qeydi ${new Date(input.latestMileageEvent.recordedAt).toLocaleDateString("az-AZ")} tarixində qeydə alınıb`
    : "Servis tarixçəsi hələ inteqrasiya olunmayıb";

  return { trustScore, signals, riskSummary, serviceHistorySummary };
}

export async function upsertTrustSignals(input: {
  listingId: string;
  trustScore: number;
  vinVerified: boolean;
  sellerVerified: boolean;
  mediaComplete: boolean;
  mileageFlagSeverity?: string;
  mileageFlagMessage?: string;
  serviceHistorySummary?: string;
  riskSummary?: string;
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `
      INSERT INTO listing_trust_signals (
        listing_id, trust_score, vin_verified, seller_verified, media_complete,
        mileage_flag_severity, mileage_flag_message, service_history_summary, risk_summary, last_verified_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (listing_id)
      DO UPDATE SET
        trust_score = EXCLUDED.trust_score,
        vin_verified = EXCLUDED.vin_verified,
        seller_verified = EXCLUDED.seller_verified,
        media_complete = EXCLUDED.media_complete,
        mileage_flag_severity = EXCLUDED.mileage_flag_severity,
        mileage_flag_message = EXCLUDED.mileage_flag_message,
        service_history_summary = EXCLUDED.service_history_summary,
        risk_summary = EXCLUDED.risk_summary,
        last_verified_at = NOW(),
        updated_at = NOW()
    `,
    [
      input.listingId,
      input.trustScore,
      input.vinVerified,
      input.sellerVerified,
      input.mediaComplete,
      input.mileageFlagSeverity ?? null,
      input.mileageFlagMessage ?? null,
      input.serviceHistorySummary ?? null,
      input.riskSummary ?? null
    ]
  );
}
