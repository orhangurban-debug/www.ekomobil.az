import type { MediaProtocolInput } from "@/lib/media-protocol";

export type VehicleMediaAngleKey = Exclude<
  keyof MediaProtocolInput,
  "imageCount" | "engineVideoDurationSec"
>;

export const VEHICLE_MEDIA_ANGLE_OPTIONS: {
  key: VehicleMediaAngleKey;
  label: string;
  shortLabel: string;
  hint: string;
}[] = [
  { key: "hasFrontAngle", label: "Ön görünüş", shortLabel: "Ön", hint: "Ön 3/4 və ya düz ön rakurs" },
  { key: "hasRearAngle", label: "Arxa görünüş", shortLabel: "Arxa", hint: "Arxa 3/4 və ya düz arxa rakurs" },
  { key: "hasLeftSide", label: "Sol profil", shortLabel: "Sol", hint: "Tam sol tərəf, düz müstəvi" },
  { key: "hasRightSide", label: "Sağ profil", shortLabel: "Sağ", hint: "Tam sağ tərəf, düz müstəvi" },
  { key: "hasDashboard", label: "Ön panel / sükan", shortLabel: "Panel", hint: "Sükan, cihazlar paneli və ekranlar" },
  { key: "hasInterior", label: "Salon", shortLabel: "Salon", hint: "Ön və ya arxa oturacaqlar" },
  { key: "hasOdometer", label: "Yürüş sayğacı", shortLabel: "Yürüş", hint: "Odometr rəqəmləri oxunaqlı" },
  { key: "hasTrunk", label: "Baqaj / yük yeri", shortLabel: "Baqaj", hint: "Baqaj və ya yük sahəsi açıq" }
];

export function buildMediaAnglesFromTags(
  tags: Array<VehicleMediaAngleKey | null>,
  imageCount: number,
  prev: MediaProtocolInput
): MediaProtocolInput {
  const assigned = new Set(tags.filter((tag): tag is VehicleMediaAngleKey => Boolean(tag)));
  return {
    ...prev,
    imageCount,
    hasFrontAngle: assigned.has("hasFrontAngle"),
    hasRearAngle: assigned.has("hasRearAngle"),
    hasLeftSide: assigned.has("hasLeftSide"),
    hasRightSide: assigned.has("hasRightSide"),
    hasDashboard: assigned.has("hasDashboard"),
    hasInterior: assigned.has("hasInterior"),
    hasOdometer: assigned.has("hasOdometer"),
    hasTrunk: assigned.has("hasTrunk")
  };
}

export function mediaAngleLabel(key: VehicleMediaAngleKey): string {
  return VEHICLE_MEDIA_ANGLE_OPTIONS.find((item) => item.key === key)?.shortLabel ?? key;
}
