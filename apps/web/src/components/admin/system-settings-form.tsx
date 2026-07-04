"use client";

import { useState } from "react";
import { AdminReadOnlyBanner } from "@/components/admin/admin-read-only-banner";
import { useToast } from "@/components/ui/toast-provider";

interface Props {
  auctionMode: "BETA_FIN_ONLY" | "STRICT_PRE_AUTH";
  vehiclePenalty: number;
  partPenalty: number;
  vehicleBreachPenalty: number;
  partBreachPenalty: number;
  readOnly?: boolean;
}

export function SystemSettingsForm({
  auctionMode,
  vehiclePenalty,
  partPenalty,
  vehicleBreachPenalty,
  partBreachPenalty,
  readOnly = false
}: Props) {
  const [mode, setMode] = useState(auctionMode);
  const [vehicle, setVehicle] = useState(vehiclePenalty);
  const [part, setPart] = useState(partPenalty);
  const [breachVehicle, setBreachVehicle] = useState(vehicleBreachPenalty);
  const [breachPart, setBreachPart] = useState(partBreachPenalty);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionMode: mode,
          penaltyAmounts: { vehicle, part },
          sellerBreachAmounts: { vehicle: breachVehicle, part: breachPart }
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Parametrlər saxlanmadı");
      toast.success("Parametrlər uğurla saxlanıldı");
    } catch {
      toast.error("Parametrlər saxlanmadı");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {readOnly && <div className="mb-4"><AdminReadOnlyBanner /></div>}
      <h2 className="text-lg font-bold text-slate-900">Auksion risk ayarları</h2>
      <p className="mt-1 text-sm text-slate-500">
        Öhdəlik haqları və pre-auth rejimi üzrə mərkəzi parametrlər. Bu məbləğlər
        həm bid ön-bloklamasında, həm də faktiki ödənişdə və qiymət səhifəsində istifadə olunur.
      </p>

      <fieldset disabled={readOnly} className="mt-5 border-0 p-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Rejim</p>
      <div className="mb-5">
        <label className="space-y-1">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Props["auctionMode"])}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="BETA_FIN_ONLY">Yalnız maliyyə təsdiqi (BETA) — alıcıdan kart blokaması tələb edilmir</option>
            <option value="STRICT_PRE_AUTH">Sərt ön bloklama — hər alıcıdan kart pre-auth tələb edilir</option>
          </select>
        </label>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Alıcı öhdəlik haqqı (no-show)</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Nəqliyyat (₼)</span>
          <input
            type="number"
            value={vehicle}
            min={1}
            onChange={(e) => setVehicle(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Hissə (₼)</span>
          <input
            type="number"
            value={part}
            min={1}
            onChange={(e) => setPart(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Satıcı öhdəlik haqqı (pozuntu)</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Nəqliyyat (₼)</span>
          <input
            type="number"
            value={breachVehicle}
            min={1}
            onChange={(e) => setBreachVehicle(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-slate-500">Hissə (₼)</span>
          <input
            type="number"
            value={breachPart}
            min={1}
            onChange={(e) => setBreachPart(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {!readOnly && (
      <div className="mt-5">
        <button type="button" onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Saxlanılır..." : "Yadda saxla"}
        </button>
      </div>
      )}
      </fieldset>
    </div>
  );
}
