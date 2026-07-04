import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import type {
  AuctionInspectionReport,
  AuctionInspectionReportInput,
  ConditionRating,
  AccidentHistory,
  PaintStatus,
  RustPresence,
  WarningLights,
  InspectorType,
  InspectionReportStatus
} from "@/lib/auction-inspection";

interface InspectionRow {
  id: string;
  auction_id: string;
  submitted_by_user_id: string;
  body_front: string; body_rear: string; body_left: string; body_right: string;
  body_roof: string; body_underbody: string; glass_windshield: string; lights: string;
  paint_status: string; rust_presence: string;
  engine_condition: string; engine_oil: string; transmission_condition: string;
  clutch_condition: string; suspension: string; brakes_front: string; brakes_rear: string;
  exhaust: string; cooling: string; fuel_system: string;
  battery_condition: string; ac_system: string; infotainment: string;
  warning_lights: string; power_accessories: string;
  seats_condition: string; dashboard_condition: string;
  carpet_condition: string; trunk_condition: string;
  has_tech_passport: boolean; has_service_history: boolean;
  accident_history: string; vin_matches_docs: boolean; registration_valid: boolean;
  known_defects: string | null; recent_repairs: string | null; inspector_note: string | null;
  inspector_type: string; inspector_name: string | null;
  inspector_cert_no: string | null; inspection_date: Date | null;
  status: string; ops_note: string | null;
  created_at: Date; updated_at: Date;
}

function mapRow(row: InspectionRow): AuctionInspectionReport {
  return {
    id: row.id,
    auctionId: row.auction_id,
    submittedByUserId: row.submitted_by_user_id,
    bodyFront: row.body_front as ConditionRating,
    bodyRear: row.body_rear as ConditionRating,
    bodyLeft: row.body_left as ConditionRating,
    bodyRight: row.body_right as ConditionRating,
    bodyRoof: row.body_roof as ConditionRating,
    bodyUnderbody: row.body_underbody as ConditionRating,
    glassWindshield: row.glass_windshield as ConditionRating,
    lights: row.lights as ConditionRating,
    paintStatus: row.paint_status as PaintStatus,
    rustPresence: row.rust_presence as RustPresence,
    engineCondition: row.engine_condition as ConditionRating,
    engineOil: row.engine_oil as ConditionRating,
    transmissionCondition: row.transmission_condition as ConditionRating,
    clutchCondition: row.clutch_condition as ConditionRating,
    suspension: row.suspension as ConditionRating,
    brakesFront: row.brakes_front as ConditionRating,
    brakesRear: row.brakes_rear as ConditionRating,
    exhaust: row.exhaust as ConditionRating,
    cooling: row.cooling as ConditionRating,
    fuelSystem: row.fuel_system as ConditionRating,
    batteryCondition: row.battery_condition as ConditionRating,
    acSystem: row.ac_system as ConditionRating,
    infotainment: row.infotainment as ConditionRating,
    warningLights: row.warning_lights as WarningLights,
    powerAccessories: row.power_accessories as ConditionRating,
    seatsCondition: row.seats_condition as ConditionRating,
    dashboardCondition: row.dashboard_condition as ConditionRating,
    carpetCondition: row.carpet_condition as ConditionRating,
    trunkCondition: row.trunk_condition as ConditionRating,
    hasTechPassport: row.has_tech_passport,
    hasServiceHistory: row.has_service_history,
    accidentHistory: row.accident_history as AccidentHistory,
    vinMatchesDocs: row.vin_matches_docs,
    registrationValid: row.registration_valid,
    knownDefects: row.known_defects ?? undefined,
    recentRepairs: row.recent_repairs ?? undefined,
    inspectorNote: row.inspector_note ?? undefined,
    inspectorType: row.inspector_type as InspectorType,
    inspectorName: row.inspector_name ?? undefined,
    inspectorCertNo: row.inspector_cert_no ?? undefined,
    inspectionDate: row.inspection_date ? row.inspection_date.toISOString().split("T")[0] : undefined,
    status: row.status as InspectionReportStatus,
    opsNote: row.ops_note ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function getAuctionInspectionReport(
  auctionId: string
): Promise<AuctionInspectionReport | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<InspectionRow>(
      `SELECT * FROM auction_inspection_reports WHERE auction_id = $1 LIMIT 1`,
      [auctionId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function upsertAuctionInspectionReport(
  input: AuctionInspectionReportInput
): Promise<{ ok: true; report: AuctionInspectionReport } | { ok: false; error: string }> {
  try {
    const pool = getPgPool();
    const id = randomUUID();
    const result = await pool.query<InspectionRow>(
      `INSERT INTO auction_inspection_reports (
        id, auction_id, submitted_by_user_id,
        body_front, body_rear, body_left, body_right, body_roof, body_underbody,
        glass_windshield, lights, paint_status, rust_presence,
        engine_condition, engine_oil, transmission_condition, clutch_condition,
        suspension, brakes_front, brakes_rear, exhaust, cooling, fuel_system,
        battery_condition, ac_system, infotainment, warning_lights, power_accessories,
        seats_condition, dashboard_condition, carpet_condition, trunk_condition,
        has_tech_passport, has_service_history, accident_history,
        vin_matches_docs, registration_valid,
        known_defects, recent_repairs, inspector_note,
        inspector_type, inspector_name, inspector_cert_no, inspection_date,
        status, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,
        $38,$39,$40,$41,$42,$43,$44::date,'submitted',NOW()
      )
      ON CONFLICT (auction_id) DO UPDATE SET
        body_front=$4, body_rear=$5, body_left=$6, body_right=$7, body_roof=$8,
        body_underbody=$9, glass_windshield=$10, lights=$11, paint_status=$12,
        rust_presence=$13, engine_condition=$14, engine_oil=$15,
        transmission_condition=$16, clutch_condition=$17, suspension=$18,
        brakes_front=$19, brakes_rear=$20, exhaust=$21, cooling=$22, fuel_system=$23,
        battery_condition=$24, ac_system=$25, infotainment=$26, warning_lights=$27,
        power_accessories=$28, seats_condition=$29, dashboard_condition=$30,
        carpet_condition=$31, trunk_condition=$32, has_tech_passport=$33,
        has_service_history=$34, accident_history=$35, vin_matches_docs=$36,
        registration_valid=$37, known_defects=$38, recent_repairs=$39,
        inspector_note=$40, inspector_type=$41, inspector_name=$42,
        inspector_cert_no=$43, inspection_date=$44::date, status='submitted', updated_at=NOW()
      RETURNING *`,
      [
        id, input.auctionId, input.submittedByUserId,
        input.bodyFront, input.bodyRear, input.bodyLeft, input.bodyRight,
        input.bodyRoof, input.bodyUnderbody, input.glassWindshield, input.lights,
        input.paintStatus, input.rustPresence,
        input.engineCondition, input.engineOil, input.transmissionCondition,
        input.clutchCondition, input.suspension, input.brakesFront, input.brakesRear,
        input.exhaust, input.cooling, input.fuelSystem,
        input.batteryCondition, input.acSystem, input.infotainment,
        input.warningLights, input.powerAccessories,
        input.seatsCondition, input.dashboardCondition,
        input.carpetCondition, input.trunkCondition,
        input.hasTechPassport, input.hasServiceHistory, input.accidentHistory,
        input.vinMatchesDocs, input.registrationValid,
        input.knownDefects ?? null, input.recentRepairs ?? null, input.inspectorNote ?? null,
        input.inspectorType, input.inspectorName ?? null,
        input.inspectorCertNo ?? null, input.inspectionDate ?? null
      ]
    );
    return { ok: true, report: mapRow(result.rows[0]) };
  } catch (err) {
    console.error("upsertAuctionInspectionReport error:", err);
    return { ok: false, error: "Hesabat saxlanmadı" };
  }
}

export async function hasInspectionReport(auctionId: string): Promise<boolean> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM auction_inspection_reports WHERE auction_id = $1) AS exists`,
      [auctionId]
    );
    return result.rows[0]?.exists === true;
  } catch {
    return false;
  }
}
