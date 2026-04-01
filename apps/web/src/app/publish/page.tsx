"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaProtocolInput, validateMediaProtocol } from "@/lib/media-protocol";
import { trackEvent } from "@/lib/analytics/client";
import { LISTING_PLANS, type PlanType } from "@/lib/listing-plans";

const STEPS = ["Avtomobil", "Media", "Plan", "Yoxlama"] as const;
type Step = (typeof STEPS)[number];

interface TrustApiResponse {
  ok: boolean;
  trustScore?: number;
  errors?: string[];
  signals?: {
    vinVerification: { status: string };
    mileageFlag?: { message: string; severity: string };
    sellerVerified: boolean;
    mediaComplete: boolean;
  };
}

const initialMedia: MediaProtocolInput = {
  imageCount: 20,
  engineVideoDurationSec: 20,
  hasFrontAngle: true,
  hasRearAngle: true,
  hasLeftSide: true,
  hasRightSide: true,
  hasDashboard: true,
  hasInterior: true,
  hasOdometer: true,
  hasTrunk: true
};

const mediaAngles: { key: keyof MediaProtocolInput; label: string }[] = [
  { key: "hasFrontAngle", label: "Ön" },
  { key: "hasRearAngle", label: "Arxa" },
  { key: "hasLeftSide", label: "Sol tərəf" },
  { key: "hasRightSide", label: "Sağ tərəf" },
  { key: "hasDashboard", label: "Torpan" },
  { key: "hasInterior", label: "Salon" },
  { key: "hasOdometer", label: "Odometr" },
  { key: "hasTrunk", label: "Baqaj" }
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
            i < idx ? "bg-brand-600 text-white" :
            i === idx ? "bg-brand-600 text-white ring-4 ring-brand-100" :
            "bg-slate-100 text-slate-400"
          }`}>
            {i < idx ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : i + 1}
          </div>
          <span className={`ml-2 text-sm font-medium mr-6 ${i === idx ? "text-brand-700" : "text-slate-400"}`}>
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`mr-6 h-px w-8 ${i < idx ? "bg-brand-600" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PublishPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("Avtomobil");
  const [title, setTitle] = useState("");
  const [priceAzn, setPriceAzn] = useState(0);
  const [city, setCity] = useState("Bakı");
  const [vin, setVin] = useState("");
  const [vinInfoType, setVinInfoType] = useState<"link" | "document">("link");
  const [vinInfoUrl, setVinInfoUrl] = useState("");
  const [vinDocumentRef, setVinDocumentRef] = useState("");
  const [serviceHistoryType, setServiceHistoryType] = useState<"link" | "document">("link");
  const [serviceHistoryUrl, setServiceHistoryUrl] = useState("");
  const [serviceHistoryDocumentRef, setServiceHistoryDocumentRef] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(2020);
  const [declaredMileageKm, setDeclaredMileageKm] = useState(0);
  const [fuelType, setFuelType] = useState("Benzin");
  const [transmission, setTransmission] = useState("Avtomat");
  const vinVerified = false;
  const sellerVerified = false;
  const [media, setMedia] = useState<MediaProtocolInput>(initialMedia);
  const [planType, setPlanType] = useState<PlanType>("free");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TrustApiResponse | null>(null);

  const mediaCheck = useMemo(() => validateMediaProtocol(media), [media]);

  const referenceNote = useMemo(() => {
    const notes: string[] = [];
    if (vinInfoType === "link" && vinInfoUrl.trim()) notes.push(`VIN məlumat linki: ${vinInfoUrl.trim()}`);
    if (vinInfoType === "document" && vinDocumentRef.trim()) notes.push(`VIN sənəd istinadı: ${vinDocumentRef.trim()}`);
    if (serviceHistoryType === "link" && serviceHistoryUrl.trim()) {
      notes.push(`Servis tarixçə linki: ${serviceHistoryUrl.trim()}`);
    }
    if (serviceHistoryType === "document" && serviceHistoryDocumentRef.trim()) {
      notes.push(`Servis tarixçəsi sənəd istinadı: ${serviceHistoryDocumentRef.trim()}`);
    }
    return notes.join(" | ");
  }, [serviceHistoryDocumentRef, serviceHistoryType, serviceHistoryUrl, vinDocumentRef, vinInfoType, vinInfoUrl]);

  function updateBoolean(field: keyof MediaProtocolInput, value: boolean) {
    setMedia((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    await trackEvent("listing_publish_attempted", { vin, city, sellerVerified, vinVerified });

    const response = await fetch("/api/trust/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: vin || crypto.randomUUID(),
        title,
        priceAzn,
        city,
        vehicle: { vin, make, model, year, declaredMileageKm },
        vinVerified,
        sellerVerified,
        mediaProtocol: media
      })
    });

    const payload = (await response.json()) as TrustApiResponse;
    setResult(payload);
    if (payload.ok) {
      await trackEvent("listing_published", { vin, city, trustScore: payload.trustScore ?? null });

      const createResponse = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: `${make} ${model} üçün yaradılan elan.${referenceNote ? ` Məlumat istinadları: ${referenceNote}` : ""}`,
          priceAzn,
          city,
          fuelType,
          transmission,
          sellerType: "private",
          vehicle: { vin: vin || crypto.randomUUID().slice(0, 17), make, model, year, declaredMileageKm },
          vinVerified,
          sellerVerified,
          mediaProtocol: media,
          planType
        })
      });

      const createPayload = (await createResponse.json()) as {
        ok: boolean;
        id?: string;
        error?: string;
        errors?: string[];
        paymentRequired?: boolean;
      };
      if (createPayload.ok && createPayload.id) {
        if (createPayload.paymentRequired) {
          const paymentResponse = await fetch("/api/payments/listing-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: createPayload.id,
              planType,
              source: "publish"
            })
          });
          const paymentPayload = (await paymentResponse.json()) as {
            ok: boolean;
            error?: string;
            checkoutUrl?: string;
          };
          if (paymentPayload.ok && paymentPayload.checkoutUrl) {
            router.push(paymentPayload.checkoutUrl);
            router.refresh();
            return;
          }
          setResult({
            ok: false,
            errors: [paymentPayload.error || "Ödəniş axını başladılmadı."]
          });
          setSubmitting(false);
          return;
        }

        router.push(`/listings/${createPayload.id}`);
        router.refresh();
        return;
      }
      setResult({
        ok: false,
        errors: createPayload.errors ?? [createPayload.error || "Elan yaradıla bilmədi."]
      });
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Elan yerləşdir</h1>
          <p className="mt-2 text-slate-500">Avtomobilinizi etibarlı alıcılara çatdırın</p>
        </div>

        <div className="mb-6 rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-4 text-sm text-slate-700">
          Avtomobilinizi hərrac formatında satmaq istəyirsinizsə, ayrıca{" "}
          <a href="/auction/sell" className="font-semibold text-[#0891B2] hover:underline">Auksion lotu yarat</a>{" "}
          axınından istifadə edin. Auksionda əsas satış ödənişi platformadan keçmir.
        </div>
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          EkoMobil məlumatların yerləşdirilməsi və yayımlanması üçün platformadır. Elan məzmununun düzgünlüyü, tamlığı və
          aktuallığı satıcının məsuliyyətindədir. VIN, servis tarixçəsi və digər istinadların əlavə edilməsi elanın
          keyfiyyətini yüksəldir.
        </div>

        <StepIndicator current={step} />

        {!result ? (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Step 1: Vehicle info */}
            {step === "Avtomobil" && (
              <div className="card p-8 space-y-5">
                <h2 className="text-lg font-semibold text-slate-900">Avtomobil məlumatları</h2>

                <div>
                  <label className="label">Elan başlığı</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="məs: Toyota Corolla 2019" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Marka</label>
                    <input value={make} onChange={(e) => setMake(e.target.value)} className="input-field" placeholder="Toyota" required />
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <input value={model} onChange={(e) => setModel(e.target.value)} className="input-field" placeholder="Corolla" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">İl</label>
                    <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field" min={1990} max={2026} required />
                  </div>
                  <div>
                    <label className="label">Yürüş (km)</label>
                    <input type="number" value={declaredMileageKm || ""} onChange={(e) => setDeclaredMileageKm(Number(e.target.value))} className="input-field" placeholder="72000" required />
                  </div>
                </div>

                <div>
                  <label className="label">VIN kodu</label>
                  <input value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} className="input-field font-mono tracking-widest uppercase" placeholder="17 simvol" maxLength={17} />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Etibarı artıran məlumatlar (tövsiyə olunur)</p>
                  <p className="mt-1 text-xs text-slate-600">
                    VIN və servis tarixçəsini açıq link və ya sənəd istinadı kimi paylaşa bilərsiniz. Bu məlumatlar alıcı üçün
                    daha şəffaf təqdimat yaradır.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">VIN məlumat formatı</label>
                      <select
                        value={vinInfoType}
                        onChange={(e) => setVinInfoType(e.target.value as "link" | "document")}
                        className="input-field"
                      >
                        <option value="link">Açıq link</option>
                        <option value="document">Sənəd istinadı</option>
                      </select>
                      {vinInfoType === "link" ? (
                        <input
                          type="url"
                          value={vinInfoUrl}
                          onChange={(e) => setVinInfoUrl(e.target.value)}
                          className="input-field mt-2"
                          placeholder="https://..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={vinDocumentRef}
                          onChange={(e) => setVinDocumentRef(e.target.value)}
                          className="input-field mt-2"
                          placeholder="Məs: vin-report.pdf və ya sənəd ID"
                        />
                      )}
                    </div>
                    <div>
                      <label className="label">Servis tarixçə formatı</label>
                      <select
                        value={serviceHistoryType}
                        onChange={(e) => setServiceHistoryType(e.target.value as "link" | "document")}
                        className="input-field"
                      >
                        <option value="link">Açıq link</option>
                        <option value="document">Sənəd istinadı</option>
                      </select>
                      {serviceHistoryType === "link" ? (
                        <input
                          type="url"
                          value={serviceHistoryUrl}
                          onChange={(e) => setServiceHistoryUrl(e.target.value)}
                          className="input-field mt-2"
                          placeholder="https://..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={serviceHistoryDocumentRef}
                          onChange={(e) => setServiceHistoryDocumentRef(e.target.value)}
                          className="input-field mt-2"
                          placeholder="Məs: service-history.pdf və ya sənəd ID"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Qiymət (₼)</label>
                    <input type="number" value={priceAzn || ""} onChange={(e) => setPriceAzn(Number(e.target.value))} className="input-field" placeholder="19800" required />
                  </div>
                  <div>
                    <label className="label">Yanacaq</label>
                    <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className="input-field">
                      {["Benzin", "Dizel", "Hibrid", "Elektrik", "Qaz"].map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ötürücü</label>
                    <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className="input-field">
                      {["Avtomat", "Mexanik", "Yarıavtomat"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Şəhər</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field">
                    {["Bakı", "Sumqayıt", "Gəncə", "Lənkəran", "Mingəçevir", "Digər"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <button type="button" onClick={() => setStep("Media")} className="btn-primary w-full justify-center py-3">
                  Növbəti: Media
                </button>
              </div>
            )}

            {/* Step 2: Media */}
            {step === "Media" && (
              <div className="card p-8 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Media protokolu</h2>
                <p className="text-sm text-slate-500">Minimum standart: 20 foto + 15-30 saniyə mühərrik videosu</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Foto sayı</label>
                    <input type="number" value={media.imageCount} onChange={(e) => setMedia((p) => ({ ...p, imageCount: Number(e.target.value) }))} className="input-field" min={0} />
                  </div>
                  <div>
                    <label className="label">Video müddəti (san)</label>
                    <input type="number" value={media.engineVideoDurationSec} onChange={(e) => setMedia((p) => ({ ...p, engineVideoDurationSec: Number(e.target.value) }))} className="input-field" min={0} max={60} />
                  </div>
                </div>

                <div>
                  <label className="label mb-3">Tələb olunan bucaqlar</label>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaAngles.map(({ key, label }) => (
                      <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        media[key] ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}>
                        <input
                          type="checkbox"
                          checked={media[key] as boolean}
                          onChange={(e) => updateBoolean(key, e.target.checked)}
                          className="h-4 w-4 rounded text-brand-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        {media[key] && (
                          <svg className="ml-auto h-4 w-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {!mediaCheck.isComplete && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-800 mb-2">Çatışmayan tələblər:</p>
                    <ul className="space-y-1">
                      {mediaCheck.missingRequirements.map((req) => (
                        <li key={req} className="text-sm text-amber-700 flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep("Avtomobil")} className="btn-secondary flex-1 justify-center py-3">
                    Geri
                  </button>
                  <button type="button" onClick={() => setStep("Plan")} className="btn-primary flex-1 justify-center py-3">
                    Növbəti: Plan
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Plan selection */}
            {step === "Plan" && (
              <div className="card p-8 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Elan planı</h2>
                <p className="text-sm text-slate-500">Elanınızın necə görünməsini seçin</p>
                {planType !== "free" && (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                    Paid plan seçiləndə elan əvvəlcə qaralama kimi yaradılır, sonra Kapital Bank ödəniş axını tamamlanandan sonra aktivləşir.
                  </div>
                )}

                <div className="grid gap-4">
                  {LISTING_PLANS.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition ${
                        planType === plan.id
                          ? "border-brand-500 bg-brand-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={planType === plan.id}
                        onChange={() => setPlanType(plan.id)}
                        className="mt-1 h-4 w-4 text-brand-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{plan.nameAz}</span>
                          <span className="font-bold text-slate-900">
                            {plan.priceAzn === 0 ? "Pulsuz" : `${plan.priceAzn} ₼`}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {plan.id === "free" && "Standart sıralanma, 30 gün"}
                          {plan.id === "standard" && "Vurğulanmış kart, 1.5x prioritet, statistika"}
                          {plan.id === "vip" && "Ön səhifə prioriteti, 3x klik, vurğulanmış"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep("Media")} className="btn-secondary flex-1 justify-center py-3">
                    Geri
                  </button>
                  <button type="button" onClick={() => setStep("Yoxlama")} className="btn-primary flex-1 justify-center py-3">
                    Növbəti: Yoxlama
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === "Yoxlama" && (
              <div className="card p-8 space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">Məlumatları yoxlayın</h2>

                <div className="rounded-xl bg-slate-50 divide-y divide-slate-200">
                  {[
                    ["Elan başlığı", title],
                    ["Marka / Model", `${make} ${model}`],
                    ["İl / Yürüş", `${year} / ${declaredMileageKm.toLocaleString()} km`],
                    ["Yanacaq / Ötürücü", `${fuelType} / ${transmission}`],
                    ["Qiymət", `${priceAzn.toLocaleString()} ₼`],
                    ["Şəhər", city],
                    ["VIN", vin || "—"],
                    ["VIN məlumatı", vinInfoType === "link" ? vinInfoUrl || "—" : vinDocumentRef || "—"],
                    [
                      "Servis tarixçəsi",
                      serviceHistoryType === "link" ? serviceHistoryUrl || "—" : serviceHistoryDocumentRef || "—"
                    ],
                    ["Media", mediaCheck.isComplete ? "Tam ✓" : `Çatışmayan: ${mediaCheck.missingRequirements.length}`],
                    ["Plan", LISTING_PLANS.find((p) => p.id === planType)?.nameAz ?? planType]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep("Plan")} className="btn-secondary flex-1 justify-center py-3">
                    Geri
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
                    {submitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Yoxlanılır...
                      </>
                    ) : planType === "free" ? "Elan yerləşdir" : "Ödənişə keç"}
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Result screen */
          <div className="card p-8 text-center space-y-6">
            {result.ok ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Elan qəbul edildi!</h2>
                  <p className="mt-2 text-slate-500">Etibar xalınız: <strong className="text-brand-700">{result.trustScore}/100</strong></p>
                </div>
                {result.signals?.mileageFlag && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 text-left">
                    <strong>Yürüş xəbərdarlığı:</strong> {result.signals.mileageFlag.message}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Elan bloklandi</h2>
                  <p className="mt-2 text-sm text-slate-500">Aşağıdakı səhvlər düzəldilməlidir:</p>
                </div>
                <ul className="text-left space-y-2">
                  {result.errors?.map((err) => (
                    <li key={err} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      {err}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button onClick={() => { setResult(null); setStep("Avtomobil"); }} className="btn-secondary">
              Yenidən cəhd et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
