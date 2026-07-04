/**
 * Auksion vəziyyət hesabatı — 40+ bəndlik standart şablon
 * Satıcı tərəfindən doldurulur. Həm alıcı etibarını, həm fırıldaqçılıq
 * müqavimətini artırır. Sertifikatlı partner ekspertizası opsionaldır.
 */

export type ConditionRating = "excellent" | "good" | "fair" | "poor" | "unknown" | "na";
export type AccidentHistory = "none" | "minor" | "moderate" | "major" | "unknown";
export type PaintStatus = "original" | "partial" | "full" | "unknown";
export type RustPresence = "none" | "minor" | "moderate" | "severe" | "unknown";
export type WarningLights = "none" | "minor" | "major" | "unknown";
export type InspectorType = "seller_self" | "certified_partner";
export type InspectionReportStatus = "submitted" | "ops_verified" | "disputed";

export interface AuctionInspectionReport {
  id: string;
  auctionId: string;
  submittedByUserId: string;

  // Gövdə & xarici görünüş
  bodyFront: ConditionRating;
  bodyRear: ConditionRating;
  bodyLeft: ConditionRating;
  bodyRight: ConditionRating;
  bodyRoof: ConditionRating;
  bodyUnderbody: ConditionRating;
  glassWindshield: ConditionRating;
  lights: ConditionRating;
  paintStatus: PaintStatus;
  rustPresence: RustPresence;

  // Mexanika
  engineCondition: ConditionRating;
  engineOil: ConditionRating;
  transmissionCondition: ConditionRating;
  clutchCondition: ConditionRating;
  suspension: ConditionRating;
  brakesFront: ConditionRating;
  brakesRear: ConditionRating;
  exhaust: ConditionRating;
  cooling: ConditionRating;
  fuelSystem: ConditionRating;

  // Elektrik
  batteryCondition: ConditionRating;
  acSystem: ConditionRating;
  infotainment: ConditionRating;
  warningLights: WarningLights;
  powerAccessories: ConditionRating;

  // Salon
  seatsCondition: ConditionRating;
  dashboardCondition: ConditionRating;
  carpetCondition: ConditionRating;
  trunkCondition: ConditionRating;

  // Sənədlər
  hasTechPassport: boolean;
  hasServiceHistory: boolean;
  accidentHistory: AccidentHistory;
  vinMatchesDocs: boolean;
  registrationValid: boolean;

  // Açıqlama
  knownDefects?: string;
  recentRepairs?: string;
  inspectorNote?: string;

  // Müfəttiş
  inspectorType: InspectorType;
  inspectorName?: string;
  inspectorCertNo?: string;
  inspectionDate?: string;

  status: InspectionReportStatus;
  opsNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuctionInspectionReportInput = Omit<
  AuctionInspectionReport,
  "id" | "status" | "opsNote" | "createdAt" | "updatedAt"
>;

// ──────────────────────────────────────────────────────────────
// Hesabat keyfiyyət skoru hesablaması (0–100)
// Alıcıya ümumi vəziyyəti sürətlə qiymətləndirməyə kömək edir.
// ──────────────────────────────────────────────────────────────

const RATING_SCORE: Record<ConditionRating, number> = {
  excellent: 100,
  good: 75,
  fair: 50,
  poor: 20,
  unknown: 40,
  na: 100 // Applicable olmayan sahə hesablamadan çıxarılır
};

const SECTION_WEIGHTS = {
  body: 0.25,
  mechanical: 0.35,
  electrical: 0.15,
  interior: 0.10,
  documents: 0.15
};

function avgRatings(ratings: ConditionRating[]): number {
  const applicable = ratings.filter((r) => r !== "na");
  if (applicable.length === 0) return 75;
  return applicable.reduce((sum, r) => sum + RATING_SCORE[r], 0) / applicable.length;
}

export function calcInspectionScore(r: AuctionInspectionReport): number {
  const bodyScore = avgRatings([
    r.bodyFront, r.bodyRear, r.bodyLeft, r.bodyRight,
    r.bodyRoof, r.bodyUnderbody, r.glassWindshield, r.lights
  ]);
  // Paint/rust malus
  const paintMalus = r.paintStatus === "full" ? 10 : r.paintStatus === "partial" ? 5 : 0;
  const rustMalus = r.rustPresence === "severe" ? 15 : r.rustPresence === "moderate" ? 8 : r.rustPresence === "minor" ? 3 : 0;
  const bodyFinal = Math.max(0, bodyScore - paintMalus - rustMalus);

  const mechScore = avgRatings([
    r.engineCondition, r.engineOil, r.transmissionCondition,
    r.clutchCondition, r.suspension, r.brakesFront, r.brakesRear,
    r.exhaust, r.cooling, r.fuelSystem
  ]);

  const elecScore = avgRatings([
    r.batteryCondition, r.acSystem, r.infotainment, r.powerAccessories
  ]);
  const warnMalus = r.warningLights === "major" ? 20 : r.warningLights === "minor" ? 8 : 0;
  const elecFinal = Math.max(0, elecScore - warnMalus);

  const intScore = avgRatings([
    r.seatsCondition, r.dashboardCondition, r.carpetCondition, r.trunkCondition
  ]);

  // Documents score
  let docScore = 60;
  if (r.hasTechPassport) docScore += 15;
  if (r.hasServiceHistory) docScore += 15;
  if (!r.vinMatchesDocs) docScore -= 25;
  if (!r.registrationValid) docScore -= 20;
  const accMalus = r.accidentHistory === "major" ? 25 : r.accidentHistory === "moderate" ? 15 : r.accidentHistory === "minor" ? 5 : 0;
  docScore = Math.max(0, Math.min(100, docScore - accMalus));

  const total =
    bodyFinal * SECTION_WEIGHTS.body +
    mechScore * SECTION_WEIGHTS.mechanical +
    elecFinal * SECTION_WEIGHTS.electrical +
    intScore * SECTION_WEIGHTS.interior +
    docScore * SECTION_WEIGHTS.documents;

  return Math.round(Math.max(0, Math.min(100, total)));
}

export function inspectionScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Əla vəziyyət", color: "emerald" };
  if (score >= 65) return { label: "Yaxşı vəziyyət", color: "green" };
  if (score >= 50) return { label: "Orta vəziyyət", color: "amber" };
  if (score >= 35) return { label: "Zəif vəziyyət", color: "orange" };
  return { label: "Ciddi qüsurlar", color: "red" };
}

// ──────────────────────────────────────────────────────────────
// UI helpers — Azərbaycan dili etiketləri
// ──────────────────────────────────────────────────────────────

export const CONDITION_LABELS: Record<ConditionRating, string> = {
  excellent: "Əla",
  good: "Yaxşı",
  fair: "Orta",
  poor: "Zəif",
  unknown: "Bilinmir",
  na: "Tətbiq edilmir"
};

export const ACCIDENT_LABELS: Record<AccidentHistory, string> = {
  none: "Qəza yoxdur",
  minor: "Kiçik zədə",
  moderate: "Orta zədə",
  major: "Ciddi qəza",
  unknown: "Bilinmir"
};

export const PAINT_LABELS: Record<PaintStatus, string> = {
  original: "Orijinal",
  partial: "Qismən rənglənib",
  full: "Tam rənglənib",
  unknown: "Bilinmir"
};

export const RUST_LABELS: Record<RustPresence, string> = {
  none: "Pas yoxdur",
  minor: "Az miqdar",
  moderate: "Orta miqdar",
  severe: "Ciddi pas",
  unknown: "Bilinmir"
};

export const WARNING_LIGHTS_LABELS: Record<WarningLights, string> = {
  none: "Heç biri yoxdur",
  minor: "Az əhəmiyyətli",
  major: "Ciddi xəbərdar işıqları",
  unknown: "Bilinmir"
};

export const INSPECTION_SECTIONS = [
  {
    key: "body",
    title: "Gövdə & Xarici Görünüş",
    icon: "🚗",
    fields: [
      { key: "bodyFront", label: "Ön bamper/panel" },
      { key: "bodyRear", label: "Arxa bamper/panel" },
      { key: "bodyLeft", label: "Sol panel" },
      { key: "bodyRight", label: "Sağ panel" },
      { key: "bodyRoof", label: "Dam" },
      { key: "bodyUnderbody", label: "Alt şassi" },
      { key: "glassWindshield", label: "Şüşələr" },
      { key: "lights", label: "Far/stop işıqları" }
    ]
  },
  {
    key: "mechanical",
    title: "Mexanika",
    icon: "⚙️",
    fields: [
      { key: "engineCondition", label: "Mühərrik" },
      { key: "engineOil", label: "Mühərrik yağı" },
      { key: "transmissionCondition", label: "Sürətlər qutusu" },
      { key: "clutchCondition", label: "Debriyaj (mexaniki üçün)" },
      { key: "suspension", label: "Asma/sükan" },
      { key: "brakesFront", label: "Ön əyləclər" },
      { key: "brakesRear", label: "Arxa əyləclər" },
      { key: "exhaust", label: "Egzoz sistemi" },
      { key: "cooling", label: "Soyutma sistemi" },
      { key: "fuelSystem", label: "Yanacaq sistemi" }
    ]
  },
  {
    key: "electrical",
    title: "Elektrik",
    icon: "⚡",
    fields: [
      { key: "batteryCondition", label: "Akkumulyator" },
      { key: "acSystem", label: "Kondisioner" },
      { key: "infotainment", label: "Multimedia/audio" },
      { key: "powerAccessories", label: "Elektrik pəncərələr/güzgülər" }
    ]
  },
  {
    key: "interior",
    title: "Salon",
    icon: "🪑",
    fields: [
      { key: "seatsCondition", label: "Oturacaqlar" },
      { key: "dashboardCondition", label: "Armatur paneli" },
      { key: "carpetCondition", label: "Döşəmə/xalça" },
      { key: "trunkCondition", label: "Baqaj" }
    ]
  }
] as const;

export const DEFAULT_INSPECTION_REPORT: Omit<
  AuctionInspectionReportInput,
  "auctionId" | "submittedByUserId"
> = {
  bodyFront: "unknown", bodyRear: "unknown", bodyLeft: "unknown", bodyRight: "unknown",
  bodyRoof: "unknown", bodyUnderbody: "unknown", glassWindshield: "unknown", lights: "unknown",
  paintStatus: "unknown", rustPresence: "unknown",
  engineCondition: "unknown", engineOil: "unknown", transmissionCondition: "unknown",
  clutchCondition: "unknown", suspension: "unknown", brakesFront: "unknown", brakesRear: "unknown",
  exhaust: "unknown", cooling: "unknown", fuelSystem: "unknown",
  batteryCondition: "unknown", acSystem: "unknown", infotainment: "unknown",
  warningLights: "unknown", powerAccessories: "unknown",
  seatsCondition: "unknown", dashboardCondition: "unknown",
  carpetCondition: "unknown", trunkCondition: "unknown",
  hasTechPassport: false, hasServiceHistory: false,
  accidentHistory: "unknown", vinMatchesDocs: true, registrationValid: true,
  inspectorType: "seller_self"
};
