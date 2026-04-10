"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BODY_TYPES,
  CAR_MAKES,
  COLORS,
  CONDITIONS,
  DRIVE_TYPES,
  FUEL_TYPES,
  INTERIOR_MATERIALS,
  getCompatibleEngineTypes,
  getCompatibleTransmissions,
  getModelsForMake
} from "@/lib/car-data";

export function OwnerEditListingButton(props: {
  listingId: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: number;
  mileageKm: number;
  city: string;
  priceAzn: number;
  vin?: string;
  fuelType: string;
  engineType?: string;
  transmission: string;
  bodyType?: string;
  driveType?: string;
  color?: string;
  condition?: string;
  engineVolumeCc?: number;
  interiorMaterial?: string;
  hasSunroof?: boolean;
  creditAvailable?: boolean;
  barterAvailable?: boolean;
  seatHeating?: boolean;
  seatCooling?: boolean;
  camera360?: boolean;
  parkingSensors?: boolean;
  adaptiveCruise?: boolean;
  laneAssist?: boolean;
  ownersCount?: number;
  hasServiceBook?: boolean;
  hasRepairHistory?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: props.title,
    description: props.description,
    make: props.make,
    model: props.model,
    year: props.year,
    mileageKm: props.mileageKm,
    city: props.city,
    priceAzn: props.priceAzn,
    vin: props.vin ?? "",
    fuelType: props.fuelType,
    engineType: props.engineType ?? "",
    transmission: props.transmission,
    bodyType: props.bodyType ?? "",
    driveType: props.driveType ?? "",
    color: props.color ?? "",
    condition: props.condition ?? "",
    engineVolumeCc: props.engineVolumeCc ?? "",
    interiorMaterial: props.interiorMaterial ?? "",
    hasSunroof: Boolean(props.hasSunroof),
    creditAvailable: Boolean(props.creditAvailable),
    barterAvailable: Boolean(props.barterAvailable),
    seatHeating: Boolean(props.seatHeating),
    seatCooling: Boolean(props.seatCooling),
    camera360: Boolean(props.camera360),
    parkingSensors: Boolean(props.parkingSensors),
    adaptiveCruise: Boolean(props.adaptiveCruise),
    laneAssist: Boolean(props.laneAssist),
    ownersCount: props.ownersCount ?? "",
    hasServiceBook: Boolean(props.hasServiceBook),
    hasRepairHistory: Boolean(props.hasRepairHistory)
  });
  const modelOptions = getModelsForMake(form.make);
  const engineTypeOptions = getCompatibleEngineTypes(form.fuelType);
  const transmissionOptions = getCompatibleTransmissions(form.fuelType);
  const isElectric = form.fuelType === "Elektrik";
  type BoolKey =
    | "hasSunroof"
    | "creditAvailable"
    | "barterAvailable"
    | "seatHeating"
    | "seatCooling"
    | "camera360"
    | "parkingSensors"
    | "adaptiveCruise"
    | "laneAssist"
    | "hasServiceBook"
    | "hasRepairHistory";
  const BOOLEAN_TOGGLES: Array<{ key: BoolKey; label: string }> = [
    { key: "hasSunroof", label: "Lyuk" },
    { key: "creditAvailable", label: "Kredit" },
    { key: "barterAvailable", label: "Barter" },
    { key: "seatHeating", label: "Oturacaq isidilməsi" },
    { key: "seatCooling", label: "Oturacaq soyudulması" },
    { key: "camera360", label: "360 kamera" },
    { key: "parkingSensors", label: "Park sensoru" },
    { key: "adaptiveCruise", label: "Adaptive cruise" },
    { key: "laneAssist", label: "Lane assist" },
    { key: "hasServiceBook", label: "Servis kitabçası" },
    { key: "hasRepairHistory", label: "Təmir tarixçəsi" }
  ];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/listings/${props.listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          make: form.make.trim(),
          model: form.model.trim(),
          year: Number(form.year),
          mileageKm: Number(form.mileageKm),
          city: form.city.trim(),
          priceAzn: Number(form.priceAzn),
          vin: form.vin.trim(),
          fuelType: form.fuelType,
          engineType: form.engineType || undefined,
          transmission: form.transmission,
          bodyType: form.bodyType || undefined,
          driveType: form.driveType || undefined,
          color: form.color || undefined,
          condition: form.condition || undefined,
          engineVolumeCc: isElectric || form.engineVolumeCc === "" ? undefined : Number(form.engineVolumeCc),
          interiorMaterial: form.interiorMaterial || undefined,
          hasSunroof: form.hasSunroof,
          creditAvailable: form.creditAvailable,
          barterAvailable: form.barterAvailable,
          seatHeating: form.seatHeating,
          seatCooling: form.seatCooling,
          camera360: form.camera360,
          parkingSensors: form.parkingSensors,
          adaptiveCruise: form.adaptiveCruise,
          laneAssist: form.laneAssist,
          ownersCount: form.ownersCount === "" ? undefined : Number(form.ownersCount),
          hasServiceBook: form.hasServiceBook,
          hasRepairHistory: form.hasRepairHistory
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Yenilənmə uğursuz oldu.");
        setBusy(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Yenilənmə uğursuz oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary w-full justify-center py-3"
        onClick={() => setOpen(true)}
      >
        Elanı redaktə et
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Elanı redaktə et</h3>
            <p className="mt-1 text-sm text-slate-500">
              Saxlandıqdan sonra elan avtomatik yenidən yoxlamaya göndəriləcək.
            </p>

            <form className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1" onSubmit={onSubmit}>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Başlıq"
                required
              />
              <textarea
                className="input-field min-h-[120px]"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Təsvir"
                required
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  className="input-field"
                  value={form.make}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextMake = e.target.value;
                      const nextModels = getModelsForMake(nextMake);
                      return {
                        ...prev,
                        make: nextMake,
                        model: nextModels.includes(prev.model) ? prev.model : nextModels[0] ?? ""
                      };
                    })
                  }
                >
                  {CAR_MAKES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={form.model}
                  onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                >
                  {modelOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <input
                  className="input-field"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Şəhər"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  value={form.priceAzn}
                  onChange={(e) => setForm((prev) => ({ ...prev, priceAzn: Number(e.target.value) }))}
                  placeholder="Qiymət"
                  required
                />
                <input
                  className="input-field"
                  type="number"
                  min={1950}
                  value={form.year}
                  onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                  placeholder="İl"
                  required
                />
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  value={form.mileageKm}
                  onChange={(e) => setForm((prev) => ({ ...prev, mileageKm: Number(e.target.value) }))}
                  placeholder="Yürüş (km)"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-field"
                  value={form.vin}
                  onChange={(e) => setForm((prev) => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                  placeholder="VIN (istəyə görə)"
                />
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  value={form.ownersCount}
                  onChange={(e) => setForm((prev) => ({ ...prev, ownersCount: e.target.value === "" ? "" : Number(e.target.value) }))}
                  placeholder="Sahib sayı"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  className="input-field"
                  value={form.fuelType}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextFuel = e.target.value;
                      const engines = getCompatibleEngineTypes(nextFuel);
                      const transmissions = getCompatibleTransmissions(nextFuel);
                      return {
                        ...prev,
                        fuelType: nextFuel,
                        engineType: engines.some((item) => item === prev.engineType) ? prev.engineType : engines[0] ?? "",
                        transmission: transmissions.some((item) => item === prev.transmission) ? prev.transmission : transmissions[0] ?? "",
                        engineVolumeCc: nextFuel === "Elektrik" ? "" : prev.engineVolumeCc
                      };
                    })
                  }
                >
                  {FUEL_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={form.engineType}
                  onChange={(e) => setForm((prev) => ({ ...prev, engineType: e.target.value }))}
                >
                  {engineTypeOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={form.transmission}
                  onChange={(e) => setForm((prev) => ({ ...prev, transmission: e.target.value }))}
                >
                  {transmissionOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="input-field" value={form.bodyType} onChange={(e) => setForm((prev) => ({ ...prev, bodyType: e.target.value }))}>
                  <option value="">Ban növü</option>
                  {BODY_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select className="input-field" value={form.driveType} onChange={(e) => setForm((prev) => ({ ...prev, driveType: e.target.value }))}>
                  <option value="">Ötürücü</option>
                  {DRIVE_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select className="input-field" value={form.color} onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}>
                  <option value="">Rəng</option>
                  {COLORS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="input-field" value={form.condition} onChange={(e) => setForm((prev) => ({ ...prev, condition: e.target.value }))}>
                  <option value="">Vəziyyət</option>
                  {CONDITIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select className="input-field" value={form.interiorMaterial} onChange={(e) => setForm((prev) => ({ ...prev, interiorMaterial: e.target.value }))}>
                  <option value="">Salon</option>
                  {INTERIOR_MATERIALS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <input
                  className="input-field"
                  type="number"
                  min={0}
                  disabled={isElectric}
                  value={form.engineVolumeCc}
                  onChange={(e) => setForm((prev) => ({ ...prev, engineVolumeCc: e.target.value === "" ? "" : Number(e.target.value) }))}
                  placeholder="Mühərrik həcmi (cc)"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3 text-sm text-slate-700">
                {BOOLEAN_TOGGLES.map(({ key, label }) => (
                  <label key={String(key)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {error && <p className="text-xs text-red-700">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Ləğv et
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Saxlanılır..." : "Yadda saxla və yoxlamaya göndər"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
