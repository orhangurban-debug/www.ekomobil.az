"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  INSPECTION_SECTIONS,
  CONDITION_LABELS,
  ACCIDENT_LABELS,
  PAINT_LABELS,
  RUST_LABELS,
  WARNING_LIGHTS_LABELS,
  DEFAULT_INSPECTION_REPORT,
  calcInspectionScore,
  inspectionScoreLabel,
  type AuctionInspectionReport,
  type AuctionInspectionReportInput,
  type ConditionRating,
  type AccidentHistory,
  type PaintStatus,
  type RustPresence,
  type WarningLights,
  type InspectorType
} from "@/lib/auction-inspection";

const RATINGS: ConditionRating[] = ["excellent", "good", "fair", "poor", "unknown", "na"];
const RATINGS_NO_NA: ConditionRating[] = ["excellent", "good", "fair", "poor", "unknown"];

const RATING_COLORS: Record<ConditionRating, string> = {
  excellent: "border-emerald-400 bg-emerald-50 text-emerald-800",
  good: "border-green-400 bg-green-50 text-green-800",
  fair: "border-amber-400 bg-amber-50 text-amber-800",
  poor: "border-red-400 bg-red-50 text-red-800",
  unknown: "border-slate-300 bg-slate-50 text-slate-600",
  na: "border-slate-200 bg-white text-slate-400"
};
const RATING_ACTIVE: Record<ConditionRating, string> = {
  excellent: "ring-2 ring-emerald-500",
  good: "ring-2 ring-green-500",
  fair: "ring-2 ring-amber-500",
  poor: "ring-2 ring-red-500",
  unknown: "ring-2 ring-slate-400",
  na: "ring-2 ring-slate-300"
};

function RatingChip({
  value,
  selected,
  onSelect,
  allowNa = false
}: {
  value: ConditionRating;
  selected: boolean;
  onSelect: () => void;
  allowNa?: boolean;
}) {
  if (value === "na" && !allowNa) return null;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition
        ${RATING_COLORS[value]}
        ${selected ? RATING_ACTIVE[value] : "opacity-60 hover:opacity-100"}`}
    >
      {CONDITION_LABELS[value]}
    </button>
  );
}

function FieldRow({
  label,
  fieldKey,
  value,
  onChange,
  allowNa = false
}: {
  label: string;
  fieldKey: string;
  value: ConditionRating;
  onChange: (v: ConditionRating) => void;
  allowNa?: boolean;
}) {
  const ratings = allowNa ? RATINGS : RATINGS_NO_NA;
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-700 sm:w-48 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {ratings.map((r) => (
          <RatingChip
            key={`${fieldKey}-${r}`}
            value={r}
            selected={value === r}
            onSelect={() => onChange(r)}
            allowNa={r === "na"}
          />
        ))}
      </div>
    </div>
  );
}

function ScoreMeter({ score }: { score: number }) {
  const { label, color } = inspectionScoreLabel(score);
  const barColor =
    color === "emerald" ? "bg-emerald-500" :
    color === "green" ? "bg-green-500" :
    color === "amber" ? "bg-amber-500" :
    color === "orange" ? "bg-orange-500" : "bg-red-500";
  const textColor =
    color === "emerald" ? "text-emerald-700" :
    color === "green" ? "text-green-700" :
    color === "amber" ? "text-amber-700" :
    color === "orange" ? "text-orange-700" : "text-red-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Vəziyyət skoru</span>
        <span className={`text-sm font-bold ${textColor}`}>{score}/100 — {label}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  auctionId: string;
  initial?: AuctionInspectionReport | null;
}

export function AuctionConditionReportForm({ auctionId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Omit<AuctionInspectionReportInput, "auctionId" | "submittedByUserId">>(
    initial
      ? {
          bodyFront: initial.bodyFront, bodyRear: initial.bodyRear,
          bodyLeft: initial.bodyLeft, bodyRight: initial.bodyRight,
          bodyRoof: initial.bodyRoof, bodyUnderbody: initial.bodyUnderbody,
          glassWindshield: initial.glassWindshield, lights: initial.lights,
          paintStatus: initial.paintStatus, rustPresence: initial.rustPresence,
          engineCondition: initial.engineCondition, engineOil: initial.engineOil,
          transmissionCondition: initial.transmissionCondition, clutchCondition: initial.clutchCondition,
          suspension: initial.suspension, brakesFront: initial.brakesFront, brakesRear: initial.brakesRear,
          exhaust: initial.exhaust, cooling: initial.cooling, fuelSystem: initial.fuelSystem,
          batteryCondition: initial.batteryCondition, acSystem: initial.acSystem,
          infotainment: initial.infotainment, warningLights: initial.warningLights,
          powerAccessories: initial.powerAccessories,
          seatsCondition: initial.seatsCondition, dashboardCondition: initial.dashboardCondition,
          carpetCondition: initial.carpetCondition, trunkCondition: initial.trunkCondition,
          hasTechPassport: initial.hasTechPassport, hasServiceHistory: initial.hasServiceHistory,
          accidentHistory: initial.accidentHistory, vinMatchesDocs: initial.vinMatchesDocs,
          registrationValid: initial.registrationValid,
          knownDefects: initial.knownDefects ?? "", recentRepairs: initial.recentRepairs ?? "",
          inspectorNote: initial.inspectorNote ?? "",
          inspectorType: initial.inspectorType, inspectorName: initial.inspectorName ?? "",
          inspectorCertNo: initial.inspectorCertNo ?? "", inspectionDate: initial.inspectionDate ?? ""
        }
      : { ...DEFAULT_INSPECTION_REPORT, knownDefects: "", recentRepairs: "", inspectorNote: "", inspectorName: "", inspectorCertNo: "", inspectionDate: "" }
  );

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  // Live score hesablaması üçün mock report
  const mockReport = {
    ...form,
    id: "", auctionId, submittedByUserId: "",
    status: "submitted" as const, createdAt: "", updatedAt: ""
  } as AuctionInspectionReport;
  const liveScore = calcInspectionScore(mockReport);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) { setError(data.error ?? "Saxlanmadı"); return; }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Serverlə əlaqə kəsildi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Canlı skor */}
      <ScoreMeter score={liveScore} />

      {/* Bölmə döngüsü */}
      {INSPECTION_SECTIONS.map((section) => (
        <div key={section.key} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
            <span aria-hidden="true">{section.icon}</span>
            {section.title}
          </h3>
          <div>
            {section.fields.map((field) => (
              <FieldRow
                key={field.key}
                label={field.label}
                fieldKey={field.key}
                value={(form as unknown as Record<string, ConditionRating>)[field.key]}
                onChange={(v) => setField(field.key as keyof typeof form, v as never)}
                allowNa={field.key === "clutchCondition"}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Xüsusi sahələr */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <span aria-hidden="true">🎨</span>
          Boya & Pas
        </h3>
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-slate-700">Boya vəziyyəti</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(["original", "partial", "full", "unknown"] as PaintStatus[]).map((v) => (
                <button
                  key={v} type="button"
                  onClick={() => setField("paintStatus", v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition
                    ${form.paintStatus === v ? "border-[#0057FF] bg-[#0057FF]/10 text-[#0057FF] ring-2 ring-[#0057FF]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                >{PAINT_LABELS[v]}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-700">Pas vəziyyəti</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(["none", "minor", "moderate", "severe", "unknown"] as RustPresence[]).map((v) => (
                <button
                  key={v} type="button"
                  onClick={() => setField("rustPresence", v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition
                    ${form.rustPresence === v ? "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                >{RUST_LABELS[v]}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-700">İşarə işıqları</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(["none", "minor", "major", "unknown"] as WarningLights[]).map((v) => (
                <button
                  key={v} type="button"
                  onClick={() => setField("warningLights", v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition
                    ${form.warningLights === v ? "border-red-400 bg-red-50 text-red-800 ring-2 ring-red-400" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                >{WARNING_LIGHTS_LABELS[v]}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sənədlər */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <span aria-hidden="true">📄</span>
          Sənədlər & Tarixçə
        </h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {[
              { key: "hasTechPassport", label: "Texniki pasport var" },
              { key: "hasServiceHistory", label: "Servis tarixçəsi var" },
              { key: "vinMatchesDocs", label: "VIN sənədlərlə uyğundur" },
              { key: "registrationValid", label: "Qeydiyyat qüvvədədir" }
            ].map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-[#0057FF]/40">
                <input
                  type="checkbox"
                  checked={(form as Record<string, boolean>)[key] as boolean}
                  onChange={(e) => setField(key as keyof typeof form, e.target.checked as never)}
                  className="rounded"
                />
                <span className="text-slate-700">{label}</span>
              </label>
            ))}
          </div>
          <div>
            <span className="text-xs font-medium text-slate-700">Qəza tarixçəsi</span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(["none", "minor", "moderate", "major", "unknown"] as AccidentHistory[]).map((v) => (
                <button
                  key={v} type="button"
                  onClick={() => setField("accidentHistory", v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition
                    ${form.accidentHistory === v ? "border-[#0057FF] bg-[#0057FF]/10 text-[#0057FF] ring-2 ring-[#0057FF]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                >{ACCIDENT_LABELS[v]}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Açıqlama */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <span aria-hidden="true">📝</span>
          Əlavə Açıqlama
        </h3>
        <div className="space-y-3">
          {[
            { key: "knownDefects", label: "Məlum qüsurlar (varsa)" },
            { key: "recentRepairs", label: "Son 12 ay ərzindəki əsas təmirlər" },
            { key: "inspectorNote", label: "Əlavə qeydlər" }
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-600">{label}</label>
              <textarea
                rows={2}
                value={(form as Record<string, string>)[key] as string}
                onChange={(e) => setField(key as keyof typeof form, e.target.value as never)}
                placeholder="Varsa qeyd edin..."
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0057FF] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Müfəttiş */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <span aria-hidden="true">🔍</span>
          Müfəttiş Məlumatı
        </h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            {(["seller_self", "certified_partner"] as InspectorType[]).map((v) => (
              <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-[#0057FF]/40">
                <input
                  type="radio" name="inspectorType" value={v}
                  checked={form.inspectorType === v}
                  onChange={() => setField("inspectorType", v)}
                />
                <span className="text-slate-700">
                  {v === "seller_self" ? "Satıcı özü" : "Sertifikatlı ekspert"}
                </span>
              </label>
            ))}
          </div>
          {form.inspectorType === "certified_partner" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Ekspert adı</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.inspectorName ?? ""}
                  onChange={(e) => setField("inspectorName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Sertifikat №</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.inspectorCertNo ?? ""}
                  onChange={(e) => setField("inspectorCertNo", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Müayinə tarixi</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.inspectionDate ?? ""}
                  onChange={(e) => setField("inspectionDate", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tax disclaimer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <strong className="text-slate-700">Vacib qeyd:</strong> Bu hesabat alıcıya avtomobilin faktiki vəziyyətini açıqlamaq üçündür.
        Yanlış məlumat vermək platformadan kənar razılaşmalarda hüquqi məsuliyyət yarada bilər.
        EkoMobil yalnız platforma xidmət haqqını alır — avtomobilin satış qiyməti birbaşa alıcı-satıcı
        arasında ödənilir.{" "}
        <span className="text-slate-600 font-medium">Bu model platformanın vergi yükünü artırmır.</span>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Vəziyyət hesabatı saxlanıldı. Alıcılar auksion səhifəsindən görə biləcək.
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={busy}
        className="btn-primary w-full py-3 disabled:opacity-60"
      >
        {busy ? "Saxlanılır..." : "Hesabatı təsdiqlə və saxla"}
      </button>
    </div>
  );
}
