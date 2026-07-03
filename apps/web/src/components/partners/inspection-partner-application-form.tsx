"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ListingAiAnalyzePanel } from "@/components/listings/listing-ai-analyze-panel";
import { ListingPublishEaseTip } from "@/components/listings/listing-publish-ease-tip";
import type { ServiceAiSuggestion } from "@/lib/ai/listing-vision-types";
import {
  buildPartnerApplicationPlanOptions,
  getPartnerPlanGroupForProviderType
} from "@/lib/service-plans";
import { useLaunchPromo } from "@/hooks/use-launch-promo";

// ─── Provider types (grouped) ─────────────────────────────────────────────────

const PROVIDER_GROUPS = [
  {
    groupId: "official",
    groupLabel: "Rəsmi və ekspertiza",
    types: [
      { value: "official_service", label: "Rəsmi servis mərkəzi", icon: "🏢" },
      { value: "inspection_company", label: "Ekspertiza şirkəti", icon: "🔍" }
    ]
  },
  {
    groupId: "mechanic",
    groupLabel: "Mexanik və bərpa",
    types: [
      { value: "mechanic", label: "Mexanik / usta", icon: "🔧" },
      { value: "body_shop", label: "Dəmirçi / kuzov", icon: "🚗" },
      { value: "painting", label: "Rəngləmə", icon: "🎨" }
    ]
  },
  {
    groupId: "electric",
    groupLabel: "Elektrik və elektronika",
    types: [
      { value: "auto_electrician", label: "Avto elektrik", icon: "⚡" },
      { value: "ecu_programmer", label: "ECU proqramlaşdırma", icon: "💻" },
      { value: "adas_specialist", label: "ADAS / Kamera kalibrasiyası", icon: "📷" }
    ]
  },
  {
    groupId: "tech",
    groupLabel: "Yeni texnologiya",
    types: [
      { value: "ev_hybrid", label: "EV / Hibrid mütəxəssisi", icon: "🔋" }
    ]
  },
  {
    groupId: "comfort",
    groupLabel: "Komfort və interior",
    types: [
      { value: "ac_specialist", label: "Kondisioner / soyuducu", icon: "❄️" },
      { value: "audio_media", label: "Audio / multimedia", icon: "🔊" },
      { value: "glass_sunroof", label: "Cam / lyuk", icon: "🪟" }
    ]
  },
  {
    groupId: "wheel",
    groupLabel: "Şin və texeraltı",
    types: [
      { value: "tire_wheel", label: "Şin balansı / texeraltı", icon: "🛞" }
    ]
  }
] as const;

type ProviderTypeValue = (typeof PROVIDER_GROUPS)[number]["types"][number]["value"];
type ProviderOption = {
  value: ProviderTypeValue;
  label: string;
  icon: string;
};

type UploadedSupportFile = {
  name: string;
  url: string;
  mimeType: string;
  size: number;
};


// ─── Service tags by provider type ───────────────────────────────────────────

const SERVICE_TAGS: Record<ProviderTypeValue, string[]> = {
  official_service: [
    "Periodik baxım",
    "Zavod baxımı",
    "Rəsmi servis kitabçası",
    "Orijinal ehtiyat hissə",
    "ECU yeniləmə",
    "Zəmanət işləri",
    "Recall bərpa",
    "Diaqnostika",
    "Yağ dəyişimi",
    "Əyləc sistemi",
    "Asqı sistemi"
  ],
  inspection_company: [
    "220 bənd yoxlama",
    "Boya ölçümü",
    "Road test",
    "Rəqəmsal raport",
    "Kuzov yoxlama",
    "Motor diaqnostika",
    "Sığorta qiymətləndirilməsi",
    "Odometer yoxlama",
    "VIN yoxlama",
    "Pre-purchase yoxlama",
    "Şassi yoxlama",
    "Su sızıntısı yoxlama"
  ],
  mechanic: [
    "Mühərrik baxımı",
    "Yağ dəyişimi",
    "Süzgəc dəyişimi",
    "Əyləc sistemi",
    "Asqı sistemi",
    "Sürətlər qutusu",
    "Soyuducu sistemi",
    "Dizel sistemi",
    "Benzin sistemi",
    "Klapan qapağı",
    "Titreyicilik diaqnostika",
    "Transmissiya yağı"
  ],
  body_shop: [
    "Kuzov düzəltmə",
    "Qalvanoplastika",
    "Ciziq bərpası",
    "Qapı pıtraq bərpası",
    "Şassi düzəltmə",
    "Bərkidici işlər",
    "PDR (boyasız düzəltmə)",
    "Çarpışma bərpası",
    "Protekto örtüm",
    "Kapot dəyişimi"
  ],
  painting: [
    "Tam rəngləmə",
    "Partial rəngləmə",
    "Polishing",
    "Boya qoruma (PPF)",
    "Keramika örtüm",
    "Vinyl örtüm",
    "Boya düzəltmə",
    "Headlight restore",
    "Rəng uyğunlaşdırma",
    "Mat rəngləmə"
  ],
  auto_electrician: [
    "ABS/ESP diaqnostika",
    "Starter / alternator",
    "Sensor dəyişimi",
    "Kabel sistemi",
    "Batareya",
    "İşıqlandırma",
    "Sigorta bloku",
    "Elektrik sxemi",
    "Şarj sistemi",
    "Komfort modul"
  ],
  ecu_programmer: [
    "ECU oxuma / yazma",
    "DPF off",
    "EGR off",
    "Stage 1 tuning",
    "Stage 2 tuning",
    "İmmobilazer bərpası",
    "Adaptasiya",
    "VIN proqramlaşdırma",
    "Uçuş pilotu rejimi",
    "Başlanğıc siqnal",
    "Mileage düzəltmə"
  ],
  adas_specialist: [
    "Ön kamera kalibrasiyası",
    "Radar hizalanması",
    "Park sensorları",
    "ACC kalibrasiyası",
    "Lane assist",
    "Blind spot",
    "Cross traffic",
    "Night vision",
    "HUD kalibrasiya",
    "AEB sıfırlama"
  ],
  ev_hybrid: [
    "BMS diaqnostika",
    "Batareya balansı",
    "Batareya dəyişimi",
    "Şarj sistemi",
    "İnverter diaqnostika",
    "Rejenerativ əyləc",
    "Hibrid kalibrasiya",
    "Isidici sistem",
    "Kontaktor",
    "DC/DC konvertor",
    "OBD EV proqram"
  ],
  ac_specialist: [
    "Freón doldurma",
    "Kompressor dəyişimi",
    "Kondenser",
    "Evaporator",
    "Cabin filtr",
    "Hava axını balansı",
    "Isıtma sistemi",
    "Elektrikli kondisioner (EV)",
    "Klima dezinfeksiya"
  ],
  audio_media: [
    "Maqnitola montaj",
    "Dinamik dəyişimi",
    "Gücləndiricilər",
    "Subwoofer",
    "Geri görüntü kamerası",
    "360° kamera",
    "Android Auto / CarPlay",
    "Antena sistemi",
    "Səs izolyasiyası",
    "DVD/ekran montaj"
  ],
  glass_sunroof: [
    "Ön şüşə dəyişimi",
    "Arxa şüşə dəyişimi",
    "Yan şüşə dəyişimi",
    "Lyuk təmiri",
    "Ön şüşə yapışdırılması",
    "Toning",
    "Şüşə çatı",
    "Lyuk dəyişimi",
    "Su sızıntısı bərpası"
  ],
  tire_wheel: [
    "Şin balansı",
    "Alignment (kampır)",
    "Şin montaj / söküş",
    "Texeraltı",
    "Disk boyanması",
    "Disk düzəltmə",
    "Şin satışı",
    "Disk satışı",
    "TPMS sıfırlama",
    "Şin keçirilməsi"
  ]
};

// ─── Cities ──────────────────────────────────────────────────────────────────

const AZ_CITIES = [
  "Bakı", "Sumqayıt", "Gəncə", "Mingəçevir", "Naxçıvan",
  "Lənkəran", "Şirvan", "Neftçala", "Saatlı", "Salyan",
  "Ağcabədi", "Ağdam", "Ağdaş", "Bərdə", "Göygöl",
  "Şəki", "Şamaxı", "Quba", "Qusar", "Diğər"
];

// ─── Component ────────────────────────────────────────────────────────────────

export function InspectionPartnerApplicationForm() {
  const [providerType, setProviderType] = useState<ProviderTypeValue | "">("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [providerName, setProviderName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [experience, setExperience] = useState("");
  const [licenseInfo, setLicenseInfo] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceImages, setServiceImages] = useState<File[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [limitFeedback, setLimitFeedback] = useState<string | null>(null);

  const launchPromo = useLaunchPromo();
  const availableTags = providerType ? SERVICE_TAGS[providerType] : [];
  const planGroup = providerType ? getPartnerPlanGroupForProviderType(providerType) : "mechanic";
  const planOptions = useMemo(
    () => buildPartnerApplicationPlanOptions(planGroup, launchPromo),
    [planGroup, launchPromo]
  );
  const selectedPlanMeta = planOptions.find((plan) => plan.value === selectedPlan) ?? planOptions[0];

  const providerOptions = useMemo<ProviderOption[]>(() => {
    const options: ProviderOption[] = [];
    for (const group of PROVIDER_GROUPS) {
      for (const option of group.types) {
        options.push(option);
      }
    }
    return options;
  }, []);
  const providerLabel = providerOptions.find((option) => option.value === providerType)?.label ?? "";

  function toggleTag(tag: string) {
    if (!selectedTags.includes(tag) && selectedTags.length >= selectedPlanMeta.tagLimit) {
      setLimitFeedback(`Bu plan üzrə maksimum ${selectedPlanMeta.tagLimit} xidmət tagı seçilə bilər.`);
      return;
    }
    setLimitFeedback(null);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleCert(cert: string) {
    if (!certifications.includes(cert) && certifications.length >= selectedPlanMeta.certLimit) {
      setLimitFeedback(`Bu plan üzrə maksimum ${selectedPlanMeta.certLimit} sertifikasiya nişanı seçilə bilər.`);
      return;
    }
    setLimitFeedback(null);
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  }

  function mergeSelectedFiles(input: FileList | null, kind: "image" | "certificate") {
    if (!input) return;
    const nextFiles = Array.from(input);
    const existing = kind === "image" ? serviceImages : certificateFiles;
    const limit = kind === "image" ? selectedPlanMeta.imageLimit : selectedPlanMeta.certFileLimit;
    const merged = [...existing, ...nextFiles].slice(0, limit);
    if (existing.length + nextFiles.length > limit) {
      setLimitFeedback(`Bu plan üzrə maksimum ${limit} ${kind === "image" ? "şəkil" : "sertifikat faylı"} seçilə bilər.`);
    } else {
      setLimitFeedback(null);
    }
    if (kind === "image") {
      setServiceImages(merged);
    } else {
      setCertificateFiles(merged);
    }
  }

  function removeSelectedFile(index: number, kind: "image" | "certificate") {
    if (kind === "image") {
      setServiceImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
      return;
    }
    setCertificateFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  const applyServiceAiSuggestion = useCallback(
    (suggestion: ServiceAiSuggestion) => {
      if (suggestion.providerName) setProviderName(suggestion.providerName);
      if (suggestion.city) setCity(suggestion.city);
      if (suggestion.address) setAddress(suggestion.address);
      if (suggestion.workingHours) setWorkingHours(suggestion.workingHours);
      if (suggestion.experience) setExperience(suggestion.experience);
      if (suggestion.description) {
        setNotes((prev) => (prev.trim() ? `${prev.trim()}\n${suggestion.description}` : suggestion.description ?? ""));
      }
      if (
        suggestion.providerType &&
        providerOptions.some((option) => option.value === suggestion.providerType)
      ) {
        setProviderType(suggestion.providerType as ProviderTypeValue);
      }
      if (suggestion.suggestedTags?.length) {
        setSelectedTags((prev) => {
          const merged = [...prev];
          for (const tag of suggestion.suggestedTags ?? []) {
            if (!merged.includes(tag) && merged.length < selectedPlanMeta.tagLimit) {
              merged.push(tag);
            }
          }
          return merged;
        });
      }
      if (suggestion.suggestedCertifications?.length) {
        setCertifications((prev) => {
          const merged = [...prev];
          for (const cert of suggestion.suggestedCertifications ?? []) {
            if (!merged.includes(cert) && merged.length < selectedPlanMeta.certLimit) {
              merged.push(cert);
            }
          }
          return merged;
        });
      }
    },
    [providerOptions, selectedPlanMeta.certLimit, selectedPlanMeta.tagLimit]
  );

  async function uploadSelectedFiles(files: File[], kind: "image" | "certificate"): Promise<UploadedSupportFile[]> {
    const uploaded: UploadedSupportFile[] = [];
    for (const file of files) {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      const response = await fetch("/api/support/uploads", { method: "POST", body: form });
      const payload = (await response.json()) as { ok: boolean; error?: string; file?: UploadedSupportFile };
      if (!response.ok || !payload.ok || !payload.file) {
        throw new Error(payload.error ?? "Fayl yüklənə bilmədi.");
      }
      uploaded.push(payload.file);
    }
    return uploaded;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!providerType || !providerName.trim() || !city || !contactName.trim() || !phone.trim()) {
      setIsError(true);
      setFeedback("Servis tipi, ad, şəhər, əlaqə şəxsi və telefon mütləqdir.");
      return;
    }

    const message = [
      `Provider type: ${providerLabel}`,
      `Name: ${providerName.trim()}`,
      `City: ${city}`,
      `Address: ${address.trim() || "-"}`,
      `Map link: ${mapLink.trim() || "-"}`,
      `Working hours: ${workingHours.trim() || "-"}`,
      `Experience: ${experience.trim() || "-"}`,
      `Services: ${selectedTags.join(", ") || "-"}`,
      `Certifications: ${certifications.join(", ") || "-"}`,
      `License info: ${licenseInfo.trim() || "-"}`,
      `Contact: ${contactName.trim()}`,
      `Email: ${email.trim() || "-"}`,
      `Phone: ${phone.trim()}`,
      `WhatsApp: ${whatsapp.trim() || phone.trim()}`,
      `Website: ${website.trim() || "-"}`,
      `Preferred plan: ${selectedPlanMeta?.label ?? "-"}`,
      `Launch promo: ${selectedPlanMeta?.promo ? "eligible_for_first_30_days_free" : "not_applicable"}`,
      `Notes: ${notes.trim() || "-"}`
    ];

    const subject = `[Servis Partnyor] ${providerName.trim()} • ${providerLabel} • ${city}`;

    setSubmitting(true);
    setFeedback(null);
    setIsError(false);
    try {
      const uploadedImages = await uploadSelectedFiles(serviceImages, "image");
      const uploadedCertificates = await uploadSelectedFiles(certificateFiles, "certificate");
      if (uploadedImages.length > 0) {
        message.push(`Service images: ${uploadedImages.map((file) => `${file.name} → ${file.url}`).join(" | ")}`);
      }
      if (uploadedCertificates.length > 0) {
        message.push(`Certificate files: ${uploadedCertificates.map((file) => `${file.name} → ${file.url}`).join(" | ")}`);
      }
      const about = [experience.trim(), notes.trim()].filter(Boolean).join("\n\n");
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "inspection_partner",
          subject,
          message: message.join("\n"),
          name: contactName.trim(),
          email: email.trim() || "info@ekomobil.az",
          phone: phone.trim(),
          servicePartner: {
            providerType,
            name: providerName.trim(),
            city,
            address: address.trim() || undefined,
            mapUrl: mapLink.trim() || undefined,
            about,
            services: selectedTags,
            certifications: certifications.length > 0 ? certifications : undefined,
            imageUrls: uploadedImages.length > 0 ? uploadedImages.map((file) => file.url) : undefined,
            phone: phone.trim(),
            whatsapp: whatsapp.trim() || phone.trim()
          }
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setIsError(true);
        setFeedback(payload.error ?? "Müraciət göndərilə bilmədi.");
        return;
      }
      setIsError(false);
      setFeedback("Müraciət qəbul edildi! Tərəfdaşlıq komandamız 1-3 iş günü ərzində sizinlə əlaqə saxlayacaq.");
      // reset
      setProviderType("");
      setSelectedTags([]);
      setProviderName("");
      setCity("");
      setAddress("");
      setMapLink("");
      setWorkingHours("");
      setExperience("");
      setLicenseInfo("");
      setCertifications([]);
      setContactName("");
      setEmail("");
      setPhone("");
      setWhatsapp("");
      setWebsite("");
      setSelectedPlan("");
      setNotes("");
      setServiceImages([]);
      setCertificateFiles([]);
    } catch {
      setIsError(true);
      setFeedback("Server xətası baş verdi. Yenidən cəhd edin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">

      {/* ── 1. Servis tipi ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0057FF]/10 text-xs font-bold text-[#0057FF]">1</span>
          Servis növünü seçin
        </h2>
        <p className="mt-1 text-xs text-slate-500">Profil tipini seçin — növbəti bölmədəki xidmət tagları avtomatik dəyişəcək.</p>

        <div className="mt-4 space-y-4">
          {PROVIDER_GROUPS.map((group) => (
            <div key={group.groupId}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {group.groupLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.types.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      const nextPlanGroup = getPartnerPlanGroupForProviderType(t.value);
                      setProviderType(t.value);
                      setSelectedTags([]);
                      setCertifications([]);
                      setServiceImages([]);
                      setCertificateFiles([]);
                      setLimitFeedback(null);
                      setSelectedPlan(buildPartnerApplicationPlanOptions(nextPlanGroup)[0]?.value ?? "");
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      providerType === t.value
                        ? "border-[#0057FF] bg-[#0057FF]/10 text-[#0057FF]"
                        : "border-slate-900/10 bg-white text-slate-700 hover:border-[#0057FF]/40 hover:text-[#0057FF]"
                    }`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Xidmət tagları ───────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0057FF]/10 text-xs font-bold text-[#0057FF]">2</span>
            Xidmət növlərini seçin
            <span className="ml-2 text-xs font-normal text-slate-500">(birdən çox seçilə bilər)</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Cari plan: <span className="font-medium text-slate-700">{selectedPlanMeta.label}</span>. Seçilmiş: {selectedTags.length}/{selectedPlanMeta.tagLimit}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedTags.includes(tag)
                    ? "border-[#0057FF] bg-[#0057FF]/10 font-medium text-[#0057FF]"
                    : "border-slate-900/10 bg-white/60 text-slate-600 hover:border-[#0057FF]/40"
                }`}
              >
                {selectedTags.includes(tag) ? "✓ " : ""}{tag}
              </button>
            ))}
          </div>

          {selectedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0057FF]/10 px-2.5 py-1 text-xs font-medium text-[#0057FF]"
                >
                  {tag}
                  <button type="button" onClick={() => toggleTag(tag)} className="hover:text-[#0057FF]/60">×</button>
                </span>
              ))}
            </div>
          )}
          {limitFeedback && <p className="mt-3 text-xs text-amber-700">{limitFeedback}</p>}
        </div>
      )}

      {/* ── 3. Əsas məlumatlar ──────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0057FF]/10 text-xs font-bold text-[#0057FF]">3</span>
            Əsas məlumatlar
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {providerType === "mechanic" || providerType === "auto_electrician" || providerType === "body_shop" || providerType === "painting" || providerType === "ev_hybrid" || providerType === "ecu_programmer" || providerType === "adas_specialist" || providerType === "ac_specialist" || providerType === "audio_media" || providerType === "glass_sunroof" || providerType === "tire_wheel"
                  ? "Ad / Usta adı"
                  : "Şirkət / Mərkəz adı"}
                <span className="ml-1 text-rose-500">*</span>
              </span>
              <input
                className="input-field"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder={
                  providerType === "mechanic" ? "Məs: Usta Ramin, AutoMech Servisi"
                  : "Məs: AutoCheck MMC, Toyota Bakı Servis"
                }
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Şəhər <span className="text-rose-500">*</span>
              </span>
              <select className="input-field" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Şəhər seçin</option>
                {AZ_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">İş saatları</span>
              <input
                className="input-field"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="Məs: H-C 09:00–18:00, Şənbə 10:00–15:00"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ünvan</span>
              <input
                className="input-field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Küçə, bina, metro/landmark"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Google Maps / xəritə linki</span>
              <input
                className="input-field"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                placeholder="https://maps.google.com/... və ya https://maps.app.goo.gl/..."
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Təcrübə</span>
              <select className="input-field" value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="">Seçin</option>
                <option value="1-2 il">1–2 il</option>
                <option value="3-5 il">3–5 il</option>
                <option value="5-10 il">5–10 il</option>
                <option value="10+ il">10+ il</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lisenziya / akkreditasiya nömrəsi
              </span>
              <input
                className="input-field"
                value={licenseInfo}
                onChange={(e) => setLicenseInfo(e.target.value)}
                placeholder="Məs: ISO 9001, Brend akkreditasiya, ASAN №..."
              />
            </label>
          </div>

          {/* Sertifikasiya tagları */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sertifikasiya / nişanlar ({certifications.length}/{selectedPlanMeta.certLimit})
            </p>
            <div className="flex flex-wrap gap-2">
              {["ISO 9001", "Brend akkreditasiyası", "Müstəqil ekspert sertifikatı", "Tesla sertifikatı",
                "BMW Group sertifikatı", "Mercedes-Benz sertifikatı", "Toyota akkreditasiyası",
                "Hyundai / Kia sertifikatı", "EV mütəxəssis sertifikatı", "ADAS kalibrasiya sertifikatı"].map((cert) => (
                <button
                  key={cert}
                  type="button"
                  onClick={() => toggleCert(cert)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    certifications.includes(cert)
                      ? "border-emerald-400 bg-emerald-500/10 font-medium text-emerald-700"
                      : "border-slate-900/10 bg-white text-slate-600 hover:border-emerald-300"
                  }`}
                >
                  {certifications.includes(cert) ? "✓ " : ""}{cert}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Media və sənədlər ────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0057FF]/10 text-xs font-bold text-[#0057FF]">4</span>
            Şəkillər və sertifikat faylları
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Cari plan üzrə maksimum {selectedPlanMeta.imageLimit} şəkil və {selectedPlanMeta.certFileLimit} sertifikat faylı yükləyə bilərsiniz.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Servis şəkilləri ({serviceImages.length}/{selectedPlanMeta.imageLimit})
              </span>
              <input
                className="input-field"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={(e) => mergeSelectedFiles(e.target.files, "image")}
              />
              {serviceImages.length > 0 && (
                <div className="space-y-1">
                  {serviceImages.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-xs text-slate-600">
                      <span className="truncate">{file.name}</span>
                      <button type="button" className="text-rose-600" onClick={() => removeSelectedFile(index, "image")}>Sil</button>
                    </div>
                  ))}
                </div>
              )}
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sertifikat faylları ({certificateFiles.length}/{selectedPlanMeta.certFileLimit})
              </span>
              <input
                className="input-field"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={(e) => mergeSelectedFiles(e.target.files, "certificate")}
              />
              {certificateFiles.length > 0 && (
                <div className="space-y-1">
                  {certificateFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 text-xs text-slate-600">
                      <span className="truncate">{file.name}</span>
                      <button type="button" className="text-rose-600" onClick={() => removeSelectedFile(index, "certificate")}>Sil</button>
                    </div>
                  ))}
                </div>
              )}
            </label>
          </div>

          {limitFeedback && <p className="mt-3 text-xs text-amber-700">{limitFeedback}</p>}

          <ListingPublishEaseTip variant="service" className="mt-4" />

          <ListingAiAnalyzePanel
            analysisContext="service"
            optional
            servicePlanGroup={planGroup}
            servicePlanId={selectedPlan || selectedPlanMeta.value}
            providerTypeHint={providerType || undefined}
            onApplyService={applyServiceAiSuggestion}
            className="mt-4"
          />
        </div>
      )}

      {/* ── 5. Əlaqə məlumatları ────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0057FF]/10 text-xs font-bold text-[#0057FF]">5</span>
            Əlaqə məlumatları
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Əlaqə şəxsi <span className="text-rose-500">*</span>
              </span>
              <input
                className="input-field"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ad Soyad"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Telefon <span className="text-rose-500">*</span>
              </span>
              <input
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+994..."
                type="tel"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp</span>
              <input
                className="input-field"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+994... (fərqlidirsə)"
                type="tel"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
              <input
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@..."
                type="email"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vebsayt / Instagram</span>
              <input
                className="input-field"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://... və ya @instagramHandle"
              />
            </label>
          </div>
        </div>
      )}

      {/* ── 6. Plan seçimi ──────────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0057FF]/10 text-xs font-bold text-[#0057FF]">6</span>
              Maraqlandığınız plan
            </h2>
            <Link href="/pricing#services" className="text-xs text-[#0057FF] hover:underline">
              Tam qiymət cədvəlinə bax →
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">İlkin seçim avtomatik verilir, istəsəniz dəyişə bilərsiniz.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {planOptions.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => {
                  setSelectedPlan(plan.value);
                  setSelectedTags((prev) => prev.slice(0, plan.tagLimit));
                  setCertifications((prev) => prev.slice(0, plan.certLimit));
                  setServiceImages((prev) => prev.slice(0, plan.imageLimit));
                  setCertificateFiles((prev) => prev.slice(0, plan.certFileLimit));
                  setLimitFeedback(null);
                }}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  selectedPlan === plan.value
                    ? "border-[#0057FF] bg-[#0057FF]/5"
                    : "border-slate-900/10 bg-white hover:border-[#0057FF]/40"
                }`}
              >
                <span className={`text-sm font-semibold ${selectedPlan === plan.value ? "text-[#0057FF]" : "text-slate-800"}`}>
                  {plan.label}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">{plan.desc}</span>
                {plan.promo && (
                  <span className="mt-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    İlk 30 gün pulsuz
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Əlavə qeydlər ────────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0057FF]/10 text-xs font-bold text-[#0057FF]">7</span>
            Əlavə məlumat
            <span className="ml-2 text-xs font-normal text-slate-500">(isteğe bağlı)</span>
          </h2>
          <textarea
            className="input-field mt-4 min-h-24"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Filiallar, xüsusi avadanlıq, ixtisaslaşma, SLA, əlavə xidmətlər..."
          />

          <div className="mt-4 rounded-xl alert-warning border p-3 text-xs text-amber-700 leading-relaxed">
            EkoMobil servis profilini siyahıya alır və müştəri-xidmət əlaqəsini asanlaşdırır. Platforma konkret texniki
            nəticə və xidmət keyfiyyətinə hüquqi zəmanət vermir.
          </div>
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────────── */}
      {providerType && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="btn-primary px-8 py-3"
            disabled={submitting}
          >
            {submitting ? "Göndərilir..." : "Partnyor müraciəti göndər"}
          </button>
          {feedback && (
            <span className={`text-sm font-medium ${isError ? "text-rose-600" : "text-emerald-700"}`}>
              {feedback}
            </span>
          )}
        </div>
      )}

      {!providerType && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-10 text-center text-sm text-slate-500">
          Başlamaq üçün yuxarıda servis növünü seçin
        </div>
      )}
    </form>
  );
}
