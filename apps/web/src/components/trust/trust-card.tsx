import { estimateTrustScore } from "@/lib/trust-score";
import { TrustSignals } from "@/lib/vehicle";

interface TrustCardProps {
  signals: TrustSignals;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function TrustCard({ signals }: TrustCardProps) {
  const score = estimateTrustScore(signals);

  return (
    <section style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Avto-Bioqrafiya Preview</h2>
      <p style={{ margin: "4px 0" }}>
        <strong>Trust Score:</strong> {score}/100
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>VIN Verified:</strong> {signals.vinVerification.status}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Seller Verified:</strong> {yesNo(signals.sellerVerified)}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Media Complete:</strong> {yesNo(signals.mediaComplete)}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Mileage Flag:</strong> {signals.mileageFlag?.message ?? "No mismatch detected"}
      </p>
    </section>
  );
}
