"use client";

import { useState } from "react";

interface Props {
  auctionMode: "BETA_FIN_ONLY" | "STRICT_PRE_AUTH";
  vehiclePenalty: number;
  partPenalty: number;
}

export function SystemSettingsForm({ auctionMode, vehiclePenalty, partPenalty }: Props) {
  const [mode, setMode] = useState(auctionMode);
  const [vehicle, setVehicle] = useState(vehiclePenalty);
  const [part, setPart] = useState(partPenalty);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionMode: mode,
          penaltyAmounts: { vehicle, part }
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Ayarlar saxlanmadı");
      alert("Ayarlar uğurla saxlanıldı");
    } catch {
      alert("Ayarlar saxlanmadı");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-900">Auksion risk ayarları</h2>
      <p className="mt-1 text-sm text-slate-500">
        Öhdəlik haqları və pre-auth rejimi üzrə mərkəzi parametrlər.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auksion rejimi</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Props["auctionMode"])}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="BETA_FIN_ONLY">BETA_FIN_ONLY</option>
            <option value="STRICT_PRE_AUTH">STRICT_PRE_AUTH</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle öhdəlik (₼)</span>
          <input
            type="number"
            value={vehicle}
            min={1}
            onChange={(e) => setVehicle(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Part öhdəlik (₼)</span>
          <input
            type="number"
            value={part}
            min={1}
            onChange={(e) => setPart(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-5">
        <button type="button" onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Saxlanılır..." : "Yadda saxla"}
        </button>
      </div>
    </div>
  );
}
