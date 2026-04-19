"use client";

import { useState } from "react";
import Link from "next/link";

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

// ─── Plan options by group ────────────────────────────────────────────────────

const PLAN_OPTIONS = {
  official: [
    { value: "starter", label: "Starter — 79 ₼/ay", desc: "1 profil, 5 elan" },
    { value: "pro", label: "Pro — 149 ₼/ay", desc: "1 profil vurğulanmış, 25 elan" },
    { value: "premium", label: "Premium — 299 ₼/ay", desc: "5 filial, limitsiz elan" }
  ],
  inspection: [
    { value: "starter", label: "Starter — 59 ₼/ay", desc: "1 profil, 10 hesabat/ay" },
    { value: "pro", label: "Pro — 119 ₼/ay", desc: "3 profil, 50 hesabat/ay" },
    { value: "premium", label: "Premium — 249 ₼/ay", desc: "10 profil, limitsiz" }
  ],
  mechanic: [
    { value: "free", label: "Pulsuz", desc: "1 profil, 3 elan" },
    { value: "pro", label: "Pro Usta — 39 ₼/ay", desc: "1 profil vurğulanmış, 15 elan" },
    { value: "team", label: "Komanda — 89 ₼/ay", desc: "5 profil, 50 elan" }
  ]
};

type PlanGroupKey = keyof typeof PLAN_OPTIONS;

function getPlanGroupForType(type: ProviderTypeValue): PlanGroupKey {
  if (type === "official_service") return "official";
  if (type === "inspection_company") return "inspection";
  return "mechanic";
}

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
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const availableTags = providerType ? SERVICE_TAGS[providerType] : [];
  const planGroup = providerType ? getPlanGroupForType(providerType) : "mechanic";
  const planOptions = PLAN_OPTIONS[planGroup];

  const providerLabel =
    PROVIDER_GROUPS.flatMap((g) => g.types).find((t) => t.value === providerType)?.label ?? "";

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleCert(cert: string) {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
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
      `Preferred plan: ${selectedPlan || "-"}`,
      `Notes: ${notes.trim() || "-"}`
    ].join("\n");

    const subject = `[Servis Partnyor] ${providerName.trim()} • ${providerLabel} • ${city}`;

    setSubmitting(true);
    setFeedback(null);
    setIsError(false);
    try {
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "inspection_partner",
          subject,
          message,
          name: contactName.trim(),
          email: email.trim() || "noemail@ekomobil.az",
          phone: phone.trim()
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2]/10 text-xs font-bold text-[#0891B2]">1</span>
          Servis növünü seçin
        </h2>
        <p className="mt-1 text-xs text-slate-500">Profil tipini seçin — növbəti bölmədəki xidmət tagları avtomatik dəyişəcək.</p>

        <div className="mt-4 space-y-4">
          {PROVIDER_GROUPS.map((group) => (
            <div key={group.groupId}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.groupLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.types.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setProviderType(t.value);
                      setSelectedTags([]);
                      setSelectedPlan("");
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      providerType === t.value
                        ? "border-[#0891B2] bg-[#0891B2]/10 text-[#0891B2]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#0891B2]/40 hover:text-[#0891B2]"
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2]/10 text-xs font-bold text-[#0891B2]">2</span>
            Xidmət növlərini seçin
            <span className="ml-2 text-xs font-normal text-slate-400">(birdən çox seçilə bilər)</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Göstərdiyiniz xidmətlərə uyğun tagları seçin. Seçilmiş: {selectedTags.length}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedTags.includes(tag)
                    ? "border-[#0891B2] bg-[#0891B2]/10 font-medium text-[#0891B2]"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#0891B2]/40"
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
                  className="inline-flex items-center gap-1 rounded-full bg-[#0891B2]/10 px-2.5 py-1 text-xs font-medium text-[#0891B2]"
                >
                  {tag}
                  <button type="button" onClick={() => toggleTag(tag)} className="hover:text-[#0891B2]/60">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. Əsas məlumatlar ──────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2]/10 text-xs font-bold text-[#0891B2]">3</span>
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sertifikasiya / nişanlar</p>
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
                      ? "border-emerald-400 bg-emerald-50 font-medium text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                  }`}
                >
                  {certifications.includes(cert) ? "✓ " : ""}{cert}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Əlaqə məlumatları ────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2]/10 text-xs font-bold text-[#0891B2]">4</span>
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

      {/* ── 5. Plan seçimi ──────────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2]/10 text-xs font-bold text-[#0891B2]">5</span>
              Maraqlandığınız plan
            </h2>
            <Link href="/pricing#services" className="text-xs text-[#0891B2] hover:underline">
              Tam qiymət cədvəlinə bax →
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">İstəsəniz müraciət sonra da plan seçə bilərsiniz.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {planOptions.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setSelectedPlan(plan.value)}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                  selectedPlan === plan.value
                    ? "border-[#0891B2] bg-[#0891B2]/5"
                    : "border-slate-200 bg-white hover:border-[#0891B2]/40"
                }`}
              >
                <span className={`text-sm font-semibold ${selectedPlan === plan.value ? "text-[#0891B2]" : "text-slate-800"}`}>
                  {plan.label}
                </span>
                <span className="mt-0.5 text-xs text-slate-500">{plan.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Əlavə qeydlər ────────────────────────────────────────── */}
      {providerType && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0891B2]/10 text-xs font-bold text-[#0891B2]">6</span>
            Əlavə məlumat
            <span className="ml-2 text-xs font-normal text-slate-400">(isteğe bağlı)</span>
          </h2>
          <textarea
            className="input-field mt-4 min-h-24"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Filiallar, xüsusi avadanlıq, ixtisaslaşma, SLA, əlavə xidmətlər..."
          />

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-400">
          Başlamaq üçün yuxarıda servis növünü seçin
        </div>
      )}
    </form>
  );
}
