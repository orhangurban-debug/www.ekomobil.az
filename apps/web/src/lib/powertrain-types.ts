/**
 * EkoMobil — Güc Sistemi Kataloqu
 *
 * Bütün müasir avtomobil enerji sistemlərinin texniki izahı.
 * Hər kateqoriya müqayisə səhifəsində istifadəçilərə göstərilir.
 */

export type PowertrainCategory =
  | "ICE_PETROL"   // Adi benzin mühərriki
  | "ICE_DIESEL"   // Adi dizel mühərriki
  | "ICE_LPG"      // Qaz (LPG/CNG)
  | "MHEV"         // Yüngül Hibrid (Mild Hybrid)
  | "HEV"          // Tam Hibrid (özü şarjlanan)
  | "PHEV"         // Kənar şarjlı hibrid
  | "EREV"         // Uzadılmış diapazonal EV
  | "BEV"          // Tam elektrikli
  | "FCEV";        // Hidrogen yanacaq hüceyrəli

export interface FuelConsumptionSpec {
  /** Şəhər sərfiyyatı */
  city?: number;
  /** Magistral sərfiyyat */
  highway?: number;
  /** Kombinədir sərfiyyat */
  combined?: number;
  /** Ölçü vahidi */
  unit: "L/100km" | "kWh/100km" | "kg/100km";
  /** PHEV üçün: yalnız elektrik rejimindəki sərfiyyat */
  evOnlyCombined?: number;
  /** PHEV üçün elektrik rejimi ölçü vahidi */
  evUnit?: "kWh/100km";
  /** WLTP/NEDC/EPA qeydi */
  testCycle?: "WLTP" | "NEDC" | "EPA" | "JC08";
}

export interface ChargingSpec {
  /** Batareya tutumu (kWh) */
  batteryKwh: number;
  /** Sürətli DC şarj (kW) */
  fastChargeKw?: number;
  /** AC ev şarj (kW) */
  acChargeKw?: number;
  /** 10→80% şarj müddəti (dəqiqə) */
  charge10to80Min?: number;
  /** Tam elektrik diapazonu (km, WLTP) */
  electricRangeKm?: number;
  /** Şarj konnektor tipi */
  connectorType?: "Type2" | "CCS" | "CHAdeMO" | "GB/T" | "Tesla-NACS" | "Type1";
}

export interface PowertrainSpec {
  category: PowertrainCategory;
  /** Tam sistem gücü (at gücü, hp) */
  systemPowerHp?: number;
  /** Tam sistem gücü (kW) */
  systemPowerKw?: number;
  /** Mühərrik həcmi (sm³) — ICE olan sistemlər üçün */
  engineCc?: number;
  /** Yanacaq sərfiyyatı */
  fuelConsumption?: FuelConsumptionSpec;
  /** Batareya/şarj məlumatları (hibrid + EV) */
  charging?: ChargingSpec;
  /** Ümumi diapazonu (km) — yalnız ICE ilə birlikdə */
  totalRangeKm?: number;
}

// ── Texnologiya kataloqu ──────────────────────────────────────────────────────

export interface PowertrainTypeInfo {
  category: PowertrainCategory;
  /** Qısa etiket — interfeysdə göstərilir */
  label: string;
  /** Tam texnoloji ad */
  fullName: string;
  /** UI rəngi */
  color: string;
  /** Uyğun emoji/ikon */
  icon: string;
  /** 1-2 cümlə qısa izah */
  summary: string;
  /** Texniki izah — necə işləyir */
  howItWorks: string;
  /** Üstünlüklər */
  pros: string[];
  /** Çatışmazlıqlar */
  cons: string[];
  /** Nümunə modellər */
  exampleModels: string[];
  /** İdeal istifadəçi profili */
  bestFor: string;
}

export const POWERTRAIN_CATALOG: PowertrainTypeInfo[] = [
  {
    category: "ICE_PETROL",
    label: "Benzin",
    fullName: "Daxili Yanma Mühərriki (Benzin)",
    color: "#64748b",
    icon: "⛽",
    summary: "Ənənəvi benzin mühərriki. Sadə, geniş texniki xidmət şəbəkəsi.",
    howItWorks:
      "Benzin yanacağını partlatma yolu ilə kinetik enerjiyə çevirir. Yanacaq nasosla çatdırılır, silindrlərdə yandırılır, piston hərəkəti ötürücü vasitəsilə təkərlərə ötürülür.",
    pros: [
      "Geniş texniki xidmət şəbəkəsi",
      "Aşağı satınalma qiyməti",
      "Uzun məsafə diapazonu",
      "Sürətli doldurma (2–3 dəqiqə)"
    ],
    cons: [
      "Dizel və hibridə görə daha çox CO₂ buraxır",
      "Uzunmüddətli yanacaq xərci daha yüksəkdir",
      "Şəhər rejimində az səmərəlidir"
    ],
    exampleModels: ["Toyota Camry 2.5", "BMW 320i", "Mercedes C200", "VW Passat 1.4 TSI"],
    bestFor: "Şəhərlərarası, uzun məsafə, asan texniki xidmət axtaranlar"
  },
  {
    category: "ICE_DIESEL",
    label: "Dizel",
    fullName: "Daxili Yanma Mühərriki (Dizel)",
    color: "#334155",
    icon: "🛢️",
    summary: "Yüksək sıxılma ilə işləyən dizel mühərriki. Yük daşıma və uzun məsafədə səmərəlidir.",
    howItWorks:
      "Hava yüksək sıxılır (20:1 nisbət), bu istilik dizel yanacağını özü alovlandırır. Benzindən 30–40% daha az yanacaq yandırır, lakin NOx emissiyası daha yüksəkdir.",
    pros: [
      "Uzun məsafədə aşağı yanacaq sərfiyyatı",
      "Yüksək momentum gücü (torque)",
      "Uzun mühərrik ömrü",
      "Ağır yük daşımada üstün"
    ],
    cons: [
      "NOx/partikul emissiyası",
      "Şəhər rejimində DPF (partikul filtr) problemi",
      "Dizel kimi sürüş heyrəcanı vermir",
      "Soyuq havada çətin başlanma"
    ],
    exampleModels: ["VW Passat 2.0 TDI", "BMW 520d", "Mercedes E220d", "Land Rover Discovery Sport"],
    bestFor: "Uzun yol, şəhərlərarası, yük daşıyan sürücülər"
  },
  {
    category: "ICE_LPG",
    label: "LPG/Qaz",
    fullName: "Sıxılmış Qaz (LPG / CNG)",
    color: "#0891b2",
    icon: "💨",
    summary: "LPG (maye neft qazı) və ya CNG (təbii qaz) ilə işləyən mühərrik. Azərbaycanda geniş yayılmışdır.",
    howItWorks:
      "LPG — propan/butan qarışığı, yüksək təzyiq altında mayeyə çevrilir. CNG — metan qazı, yüksək təzyiqli silindrlərə sıxılır. Hər ikisi benzin mühərrikinə adaptasiya edilir.",
    pros: [
      "Yanacaq xərci benzindən 30–50% az",
      "Azərbaycanda geniş LPG şəbəkəsi",
      "CO₂ emissiyası benzindən az",
      "Mühərrik səs-küyü az"
    ],
    cons: [
      "Baqaj sahəsinin bir hissəsi silindrə verilir",
      "LPG maşın çıxışı limiti (çoxmərtəbəli park)",
      "Diapazonu benzindən az",
      "Yenidən quraşdırma xərci"
    ],
    exampleModels: ["Hyundai Sonata LPG", "Kia Carnival LPG", "Chevrolet Malibu LPG", "Toyota Camry LPG"],
    bestFor: "Şəhərdaxili, çox yürüşlü, yanacaq qənaəti axtaranlar"
  },
  {
    category: "MHEV",
    label: "Yüngül Hibrid",
    fullName: "Mild Hybrid Electric Vehicle (MHEV)",
    color: "#16a34a",
    icon: "⚡",
    summary: "Kiçik elektrik motoru əsas mühərrikə kömək edir. Xalis elektrik rejimi yoxdur, lakin yanacaq qənaəti 10–15% artır.",
    howItWorks:
      "48V elektrik sistemi əyləcləmə zamanı enerji toplayır (regenerativ əyləc). Bu enerji tormozlanma, sürətlənmə başlanğıcında və ya stop-start funksiyasında istifadə olunur. Elektrik motoru müstəqil sürüş təmin etmir — yalnız köməkçi rolunu oynayır.",
    pros: [
      "Şəhər trafikində 10–20% yanacaq qənaəti",
      "Adi hibridə görə ucuz",
      "Xarici şarj tələb olunmur",
      "Standart benzin/dizel texniki xidməti"
    ],
    cons: [
      "Elektrik rejimindən faydalanamırsınız",
      "Xalis HEV-dən az qənaət",
      "Bəzi sürücülər fərq hiss etmir"
    ],
    exampleModels: ["Mercedes C-Class (eSS)", "BMW 3 Series (EfficientDynamics)", "Ford Puma MHEV", "Suzuki Swift Hybrid"],
    bestFor: "Adi sürücü — texniki mürəkkəblik olmadan az da olsa qənaət istəyən"
  },
  {
    category: "HEV",
    label: "Tam Hibrid",
    fullName: "Full Hybrid / Self-Charging Hybrid (HEV)",
    color: "#15803d",
    icon: "🔋⛽",
    summary: "Özü şarj olan hibrid. Elektrik motoru müstəqil sürüş edə bilər, lakin xarici şarj yoxdur.",
    howItWorks:
      "İki mühərrik: 1) adi benzin mühərriki, 2) elektrik motoru. Sistem sürət, yük və batareya dolululuğuna görə avtomatik keçir. Aşağı sürətdə (şəhər) — elektrik. Yüksək sürətdə — benzin. Batareya regenerativ əyləclə doldurulur. Heç vaxt xarici şarj tələb olunmur.",
    pros: [
      "Şəhər rejimində 30–50% yanacaq qənaəti",
      "Xarici şarj tələb olunmur",
      "Uzun mühərrik ömrü (Toyota 300k+ km)",
      "Sakit, rahat sürüş",
      "Azərbaycanda geniş texniki xidmət (Toyota, Lexus)"
    ],
    cons: [
      "İlkin alıcı qiyməti PHEV-dən aşağı, lakin adi benzindən yüksəkdir",
      "Magistralda qənaət faydası azalır",
      "Batareyası PHEV qədər böyük deyil"
    ],
    exampleModels: [
      "Toyota Prius (4. nəsl)", "Toyota Camry Hybrid", "Toyota RAV4 Hybrid",
      "Lexus ES 300h", "Lexus RX 450h", "Hyundai Ioniq Hybrid", "Kia Niro HEV"
    ],
    bestFor: "Şəhər + şəhərlərarası qarışıq istifadə; texniki mürəkkəblikdən qaçanlar"
  },
  {
    category: "PHEV",
    label: "Plug-in Hibrid",
    fullName: "Plug-in Hybrid Electric Vehicle (PHEV)",
    color: "#7c3aed",
    icon: "🔌⛽",
    summary: "Xarici şarj edilən hibrid. Günlük sürüşü tam elektrikdə edir, uzun yolda benzinlə davam edir.",
    howItWorks:
      "HEV-ə oxşar, lakin çox daha böyük batareya (8–25 kWh) var. Evdə, işdə, ictimai şarj məntəqəsindən şarj edilir. Tam şarjla 40–100 km xalis elektrik rejimindədir. Batareya tükənəndə avtomatik adi hibrid (HEV) rejiminə keçir. Əgər gündəlik yol <60 km olarsa, faktiki yanacaq sərfiyyatı 1–2 L/100km-ə enə bilər.",
    pros: [
      "Günlük sürüş (60 km altında) demək olar yanacaqsız",
      "Uzun yolda rahat benzinlə davam",
      "Vergi güzəştləri (bir çox ölkədə)",
      "Elektrik sürüşünün rahat hissi"
    ],
    cons: [
      "Şarj infrastrukturundan asılı",
      "Batareyası şarj edilməzsə → HEV-dən ağır olduğundan yanacaq sərfiyyatı artır",
      "Alıcı qiyməti HEV-dən yüksəkdir",
      "Batareya zəmanəsi (8–10 il)"
    ],
    exampleModels: [
      "Mitsubishi Outlander PHEV", "Toyota RAV4 Prime", "Hyundai Tucson PHEV",
      "Kia Sportage PHEV", "BMW X5 xDrive45e", "Mercedes GLC 300e", "Volvo XC60 T8"
    ],
    bestFor: "Evdə/işdə şarj imkanı olanlar; günlük <60 km + bəzən uzun yol"
  },
  {
    category: "EREV",
    label: "Uzadılmış EV",
    fullName: "Extended Range Electric Vehicle (EREV / REX)",
    color: "#9333ea",
    icon: "⚡🔥",
    summary: "Əsasən elektrikli, lakin aralıq generator mühərriki var. PHEV-dən fərqlisi: mühərrik birbaşa təkəri çevirmır, yalnız elektrik istehsal edir.",
    howItWorks:
      "Böyük batareya (40–100 kWh) əsas güc mənbəyidir — həmişə elektrik motoru çevirdiyini edir. Batareya azalanda kiçik bir benzin mühərriki generator kimi işləyir, elektrik istehsal edir. Bu PHEV-dən konseptual fərqdir: PHEV-də benzin birbaşa ötürücüyə gedə bilər, EREV-də isə yalnız elektrik generatoru işlədir.",
    pros: [
      "Şəhər üçün tam elektrik hissi",
      "Uzun yol narahatlığı yoxdur (range anxiety)",
      "Hər iki dünya — EV rahatlığı + uzun diapazonu"
    ],
    cons: [
      "Mürəkkəb texniki quruluş",
      "Yüksək qiymət",
      "Benzin mühərriki müntəzəm işlədilməlidir (karbürizasiya problemi)"
    ],
    exampleModels: [
      "BMW i3 REX", "Chevrolet Volt (2. nəsl)", "Li Auto L7/L8/L9 (Çin bazarı)",
      "AITO M7 (Çin bazarı)"
    ],
    bestFor: "EV istəyir amma şarj infrastrukturundan narahat olan"
  },
  {
    category: "BEV",
    label: "Tam Elektrik",
    fullName: "Battery Electric Vehicle (BEV)",
    color: "#0891b2",
    icon: "⚡🔋",
    summary: "100% elektrikli. Benzin yoxdur. Şarj məntəqəsindən enerji alır.",
    howItWorks:
      "Böyük litiuma batareya paketi (40–100+ kWh) elektrik motoruna enerji verir. Birbaşa ötürücüyə qoşulur — bəzən çevirici (reduktor) olmadan belə mümkündür. Regenerativ əyləclə enerji geri toplanır. AC (ev, iş) və DC (sürətli şarj) şarj rejimləri var.",
    pros: [
      "Sıfır birbaşa emissiya",
      "Ən aşağı işlətmə xərci (yanacaq+texniki xidmət)",
      "Güclü ani sürətlənmə (torque cəld çatır)",
      "Ev şarjı ilə gündəlik rahatlıq",
      "Sakit sürüş"
    ],
    cons: [
      "Uzun şarj müddəti (DC sürətli: 20–45 dəqiqə, AC ev: 6–12 saat)",
      "Soyuq havada diapazonu azalır (20–40%)",
      "Şarj infrastrukturu hələ inkişaf edir",
      "Uzun məsafədə planlaşdırma tələb olunur"
    ],
    exampleModels: [
      "Tesla Model 3", "Tesla Model Y", "Hyundai Ioniq 5", "Kia EV6",
      "BYD Atto 3", "BYD Han", "BYD Seal", "Volkswagen ID.4", "BMW i4"
    ],
    bestFor: "Gündəlik şəhər istifadəsi; evdə şarj imkanı olanlar"
  },
  {
    category: "FCEV",
    label: "Hidrogen",
    fullName: "Fuel Cell Electric Vehicle (FCEV)",
    color: "#0369a1",
    icon: "💧⚡",
    summary: "Hidrogen yanacaq hüceyrəsi elektrik istehsal edir. Tullantısı yalnız su buxarıdır.",
    howItWorks:
      "Yüksək təzyiqli hidrogen tankından H₂ yanacaq hüceyrəsinə verilir. Hüceyrə içindəki kimyəvi reaksiya hidrogen və oksigeni birləşdirir: elektrik istehsal edir, tullantı olaraq yalnız su buxarı çıxır. Bu elektrik motoru çevirir. Kiçik bufer batareyası da var.",
    pros: [
      "Sıfır emissiya (yalnız su buxarı)",
      "3–5 dəqiqədə doldurma",
      "Uzun diapazonu (500–700 km)",
      "Çox soyuq havada BEV-dən yaxşı"
    ],
    cons: [
      "Hidrogen doldurma stansiyaları çox azdır",
      "Yüksək qiymət",
      "Hidrogen istehsalının özü hələ tam yaşıl deyil",
      "Yanacaq hüceyrəsi baxımı mürəkkəbdir"
    ],
    exampleModels: ["Toyota Mirai", "Hyundai Nexo"],
    bestFor: "İnfrastrukturun inkişaf etdiyi ölkələrdə; uzun diapazonu lazım olanlar"
  }
];

/** Kateqoriyaya görə məlumat tapır */
export function getPowertrainInfo(category: PowertrainCategory): PowertrainTypeInfo {
  return (
    POWERTRAIN_CATALOG.find((p) => p.category === category) ??
    POWERTRAIN_CATALOG[0]
  );
}

/** Güc sisteminin etiketini qaytarır */
export function getPowertrainLabel(category: PowertrainCategory): string {
  return getPowertrainInfo(category).label;
}

/** Növündən asılı olaraq "elektrik komponenti var mı?" */
export function hasElectricComponent(category: PowertrainCategory): boolean {
  return ["MHEV", "HEV", "PHEV", "EREV", "BEV", "FCEV"].includes(category);
}

/** Xarici şarj tələb olur mu? */
export function requiresCharging(category: PowertrainCategory): boolean {
  return ["PHEV", "EREV", "BEV"].includes(category);
}
