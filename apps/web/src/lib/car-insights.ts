/**
 * EkoMobil — Model səviyyəsində avtomobil analitikası
 *
 * Məlumat mənbələri: J.D. Power IQS/VDS, Consumer Reports Reliability Survey,
 * TÜV Report (Almaniya), What Car? Owner Satisfaction, NCAP/NHTSA Safety Ratings,
 * Euro NCAP. Reytinqlər 1–10 şkalasında verilir (10 — ən yaxşı).
 *
 * Qeyd: Məlumatlar beynəlxalq ortalama göstəriciləri əks etdirir;
 * fərdi istifadə şəraitinə görə fərqlənə bilər.
 */

import type { PowertrainCategory, PowertrainSpec } from "@/lib/powertrain-types";
export type { PowertrainCategory, PowertrainSpec };

export type MaintenanceCost = "aşağı" | "orta" | "yüksək" | "çox yüksək";

export interface CarModelRatings {
  /** Uzunmüddətli etibarlılıq — TÜV/Consumer Reports/J.D. Power əsasında */
  reliability: number;
  /** Kabin konfortu, yol tutma, titrəmə */
  comfort: number;
  /** Dinamika, sürətlənmə, idarəetmə */
  performance: number;
  /** Yanacaq sərfiyyatı səmərəliliyi */
  economy: number;
  /** NCAP/NHTSA təhlükəsizlik reytinqi */
  safety: number;
}

export interface CarModelInsights {
  /** Marka — case-insensitive uyğunlaşdırma üçün */
  make: string;
  /** Model — qismən uyğunlaşdırma dəstəklənir */
  model: string;
  /** Tətbiq olunan ən erkən model ili */
  yearFrom: number;
  /** Tətbiq olunan ən son model ili (undefined = hal-hazıra qədər) */
  yearTo?: number;
  /** Kateqoriya reytinqləri (1–10) */
  ratings: CarModelRatings;
  /** Sahibkar məmnuniyyəti faizi (0–100) */
  ownerSatisfaction: number;
  /** Güclü cəhətlər (3–5 maddə) */
  strengths: string[];
  /** Zəif cəhətlər (3–5 maddə) */
  weaknesses: string[];
  /** Yüksək yürüşdə tez-tez rast gəlinən problemlər */
  commonProblems: string[];
  /** Qulluq xərci səviyyəsi */
  maintenanceCost: MaintenanceCost;
  /** Beynəlxalq mənbə qeydi */
  sourceNote: string;
  /** Qısa analitik yekun */
  verdict: string;
  /** Güc sistemi məlumatları (opsional — tam analiz üçün) */
  powertrain?: PowertrainSpec;
}

const insights: CarModelInsights[] = [
  // ── Toyota ────────────────────────────────────────────────────────────────
  {
    make: "Toyota",
    model: "Camry",
    yearFrom: 2018,
    ratings: { reliability: 9, comfort: 8, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 88,
    strengths: [
      "Sənaye üzrə ən yüksək etibarlılıq göstəriciləri",
      "Uzunmüddətli davamlılıq (250 000+ km sorunsuz)",
      "Güclü ikinci əl dəyəri",
      "Toyota texniki xidmət şəbəkəsinin geniş əhatəsi"
    ],
    weaknesses: [
      "Sürücü zövqü məhdud — sürüş heyrəcan vermur",
      "Kabin materialları premium seqmentdən geri qalır",
      "2.5L 4-silindrli mühərrikdə yağ sərfi (100 000+ km)"
    ],
    commonProblems: [
      "2.5L A25A mühərrikdə yağ sərfi (2018–2020 model illəri)",
      "8AT sürət qutusunda nadir hallarda vibrasiya",
      "Kondensat sensoru ilə bağlı klima problemləri"
    ],
    maintenanceCost: "orta",
    sourceNote: "J.D. Power VDS 2023 · Consumer Reports 2024 · TÜV Report 2023",
    verdict: "Azərbaycan şəraitinə ən uyğun seçimlərdən biri. Yüksək etibarlılıq, münasib qulluq xərci və güclü ikinci əl dəyəri onu ideal uzunmüddətli investisiyaya çevirir."
  },
  {
    make: "Toyota",
    model: "Corolla",
    yearFrom: 2019,
    ratings: { reliability: 9, comfort: 7, performance: 6, economy: 8, safety: 9 },
    ownerSatisfaction: 86,
    strengths: [
      "Dünyada ən çox satılan avtomobilin etibarlılıq irsini daşıyır",
      "Aşağı yanacaq sərfiyyatı (1.8L hibrid versiya)",
      "Kompakt kabin baxımından rahat manevr",
      "NCAP 5 ulduz (2019+)"
    ],
    weaknesses: [
      "Kabin səs izolyasiyası orta səviyyədə",
      "Arxa oturağın rahatı sedan seqment üçün aşağıdır",
      "CVT ötürücü yüksək yüklənmədə yavaşlıq hissi verir"
    ],
    commonProblems: [
      "CVT ötürücüdə nadir titrəmə (2019–2021)",
      "Ön işıqda rütubət toplanması",
      "Ekran üzərindəki sensor donması (proqram yeniləməsi ilə aradan qaldırılır)"
    ],
    maintenanceCost: "aşağı",
    sourceNote: "Consumer Reports 2024 · Euro NCAP 2019 · TÜV Report 2023",
    verdict: "Büdcə dostu qulluq xərcləri və mükəmməl etibarlılıq. Şəhər istifadəsi üçün praktiki seçim; sürüş zövqü axtaranlar üçün digər modellərə baxmaq tövsiyə olunur."
  },
  {
    make: "Toyota",
    model: "RAV4",
    yearFrom: 2019,
    ratings: { reliability: 8, comfort: 8, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 85,
    strengths: [
      "Kabin həcmi sinifinin ən yaxşılarından biri",
      "Hibrid versiyada 5.8 L/100 km sərfiyyat",
      "AWD sisteminin etibarlılığı",
      "Yük tutumu və praktiklik"
    ],
    weaknesses: [
      "1.8L benzin versiyasının dinamikası zəifdir",
      "Bəzi materiallar qiymət seqmentinə görə ucuz hiss olunur",
      "2019 modellərdə CVT transmissiyasında titrəmə şikayətləri"
    ],
    commonProblems: [
      "2019–2020 modellərdə CVT titrəməsi (DINFO kampaniyası mövcuddur)",
      "Klimanın kompressor sızıntısı (nadir)",
      "Ön fənərlərin sarıya çevrilməsi"
    ],
    maintenanceCost: "orta",
    sourceNote: "J.D. Power IQS 2023 · Consumer Reports 2024 · Euro NCAP 2019",
    verdict: "Ailə SUV-u kimi güclü seçim. Hibrid versiyanı tövsiyə edirik — uzunmüddətli qulluq xərclərini əhəmiyyətli dərəcədə azaldır."
  },
  {
    make: "Toyota",
    model: "Land Cruiser",
    yearFrom: 2016,
    ratings: { reliability: 9, comfort: 9, performance: 7, economy: 4, safety: 8 },
    ownerSatisfaction: 92,
    strengths: [
      "Yolsuzluqda eşsiz inam verən platforma",
      "1GD/2GD dizel mühərrikin yüksək davamlılığı",
      "İkinci əl dəyərinin az düşməsi (Azərbaycanda çox tələbatlı)",
      "Geniş kabin, lüks avadanlıq"
    ],
    weaknesses: [
      "Yanacaq sərfiyyatı 13–16 L/100 km aralığında",
      "Şəhər şəraitində böyük ölçü çətinlik yaradır",
      "Yüksək satınalma qiyməti"
    ],
    commonProblems: [
      "V8 4.5L dizel (2015–2021): EGR tıxanması",
      "Hava asqısı nasazlığı (200 seriyası, yüksək yürüşdə)",
      "Turbo intercooler boru sızıntısı"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "J.D. Power VDS 2023 · TÜV Report 2022 · Owner surveys",
    verdict: "Uzunmüddətli dəyər saxlayan nadir modellərdən. Yanacaq sərfiyyatı yüksəkdir, lakin etibarlılıq və ikinci əl qiyməti bunu kompensasiya edir."
  },
  {
    make: "Toyota",
    model: "Prius",
    yearFrom: 2016,
    ratings: { reliability: 9, comfort: 7, performance: 5, economy: 10, safety: 8 },
    ownerSatisfaction: 82,
    powertrain: {
      category: "HEV",
      systemPowerHp: 122,
      engineCc: 1798,
      fuelConsumption: { city: 4.3, highway: 5.0, combined: 4.6, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: [
      "4.5–5.0 L/100 km ilə Azərbaycanda ən sərfəli yanacaq xərcləri",
      "Hibrid batareyası (Nickel-Metal Hydride) 300 000+ km davamlıdır",
      "Toyota etibarlılıq irsini tam daşıyır"
    ],
    weaknesses: [
      "Sürüş dinamikası çox passiv",
      "Arxa görüş məhduddu",
      "Qış təkərlərinin seçimi məhdudlaşdırılmış"
    ],
    commonProblems: [
      "EGR ventili tıxanması (yüksək yürüşdə)",
      "Batareya soyutma sistemi filtri tıxanması",
      "Inverter soyutma nasosu arızası (150 000+ km)"
    ],
    maintenanceCost: "aşağı",
    sourceNote: "Consumer Reports 2024 · J.D. Power 2023",
    verdict: "Yanacaq qənaəti prioritet olduqda ilk seçim. Günlük şəhər istifadəsi üçün mükəmməl; dinamik sürüş istəyənlər üçün alternativ tövsiyə olunur."
  },

  // ── Hyundai ──────────────────────────────────────────────────────────────
  {
    make: "Hyundai",
    model: "Tucson",
    yearFrom: 2016,
    yearTo: 2020,
    ratings: { reliability: 6, comfort: 7, performance: 6, economy: 7, safety: 8 },
    ownerSatisfaction: 72,
    strengths: [
      "Dizayn cəlbediciliyi",
      "Texnoloji avadanlıq (2019+)",
      "Kabin genişliyi sinfinə görə yaxşıdır"
    ],
    weaknesses: [
      "Nu 2.0 GDi / Theta II mühərriklərdə yüksək miqyaslı nasazlıq kampaniyaları",
      "DCT (ikicücəli sürət qutusu) şəhər şəraitində düzgün işləmir",
      "Yüksək yürüşdə ehtiyat hissəsi xərci yüksəkdir"
    ],
    commonProblems: [
      "Theta II / Nu GDi mühərrikdə yağ sızıntısı və pistonkol aşınması (RECALL)",
      "DCT sürət qutusunda titrəmə, sürüşmə (RECALL)",
      "Ön sürət qutusu dayağının aşınması"
    ],
    maintenanceCost: "orta",
    sourceNote: "NHTSA Recall database · Consumer Reports 2022 · TÜV 2022",
    verdict: "Bu nəsil üçün əhiyatlı olmağı tövsiyə edirik. Mühərrik recall tarixçəsini yoxlayın. 4-cü nəsil (2021+) bu problemləri aradan qaldırmışdır."
  },
  {
    make: "Hyundai",
    model: "Tucson",
    yearFrom: 2021,
    ratings: { reliability: 8, comfort: 9, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 83,
    strengths: [
      "Müasir dizayn — seqmentin ən cazibədarı",
      "Panoramik günəş damı, ventilasiyalı oturacaqlar (Prestige)",
      "Smartstream 1.6T mühərriki etibarlıdır",
      "Mükəmməl NCAP nəticəsi (5 ulduz)"
    ],
    weaknesses: [
      "Smartstream 1.6 T-GDi PHEV versiyasında batareya qızdırma problemi",
      "Konsolun toxunma düymələri intuitiv deyil",
      "DCT 48V mild-hybrid versiyasında nadir əyləc hissi"
    ],
    commonProblems: [
      "1.6 T-GDi turbonun turboşarjer yağ sızıntısı (yüksək yürüşdə)",
      "Arxa kamera şüşəsinin dumlanması",
      "OTA yeniləmə zamanı multimedia donması"
    ],
    maintenanceCost: "orta",
    sourceNote: "Euro NCAP 2021 · Consumer Reports 2023 · J.D. Power 2023",
    verdict: "Əvvəlki nəslin problemlərindən tamamilə azad edilmiş versiya. Dizayn və texnologiya baxımından seqmentin liderləri arasındadır."
  },
  {
    make: "Hyundai",
    model: "Elantra",
    yearFrom: 2021,
    ratings: { reliability: 8, comfort: 7, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 80,
    strengths: [
      "Smartstream 1.6L mühərrikinin etibarlılığı",
      "Dizayn cəlbediciliyi (7-ci nəsil)",
      "Standart avadanlıqda çoxlu xüsusiyyət",
      "NCAP 5 ulduz"
    ],
    weaknesses: [
      "Arxa oturaq yer məhdudluğu",
      "CVT ötürücü yüksək sürətdə xoşagəlməz titrəmə",
      "Salon materialları Camry-dən aşağıdır"
    ],
    commonProblems: [
      "CVT sürət qutusunda vibrasiyon titrəmə",
      "Ön göstərici lampalarının su dolması",
      "Elektrik pəncərə motorunun sürüşməsi (30 000 km sonra)"
    ],
    maintenanceCost: "aşağı",
    sourceNote: "Consumer Reports 2023 · Euro NCAP 2021 · J.D. Power 2023",
    verdict: "Gündəlik sedan üçün ağlabatan seçim. Camry-nin etibarlılığına çatmasa da qiymət/avadanlıq nisbəti üstünlük verir."
  },
  {
    make: "Hyundai",
    model: "Santa Fe",
    yearFrom: 2019,
    ratings: { reliability: 7, comfort: 9, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 78,
    strengths: [
      "Ailə üçün geniş kabin (7 yerli seçim)",
      "Keyfiyyətli materiallar (Premium trim)",
      "Smartstream 2.5T mühərrikinin gücü",
      "NCAP 5 ulduz (2021+)"
    ],
    weaknesses: [
      "Smartstream 2.5T ilk modellərdə yanacaq direktinjektor arızası",
      "8DCT sürət qutusunun şəhər şəraitindəki tərəddüdü",
      "Ehtiyat hissəsinin dəyəri Tucson-dan yüksəkdir"
    ],
    commonProblems: [
      "Smartstream 2.5T GDi: injector tıxanması (erken modellər)",
      "Elektrik hatch motorunun zəifləməsi",
      "Şüşə isitmə elementinin qopması"
    ],
    maintenanceCost: "orta",
    sourceNote: "J.D. Power VDS 2023 · Euro NCAP 2021",
    verdict: "Böyük ailə üçün rahat seçim. Smartstream mühərriklərinin etibarlılıq statistikasının hələ tam formalaşmadığını nəzərə alın."
  },

  // ── Kia ──────────────────────────────────────────────────────────────────
  {
    make: "Kia",
    model: "Sportage",
    yearFrom: 2016,
    yearTo: 2021,
    ratings: { reliability: 7, comfort: 7, performance: 6, economy: 7, safety: 8 },
    ownerSatisfaction: 74,
    strengths: [
      "Cəlbedici dizayn",
      "Dəyər/avadanlıq nisbəti yaxşıdır",
      "Geniş çeşid seçimləri"
    ],
    weaknesses: [
      "Hyundai ilə eyni platformadan gəlir — GDi mühərrik problemlərini paylaşır",
      "DCT ötürücü şəhər trafikindəki tərəddüdü",
      "Yüksək yürüşdə ehtiyat hissəsi baha başa gəlir"
    ],
    commonProblems: [
      "Nu/Theta GDi mühərrikdə yağ sərfi (RECALL mövcuddur)",
      "DCT ötürücüdə titrəmə (firmware yeniləməsi lazımdır)",
      "Ön sürət qutusu özünün aşınması"
    ],
    maintenanceCost: "orta",
    sourceNote: "NHTSA 2022 · Consumer Reports 2022 · TÜV 2022",
    verdict: "Recall tarixçəsini mütləq yoxlayın. 5-ci nəsil (2022+) bu mühərrik problemlərini həll etmişdir."
  },
  {
    make: "Kia",
    model: "Sportage",
    yearFrom: 2022,
    ratings: { reliability: 8, comfort: 8, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 84,
    strengths: [
      "Smartstream 1.6T mühərrikinin etibarlılığı artıb",
      "Müasir ADAS sürücü köməkçiləri",
      "NCAP 5 ulduz",
      "Cazibədar ikinci nəsil dizayn"
    ],
    weaknesses: [
      "1.6T PHEV versiyasında akkumulyator idarəetmə sistemi şikayətləri",
      "Yüksək trimin ehtiyat hissəsi baha başa gəlir",
      "Arxa görüş kamerası karbonla örtülür (aktiv isitmə olmadan)"
    ],
    commonProblems: [
      "Akıllı klyuç pil tükənməsi ilə başlanan avtomatik kilid problemi",
      "Kamera gecə görüşünün keyfiyyəti zəifdir",
      "Media sisteminin yenilənmə zamanı donması"
    ],
    maintenanceCost: "orta",
    sourceNote: "Euro NCAP 2022 · J.D. Power 2023 · Consumer Reports 2023",
    verdict: "Əvvəlki nəslə nisbətən əhəmiyyətli yaxşılaşma. Dizayn, təhlükəsizlik və mühərrik etibarlılığı baxımından Tucson 4-cü nəsillə rəqabətə gedir."
  },
  {
    make: "Kia",
    model: "Sorento",
    yearFrom: 2021,
    ratings: { reliability: 8, comfort: 9, performance: 7, economy: 6, safety: 9 },
    ownerSatisfaction: 82,
    strengths: [
      "Ailə SUV-u kimi geniş kabin",
      "2.5T mühərrikinin gücü (281 at gücü)",
      "NCAP 5 ulduz",
      "Lüks avadanlıq seçimləri"
    ],
    weaknesses: [
      "Yanacaq sərfiyyatı şəhərdə 12–14 L yüksək",
      "8DCT ötürücü sürüşkənliyi",
      "Hibrid olmayan versiyada iqtisadiyyat zəifdir"
    ],
    commonProblems: [
      "2.5T T-GDi injector tıxanması (50 000 km sonra)",
      "Elektrik arka kapı motorunun yavaşlaması",
      "Baş-up display (HUD) parlaqlıq kalibrasiyası"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "Euro NCAP 2021 · J.D. Power 2023",
    verdict: "Premium ailəvi SUV üçün yaxşı seçim. Hibrid variantı iqtisadiyyatı əhəmiyyətli artırır."
  },
  {
    make: "Kia",
    model: "K5",
    yearFrom: 2020,
    ratings: { reliability: 8, comfort: 8, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 83,
    strengths: [
      "Sürüş dinamikası seqment üzrə yüksək qiymətləndirilir",
      "1.6T mühərrikinin istifadəçi məmnuniyyəti",
      "Sportif dizayn",
      "NCAP 5 ulduz"
    ],
    weaknesses: [
      "Arxa oturaq daha geniş ola bilərdi",
      "Konsolun kiçik yaddaş yuvası",
      "Yüksək trim qiymət kəsimlərinin fərqi az hiss olunur"
    ],
    commonProblems: [
      "1.6T turbo körpüsündə nadir yağ sızıntısı",
      "CarPlay bağlantısının kəsilməsi (proqram yeniləməsi ilə düzəlir)",
      "Ön fənərlərin rütubəti"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2023 · Euro NCAP 2020 · J.D. Power 2023",
    verdict: "Camry-yə alternativ olaraq cəlbedici dinamika təklif edir. Etibarlılıq statistikası hələ tam oturşmasa da göstəricilər müsbətdir."
  },

  // ── BMW ───────────────────────────────────────────────────────────────────
  {
    make: "BMW",
    model: "3 Series",
    yearFrom: 2019,
    ratings: { reliability: 7, comfort: 8, performance: 9, economy: 7, safety: 9 },
    ownerSatisfaction: 78,
    strengths: [
      "Sürüş dinamikası sedan seqmentinin etalonu",
      "B58 3.0L mühərrikinin möhkəmliyi (330i/340i)",
      "M Sport paketinin sürüş xüsusiyyətləri",
      "NCAP 5 ulduz"
    ],
    weaknesses: [
      "Texniki xidmət xərci Toyota/Hyundai-dən 2–3 dəfə yüksəkdir",
      "Su nasosu/termostat arızaları 60–80 000 km-də tez-tez görülür",
      "Plastik soyutma sistemi komponentlərinin köhnəlməsi"
    ],
    commonProblems: [
      "B48/B58 mühərrikdə su nasosu arızası (orta statistika: 80 000 km)",
      "N47/B47 dizeldə Valvetronic sürücüsü gərginliyi",
      "Elektrik yelpazəsi arızası (xərcli düzəliş)",
      "iDrive multimedia sisteminin donması"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "TÜV Report 2023 · Consumer Reports 2023 · JD Power 2023",
    verdict: "Sürüş zövqü üçün seçim. Yüksək qulluq xərclərini büdcəyə daxil edin. Uzun müddətli sahiblik üçün Lexus ES daha əlverişli ola bilər."
  },
  {
    make: "BMW",
    model: "5 Series",
    yearFrom: 2017,
    ratings: { reliability: 7, comfort: 9, performance: 9, economy: 7, safety: 9 },
    ownerSatisfaction: 77,
    strengths: [
      "Premium kabin keyfiyyəti",
      "3 Series-dən daha rahat uzun yol sürüşü",
      "B58 mühərrikinin performansı (540i)",
      "Adaptiv süspansiyon (xDrive versiyası)"
    ],
    weaknesses: [
      "Texniki xidmət baha",
      "Xırda elektrik arızaları tez-tez görülür",
      "2017–2019 dizellərinin DPF (hissəcik filtri) problemi"
    ],
    commonProblems: [
      "Su nasosu/termostat arızaları (G30, eyni 3 Series ilə)",
      "ZF 8HP sürət qutusu elektrikli yağ nasosunun arızası",
      "Dizel versiyasında DPF tıxanması (qısa məsafə sürücülüğü)",
      "Arxa kamera görüntüsünün donması"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "TÜV Report 2023 · Which? Owner Survey 2023",
    verdict: "Uzun yol rahatlığı və performansı birləşdirən premium seçim. Yüksək qulluq xərclərini qəbul edənlər üçün idealdir."
  },
  {
    make: "BMW",
    model: "X5",
    yearFrom: 2019,
    ratings: { reliability: 7, comfort: 9, performance: 9, economy: 6, safety: 9 },
    ownerSatisfaction: 76,
    strengths: [
      "Lüks kabin — materiallar seqmentin zirvəsindədir",
      "B58 xDrive45e PHEV variantı",
      "Yolsuzluqda xDrive-ın etibarlılığı",
      "NCAP 5 ulduz"
    ],
    weaknesses: [
      "Elektrik sistemlərinin mürəkkəbliyi — ətraflı xidmət tələb edir",
      "N63 V8 mühərrikdə yağ sərfi (40i buna aid deyil)",
      "Hava asqısı (active air suspension) təmiri baha"
    ],
    commonProblems: [
      "N63TU2 V8: yağ sərfi şikayətləri (50 000+ km)",
      "Hava asqısı kompressorunun arızası",
      "İdrive yeniləmə zamanı multimedia donması",
      "Yanacaq pompasının zəifləməsi (G05, 2019–2021)"
    ],
    maintenanceCost: "çox yüksək",
    sourceNote: "TÜV Report 2023 · JD Power 2023 · Consumer Reports 2023",
    verdict: "Lüks SUV seqmentinin lideriyyətiini qoruyur. Ancaq yüksək qulluq xərclərini nəzərə alın — xüsusilə V8 modelləri üçün."
  },
  {
    make: "BMW",
    model: "X3",
    yearFrom: 2018,
    ratings: { reliability: 7, comfort: 8, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 78,
    strengths: [
      "Kompakt lüks SUV-ların ən dinamiği",
      "B48/B58 mühərrik ailəsinin möhkəmliyi",
      "Yaxşı dəyər saxlama (xüsusilə 30i)"
    ],
    weaknesses: [
      "Elektrik sistemlərinin mürəkkəbliyi",
      "Texniki xidmət xərci orta seqmentdən yüksəkdir",
      "Kabin genişliyi rəqib Q5 ilə müqayisədə daha məhduddur"
    ],
    commonProblems: [
      "Su nasosu/termostat (eyni B-seriya mühərriki problemi)",
      "Transfer qutusunun yağ sızıntısı (xDrive)",
      "Arxa bavul qapısının elettrik motorunun yavaşlaması"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "TÜV Report 2023 · JD Power 2023",
    verdict: "Lüks kompakt SUV arasında dinamikası ilə fərqlənir. Bütçe doğrusu üçün xidmət xərclərini müqayisə edin."
  },

  // ── Mercedes-Benz ────────────────────────────────────────────────────────
  {
    make: "Mercedes-Benz",
    model: "C-Class",
    yearFrom: 2015,
    yearTo: 2021,
    ratings: { reliability: 6, comfort: 9, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 72,
    strengths: [
      "Kabin keyfiyyəti, materiallar premium hiss verir",
      "Sürüş rahatı seqmentin ən yaxşılarından",
      "Güclü marka statusu"
    ],
    weaknesses: [
      "W205 etibarlılığı TÜV sıralamalarında orta-altda qalır",
      "7G-Tronic avtomatik ötürücünün problemləri",
      "Elektrik sisteminin mürəkkəbliyi: xırda arızalar tez-tez görülür",
      "Qulluq xərcləri BMW 3 Series ilə oxşar, bəzən daha yüksək"
    ],
    commonProblems: [
      "7G-Tronic sürət qutusunun valf blokunun arızası",
      "OM651 2.2 dizel mühərrikdə balans mili problemi (RECALL)",
      "M274 benzin mühərrikdə zəncir uzanması (nadir)",
      "AIRMATIC hava asqısı kompressorunun arızası",
      "Kənar güzgü motor yavaşlaması"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "TÜV Report 2022 · ADAC Pannenstatistik 2022 · Consumer Reports",
    verdict: "Lüks rahatlıq üçün cəlbedici, lakin etibarlılıq statistikası Toyota/Lexus ilə müqayisədə aşağıdır. Tam servis tarixçəsi olan nüsxə seçin."
  },
  {
    make: "Mercedes-Benz",
    model: "E-Class",
    yearFrom: 2016,
    ratings: { reliability: 7, comfort: 9, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 75,
    strengths: [
      "Uzun yol rahatlığı sedan seqmentinin ən yaxşısi",
      "Geniş kabin, arxa sərnişinlər üçün rahatdır",
      "MBUX multimedia sisteminin intuitiv interfeysi (2019+)",
      "Magic Body Control süspansiyonu (opsional)"
    ],
    weaknesses: [
      "Texniki xidmət baha",
      "W213 erken modellərdə elektrik sistemi problemləri",
      "AIRMATIC arızası yüksək yürüşlü avtomobillərdə tez-tez"
    ],
    commonProblems: [
      "AIRMATIC hava asqısı kompressor arızası (150 000+ km)",
      "9G-Tronic ötürücüsündə nadir transfer xətası",
      "64-rəngli ambient işıqlandırmanın çökməsi",
      "Camera/sensor kalibrasiyasının yenilənmə tələbi"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "TÜV Report 2023 · ADAC 2023",
    verdict: "Uzun yol rahatı ilə ödülündürür. Xidmət tarixçəsini mütləq yoxlayın — AIRMATIC ilə avadanlıqlı versiyalar əlavə diqqət tələb edir."
  },

  // ── Volkswagen ───────────────────────────────────────────────────────────
  {
    make: "Volkswagen",
    model: "Passat",
    yearFrom: 2015,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 74,
    strengths: [
      "Avropa üçün hazırlanmış yol rahatlığı",
      "DSG/S-Tronic ötürücünün effektivliyi (quru DSG)",
      "Geniş kabin, universal versiyasının praktikliyi"
    ],
    weaknesses: [
      "DSG 7-sürətli (DQ200) şəhər trafikindəki titrəmə",
      "2.0 TDI (EA288) dizel EGR tıxanması",
      "Yüksək yürüşdə DSG ötürücüsünün mexatronic bloku"
    ],
    commonProblems: [
      "7-sürətli DSG (DQ200) mexatronic nasazlığı",
      "2.0 TDI EGR ventilinin tıxanması",
      "AdBlue (SCR) sisteminin arızası (dizel versiya)",
      "Elektrik güc direksiyonunun titrəməsi"
    ],
    maintenanceCost: "orta",
    sourceNote: "TÜV Report 2023 · ADAC Pannenstatistik 2023",
    verdict: "Avropa rahatlığını ağlabatan qiymətə təklif edir. DSG problemlərindən xəbərdar olun; 6-sürətli DSG (DQ250) daha etibarlıdır."
  },
  {
    make: "Volkswagen",
    model: "Tiguan",
    yearFrom: 2016,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 75,
    strengths: [
      "Kompakt SUV seqmentinin ən yüksək reytinqli Avropa modeli",
      "Geniş bagaj (yeddi oturacaqlı Allspace versiyası)",
      "Mükəmməl bitişlik keyfiyyəti"
    ],
    weaknesses: [
      "1.4 TSI mühərrikdə yağ sərfi",
      "DSG 7 (DQ200) titrəmə problemi",
      "Ehtiyat hissəsi dəyəri Hyundai/Kia-dan yüksəkdir"
    ],
    commonProblems: [
      "1.4 TSI EA211: istehsalın ilk illərində yağ sərfi",
      "DSG 7-nin mexatronic arızası",
      "Sensor arızası ilə bağlı 4MOTION xarici sürücüsünün nasazlığı"
    ],
    maintenanceCost: "orta",
    sourceNote: "TÜV Report 2023 · Euro NCAP 2016 · ADAC 2023",
    verdict: "Avropa dizayn keyfiyyəti ilə güclü seçim. DSG 7 versiyası əvəzinə 6-sürətli DSG axtarın."
  },

  // ── Honda ─────────────────────────────────────────────────────────────────
  {
    make: "Honda",
    model: "Accord",
    yearFrom: 2018,
    ratings: { reliability: 8, comfort: 8, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 83,
    strengths: [
      "1.5T və 2.0T mühərriklərin sürüş xüsusiyyətləri",
      "Kabin genişliyi seqmentinin ən yaxşıları arasında",
      "NCAP 5 ulduz",
      "Sürüş dinamikası Camry-dən daha həvəsləndiricidir"
    ],
    weaknesses: [
      "1.5T mühərrikdə soyuq iqlimdə yağa yanacaq qarışması (soyuq ölkələr üçün aktual)",
      "CVT ötürücü sürüşkənliyi bəzi sürücülərdə narahatlıq yaradır",
      "Texniki xidmət şəbəkəsi Azərbaycanda məhduddur"
    ],
    commonProblems: [
      "1.5T (L15B7): soyuq startda yağ-yanacaq dilüsiyası (soyuq iqlim problemi)",
      "CVT ötürücüdə yüksək sürətdə titrəmə",
      "Honda Sensing kalibrasyonu sıfırlandıqdan sonra yenidən düzəltmə"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2024 · NHTSA 2023 · JD Power 2023",
    verdict: "Dinamik sürüşü ilə Camry-yə güclü alternativ. 2.0T versiyasını seçin; 1.5T-nin yağ dilüsiyası Azərbaycan iqlimində az problematikdir."
  },
  {
    make: "Honda",
    model: "CR-V",
    yearFrom: 2017,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 79,
    strengths: [
      "Yük tutumu seqmentin ən yüksəklərindən",
      "Kabin keyfiyyəti yaxşı bitişliklidir",
      "Hibrid versiyası yanacaq sərfiyyatında üstünlük verir"
    ],
    weaknesses: [
      "1.5T mühərrikdə yağ-yanacaq dilüsiyası problemi (soyuq iqlim)",
      "Sürüş dinamikası RAV4-dən passivdir",
      "İkinci əl dəyəri Toyota RAV4-dən sürətli düşür"
    ],
    commonProblems: [
      "1.5T (L15B7): yağ-yanacaq qarışması (soyuq iqlimdə aktual)",
      "Klima kompressor sızıntısı (5-ci nəsil, 2017–2021)",
      "CarPlay bağlantısının kəsilməsi"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2023 · NHTSA 2022 · JD Power 2023",
    verdict: "Yüklü ailə SUV-u üçün yaxşı seçim. Hibrid versiyası uzunmüddətli xərcləri azaldır."
  },

  // ── Nissan ────────────────────────────────────────────────────────────────
  {
    make: "Nissan",
    model: "Qashqai",
    yearFrom: 2014,
    yearTo: 2021,
    ratings: { reliability: 6, comfort: 7, performance: 6, economy: 7, safety: 7 },
    ownerSatisfaction: 67,
    strengths: [
      "Kompakt ölçü şəhər şəraitinə uyğundur",
      "Yaxşı sürücü görüşü",
      "Münasib qiymət"
    ],
    weaknesses: [
      "CVT ötürücüsünün erken köhnəlməsi Nissan-ın ən böyük problem nöqtəsidir",
      "Mühərrik krank mövqe sensorunun arızası (HR16DE/MR20DE)",
      "TÜV sıralamalarında kompakt SUV-lar arasında alt yarısında qalır"
    ],
    commonProblems: [
      "CVT ötürücüsünün aşınması (100 000 km sonra tez-tez)",
      "Krank mövqe sensoru arızası (motor sönür)",
      "EGR ventili tıxanması (dizel versiya)",
      "Alternatorun gərginlik nizamlanması"
    ],
    maintenanceCost: "orta",
    sourceNote: "TÜV Report 2022 · ADAC 2022 · Which? 2022",
    verdict: "CVT ötürücüsünün vəziyyətini mütləq yoxlayın. Rəqib RAV4 və Tucson bu nəsil üçün daha etibarlıdır."
  },
  {
    make: "Nissan",
    model: "Qashqai",
    yearFrom: 2022,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 77,
    strengths: [
      "e-Power hibrid sisteminin yanacaq sərfiyyatı",
      "Tamamilə yenilənmiş kabin dizaynı",
      "NCAP 5 ulduz (2021)"
    ],
    weaknesses: [
      "Digər brend CVT-lərdən hələ də az etibarlıdır",
      "e-Power sisteminin mürəkkəbliyi uzunmüddətli xərclər yarada bilər"
    ],
    commonProblems: [
      "e-Power inverter ilkin temperatur problemləri (nadir)",
      "ProPilot sistemi kalibrasiya tələbi"
    ],
    maintenanceCost: "orta",
    sourceNote: "Euro NCAP 2021 · Which? 2023",
    verdict: "Əvvəlki nəslə nisbətən ciddi yaxşılaşma. Hibrid texnologiyası yanacaq xərclərini kompensasiya edir."
  },
  {
    make: "Nissan",
    model: "X-Trail",
    yearFrom: 2014,
    yearTo: 2022,
    ratings: { reliability: 6, comfort: 7, performance: 6, economy: 7, safety: 7 },
    ownerSatisfaction: 68,
    strengths: [
      "Ailə üçün geniş kabin (7 yerli seçim)",
      "Praktik yük tutumu",
      "Münasib ikinci əl qiyməti"
    ],
    weaknesses: [
      "CVT ötürücüsünün etibarlılığı Qashqai ilə eyni problemi daşıyır",
      "Sürüş dinamikası passivdir",
      "Yüksək yürüşlü nüsxələrdə CVT dəyişikliyi baha başa gəlir"
    ],
    commonProblems: [
      "CVT ötürücüsü köhnəlməsi",
      "MR20DD mühərrikdə yağ sərfi",
      "Elektrik pəncərə motorunun donması"
    ],
    maintenanceCost: "orta",
    sourceNote: "TÜV Report 2022 · Consumer Reports",
    verdict: "Geniş kabini cazibədar etsə də CVT problemi uzunmüddətli sahiblikdə risk yaradır. Toyota RAV4 bu seqmentdə daha güclü seçimdir."
  },

  // ── Lexus ─────────────────────────────────────────────────────────────────
  {
    make: "Lexus",
    model: "ES",
    yearFrom: 2019,
    ratings: { reliability: 10, comfort: 9, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 93,
    strengths: [
      "Consumer Reports-un ən etibarlı otomobilləri arasında ilk sırada",
      "2.5L hibrid (300h): 5.5 L/100 km",
      "Uzun müddətli sahiblik xərclərinin minimallığı",
      "Premium kabin keyfiyyəti Toyota platformasında"
    ],
    weaknesses: [
      "Sürüş dinamikası BMW 3 Series ilə müqayisəyə gəlmir",
      "Mouse controller (touchpad) intuitiv deyil",
      "Sportiv sürücülük zövqü vermir"
    ],
    commonProblems: [
      "Praktik olaraq məlum ciddi problem yoxdur",
      "Multimedia touchpad-ın spesifik əməliyyatlarında gecikmə",
      "Uzaqdan başlatma opsiyasının Azərbaycan iqlimindəki tənzimlənməsi"
    ],
    maintenanceCost: "aşağı",
    sourceNote: "Consumer Reports 2024 (Top Rated) · JD Power VDS 2023 · TÜV 2023",
    verdict: "Uzunmüddətli ən aşağı toplam sahiblik xərci. Sürüş zövqündən çox etibarlılıq arayan alıcılar üçün birinci seçim."
  },
  {
    make: "Lexus",
    model: "RX",
    yearFrom: 2016,
    ratings: { reliability: 9, comfort: 9, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 90,
    strengths: [
      "Lüks SUV-lar arasında etibarlılıq lideri",
      "450h hibrid versiyasının yanacaq sərfiyyatı",
      "Kabin keyfiyyəti premium seqmentdə yüksək qiymətləndirilir"
    ],
    weaknesses: [
      "Sürüş dinamikası BMW X5 ilə rəqabət apara bilmir",
      "Touchpad multimedia sistemi intuitivliyi zəifdir",
      "Arxa görüş bucağı məhduddur"
    ],
    commonProblems: [
      "Multimedia yeniləmə zamanı donma (proqram problemi)",
      "Hibrid batareyanın nadir soyutma ventilyatoru arızası",
      "Ön körpünün 150 000+ km-də arxa yastığı"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2024 · JD Power VDS 2023",
    verdict: "Lüks SUV seqmentinin ən az narahatlıq verən modeli. BMW X5 dinamikasına ehtiyacı olmayanlar üçün ideal."
  },

  // ── Audi ─────────────────────────────────────────────────────────────────
  {
    make: "Audi",
    model: "A4",
    yearFrom: 2016,
    ratings: { reliability: 7, comfort: 8, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 76,
    strengths: [
      "Kabin keyfiyyəti seqmentinin ən yüksəklərindən",
      "Aydın, sadə dizayn",
      "Quattro AWD etibarlılığı",
      "Sürüş rahatı BMW 3-dən biraz daha sakit"
    ],
    weaknesses: [
      "1.4/2.0 TFSI mühərrikdə yağ sərfi",
      "S-Tronic (DSG) 7-sürətli ötürücünün titrəməsi",
      "Qulluq xərci BMW 3 Series ilə bərabərdir"
    ],
    commonProblems: [
      "2.0 TFSI (EA888): yağ sərfi, PCV ventilinin arızası",
      "DSG 7 (DL382) mexatronic arızası",
      "MMI multimedia sisteminin don/açılma problemi",
      "Audi Virtual Cockpit kalibrasiya xətası"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "TÜV Report 2023 · ADAC 2023 · Consumer Reports",
    verdict: "Premium interior keyfiyyəti ilə cəlbedici. Xidmət tarixçəsi tam olan nüsxəni seçin; qulluq xərclərini büdcəyə daxil edin."
  },
  {
    make: "Audi",
    model: "Q5",
    yearFrom: 2017,
    ratings: { reliability: 7, comfort: 9, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 77,
    strengths: [
      "Premium kompakt SUV-ların ən rahat kabini",
      "Quattro AWD sistemi dağlıq ərazilərdə üstünlük verir",
      "Virtual Cockpit rəqəmsal panel"
    ],
    weaknesses: [
      "2.0 TFSI yağ sərfi",
      "S-Tronic arızaları",
      "Lüks daxili avadanlıq baha başa gəlir"
    ],
    commonProblems: [
      "2.0 TFSI (EA888 Gen 3): yağ sərfi şikayətləri",
      "DSG/S-Tronic sensorunun kalibrasiyası",
      "Hava süzgəcinin əvvəlcədən tıxanması (dizel, şəhər)"
    ],
    maintenanceCost: "yüksək",
    sourceNote: "TÜV Report 2023 · JD Power 2023",
    verdict: "Premium kompakt SUV üçün möhkəm seçim. X3 ilə tam rəqabətdədir; qulluq xərclərinin istifadəçiyə yükü bənzərdir."
  },

  // ── Mazda ─────────────────────────────────────────────────────────────────
  {
    make: "Mazda",
    model: "CX-5",
    yearFrom: 2017,
    ratings: { reliability: 9, comfort: 8, performance: 7, economy: 7, safety: 9 },
    ownerSatisfaction: 86,
    strengths: [
      "Kompakt SUV-lər arasında etibarlılıq liderindən biri",
      "Sürüş dinamikası seqmentinin ən ehtiraslısı",
      "Kabin materialları qiymətinə görə çox yüksəkdir",
      "NCAP 5 ulduz"
    ],
    weaknesses: [
      "Texniki xidmət şəbəkəsi Azərbaycanda məhduddur",
      "İkinci əl bazar payı Hyundai/Kia-dan azdır",
      "Android Auto dəstəyi gec əlavə edildi"
    ],
    commonProblems: [
      "SKYACTIV-G 2.5 mühərrikdə nadir yağ sərfi (yüksək mileaj)",
      "İnfotainment sistemi CarPlay bağlantısı kəsilməsi",
      "Arxa kamera linzasının tozlanması"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2024 · JD Power 2023 · TÜV 2023",
    verdict: "Gizli drahma — etibarlılıqda Toyota-ya yaxın, sürüşdə isə ondan daha zövqlüdür. Azərbaycanda şəbəkə məsələsini araşdırın."
  },
  {
    make: "Mazda",
    model: "Mazda6",
    yearFrom: 2015,
    ratings: { reliability: 8, comfort: 8, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 82,
    strengths: [
      "Sedan seqmentinin ən gözəl dizaynlarından biri",
      "SKYACTIV mühərriklərinin etibarlılığı",
      "Sürüş həvəsləndiriciliyi"
    ],
    weaknesses: [
      "Texniki xidmət şəbəkəsi məhduddur",
      "İkinci əl dəyəri Camry ilə müqayisədə daha sürətli düşür",
      "2020-ci ildən istehsal dayandırılıb (Mazda6)"
    ],
    commonProblems: [
      "SKYACTIV-G 2.5: nadir mühərrik halqası aşınması",
      "Multimedia sisteminin donması (yeniləmə ilə düzəlir)",
      "Ön amortisör üst dayağının aşınması (yüksək yürüşdə)"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2023 · TÜV 2022",
    verdict: "Gözəl dizayn və sürüş zövqü ilə seçkin, lakin istehsalın dayandırılması uzunmüddətli ehtiyat hissəsi riskini artırır."
  },

  // ── Chevrolet ─────────────────────────────────────────────────────────────
  {
    make: "Chevrolet",
    model: "Malibu",
    yearFrom: 2016,
    ratings: { reliability: 5, comfort: 7, performance: 6, economy: 7, safety: 8 },
    ownerSatisfaction: 62,
    strengths: [
      "Münasib qiymətə geniş kabin",
      "1.5T mühərrikinin sürüş mülayimliyi",
      "Amerika bazarında texniki xidmət şəbəkəsi geniş"
    ],
    weaknesses: [
      "Consumer Reports etibarlılıq reytinqində alt yarısında dayanır",
      "CVT ötürücüsündə şikayətlər geniş yayılmışdır",
      "Kondisioner kompressor arızası sıklığı",
      "Sürüş dinamikası Camry/Accord-dan geri qalır"
    ],
    commonProblems: [
      "CVT ötürücüsünün köhnəlməsi (80 000–100 000 km)",
      "Hava kondisioner kompressor arızası",
      "Elektrik direksiyonunun titrəməsi",
      "Infotainment ekranının parıltı problemi"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2022 · JD Power 2022 · NHTSA",
    verdict: "Büdcə dostu qiymət, lakin uzunmüddətli etibarlılıq Camry/Accord-dan aşağıdır. CVT vəziyyətini mütləq yoxlayın."
  },
  {
    make: "Chevrolet",
    model: "Equinox",
    yearFrom: 2018,
    ratings: { reliability: 6, comfort: 7, performance: 6, economy: 7, safety: 8 },
    ownerSatisfaction: 65,
    strengths: [
      "Rahat yüklü kabin",
      "Yaxşı şəhər manevri",
      "ConnectivityPlus xidmətləri (ABŞ bazarı)"
    ],
    weaknesses: [
      "1.5T mühərriki etibarlılıq cəhətdən orta-altdadır",
      "CVT problemi bu nəsil üçün aktual",
      "Ehtiyat hissəsi Azərbaycanda məhduddur"
    ],
    commonProblems: [
      "1.5T LYX: buzlanmada mühərrik açılmaması (soyuq iqlim RECALL)",
      "CVT ötürücüsü titrəməsi",
      "Ön fənər qaldırıcı motorunun arızası"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2022 · JD Power 2022 · NHTSA",
    verdict: "CVT problemi risk faktorudur. Honda CR-V və Toyota RAV4 bu seqmentdə daha etibarlı alternativlərdir."
  },

  // ── Subaru ────────────────────────────────────────────────────────────────
  {
    make: "Subaru",
    model: "Outback",
    yearFrom: 2015,
    ratings: { reliability: 7, comfort: 7, performance: 6, economy: 7, safety: 9 },
    ownerSatisfaction: 80,
    strengths: [
      "AWD sistemi Subaru-nun ən güclü cəhəti",
      "Universalın yük tutumu",
      "NCAP 5 ulduz (İnsight versiyası)"
    ],
    weaknesses: [
      "EJ25/FA25 boksör mühərrikdə baş keçəni (head gasket) arızası riski",
      "CVT Lineartronic-in qısa ömürlülüyü",
      "Qulluq şəbəkəsinin məhdudluğu Azərbaycanda"
    ],
    commonProblems: [
      "EJ25: silindr blokunun baş keçəninin arızası (köhnə modellər)",
      "CVT Lineartronic-in 120 000 km-dən sonra aşınması",
      "Körpü yastığının erken köhnəlməsi"
    ],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2023 · TÜV 2022",
    verdict: "Dağlıq ərazilər üçün AWD sistemi yaxşı seçimdir, lakin boksör mühərrik serinləşdiricisini düzgün texniki qulluq tələb edir."
  },

  // ── Toyota Hibrid / PHEV / BEV genişlənmə ─────────────────────────────────
  {
    make: "Toyota", model: "RAV4 Hybrid", yearFrom: 2019,
    ratings: { reliability: 8, comfort: 8, performance: 8, economy: 9, safety: 9 },
    ownerSatisfaction: 89,
    powertrain: {
      category: "HEV", systemPowerHp: 222, engineCc: 2487,
      fuelConsumption: { city: 5.1, highway: 6.2, combined: 5.6, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["Şəhərdə 5.5 L/100km-ə düşür", "AWD-E sistemi güvənli", "222 hp güclü tam hibrid", "NCAP 5 ulduz"],
    weaknesses: ["İlkin qiymət benzin versiyadan 4-5K yüksək", "Baqaj minimal azalır (batareya)"],
    commonProblems: ["Arxa diferensial mühərrik arızası (nadir, zəmanət altında)", "Klima kompressor səsi"],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2024 · Euro NCAP 2021 · J.D. Power 2023",
    verdict: "RAV4 Hybrid ailə SUV seqmentinin ən ağıllı seçimi. Uzunmüddətli yanacaq qənaəti ilk qiymət fərqini 2-3 ildə geri qaytarır."
  },
  {
    make: "Toyota", model: "RAV4 Prime", yearFrom: 2020,
    ratings: { reliability: 8, comfort: 8, performance: 9, economy: 9, safety: 9 },
    ownerSatisfaction: 90,
    powertrain: {
      category: "PHEV", systemPowerHp: 302, engineCc: 2487,
      fuelConsumption: { city: 1.8, highway: 2.5, combined: 2.2, unit: "L/100km", testCycle: "WLTP",
        evOnlyCombined: 17.5, evUnit: "kWh/100km" },
      charging: { batteryKwh: 18.1, acChargeKw: 3.3, electricRangeKm: 75, connectorType: "Type1" }
    },
    strengths: ["75 km elektrik diapazonu — şəhər sürüşü yanacaqsız", "302 hp sistem gücü", "AWD-e sistem standart"],
    weaknesses: ["Azərbaycanda şarj infrastrukturu hələ məhdud", "Yüksək ilkin qiymət", "Şarj edilməzsə sərfiyyat artır"],
    commonProblems: ["Batareya termik idarəetmə — çox soyuq havada diapazonu azalır", "AC şarj sürəti yavaş (3.3 kW)"],
    maintenanceCost: "orta",
    sourceNote: "EPA 2024 · Consumer Reports 2024 · Toyota Global",
    verdict: "Evdə şarj imkanı olanlar üçün ideal: 302 hp güc + gündəlik yanacaqsız sürüş + uzun yolda həssaslıq yoxdur."
  },
  {
    make: "Toyota", model: "Corolla Hybrid", yearFrom: 2019,
    ratings: { reliability: 9, comfort: 7, performance: 6, economy: 9, safety: 9 },
    ownerSatisfaction: 85,
    powertrain: {
      category: "HEV", systemPowerHp: 122, engineCc: 1798,
      fuelConsumption: { city: 4.2, highway: 5.0, combined: 4.5, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["4.5 L/100km ortalama", "Toyota hibrid etibarlılıq irsini daşıyır", "Şəhərdə sakit elektrik sürüşü"],
    weaknesses: ["CVT kimi hiss olunur — dinamika aşağı", "Arxa oturacaq sıxdır"],
    commonProblems: ["Ön sürtüklər 80k km-dən sonra aşınma", "Klima kondenser sızıntısı (2019)"],
    maintenanceCost: "aşağı",
    sourceNote: "Consumer Reports 2024 · TÜV 2023",
    verdict: "Ən aşağı işlətmə xərclərindən biri. Sürüş zövqü olmasa da, yanacaq hesabınıza ciddi qənaət edir."
  },
  {
    make: "Toyota", model: "Highlander Hybrid", yearFrom: 2020,
    ratings: { reliability: 8, comfort: 9, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 87,
    powertrain: {
      category: "HEV", systemPowerHp: 243, engineCc: 2494,
      fuelConsumption: { city: 7.1, highway: 7.8, combined: 7.4, unit: "L/100km", testCycle: "EPA" }
    },
    strengths: ["7 nəfərlik salon", "Ailə üçün geniş iç məkan", "AWD hibrid sistem"],
    weaknesses: ["SUV ölçüsü şəhərdə çətin", "Yüksək qiymət"],
    commonProblems: ["Arxa klima boru sıxıntısı", "Üçüncü sıra oturacağın məhdud rahatlığı"],
    maintenanceCost: "orta",
    sourceNote: "EPA 2024 · J.D. Power 2023",
    verdict: "Böyük ailə üçün ən etibarlı hibrid SUV seçimlərindən. Yanacaq qənaəti ölçüsü nəzərə alındıqda yaxşıdır."
  },
  {
    make: "Toyota", model: "bZ4X", yearFrom: 2022,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 76,
    powertrain: {
      category: "BEV", systemPowerHp: 204,
      fuelConsumption: { combined: 17.5, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 71.4, fastChargeKw: 150, acChargeKw: 11, charge10to80Min: 30, electricRangeKm: 466, connectorType: "CCS" }
    },
    strengths: ["466 km WLTP diapazonu", "150 kW DC sürətli şarj", "Toyota zavodunun keyfiyyəti"],
    weaknesses: ["İlk buraxılışda təkər boltu xatırlatma kampaniyası", "Rəqibdən baha"],
    commonProblems: ["2022 ilk seriyanın təkər boltu problemi (bütün satınalmalar yoxlanılmalıdır)"],
    maintenanceCost: "aşağı",
    sourceNote: "Euro NCAP 2022 · ADAC Test 2023",
    verdict: "Toyota-nın ilk həqiqi BEV-i. Etibarlılıq zamanla sübut olunacaq; hal-hazırda bir neçə ilkin problem var."
  },

  // ── Hyundai genişlənmə ─────────────────────────────────────────────────────
  {
    make: "Hyundai", model: "Ioniq 5", yearFrom: 2021,
    ratings: { reliability: 7, comfort: 9, performance: 8, economy: 8, safety: 9 },
    ownerSatisfaction: 85,
    powertrain: {
      category: "BEV", systemPowerHp: 217,
      fuelConsumption: { combined: 16.7, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 72.6, fastChargeKw: 220, acChargeKw: 11, charge10to80Min: 18, electricRangeKm: 481, connectorType: "CCS" }
    },
    strengths: ["800V şarj sistemi — 18 dəqiqədə 10→80%", "Geniş kabin (uzun ox arası)", "V2L funksiyası", "NCAP 5 ulduz"],
    weaknesses: ["Soyuq havada diapazonu 30% azalır", "Yüksək qiymət"],
    commonProblems: ["OTA proqram yeniləməsindən sonra bəzi funksiyalar reset", "Ön süspansiyon titrəmə (2021 ilk seriya)"],
    maintenanceCost: "aşağı",
    sourceNote: "Euro NCAP 2021 · ADAC 2023 · What Car? 2023",
    verdict: "800V ultra sürətli şarj texnologiyası ilə EV sənayesini öndən aparır. Uzun məsafə şarj narahatlığını aradan qaldıran ən yaxşı seçimlərdən."
  },
  {
    make: "Hyundai", model: "Ioniq 6", yearFrom: 2022,
    ratings: { reliability: 7, comfort: 9, performance: 9, economy: 9, safety: 9 },
    ownerSatisfaction: 87,
    powertrain: {
      category: "BEV", systemPowerHp: 320,
      fuelConsumption: { combined: 14.3, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 77.4, fastChargeKw: 220, acChargeKw: 11, charge10to80Min: 18, electricRangeKm: 614, connectorType: "CCS" }
    },
    strengths: ["614 km WLTP diapazonu — sektördə ən uzun", "Cd 0.21 aerodinamika", "18 dəqiqədə 10→80%"],
    weaknesses: ["Sedan forması baqajı məhdudlaşdırır", "Arxa başlıq yeri az"],
    commonProblems: ["Şarj portu qapısı donması (soyuq iqlim)", "Navigasiya ekranı yükləmə gecikmə"],
    maintenanceCost: "aşağı",
    sourceNote: "Euro NCAP 2023 · ADAC 2023 · EPA 2023",
    verdict: "614 km diapazonu ilə elektrik sedanların lideri. Uzun yol əsasən şarj dayanacağı olmadan mümkündür."
  },
  {
    make: "Hyundai", model: "Tucson Hybrid", yearFrom: 2021,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 83,
    powertrain: {
      category: "HEV", systemPowerHp: 230, engineCc: 1598,
      fuelConsumption: { city: 5.6, highway: 6.4, combined: 5.9, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["6 L/100km-in altında kombinədir sərfiyyat", "Müasir dizayn", "HTRAC AWD sistem"],
    weaknesses: ["DCT sürət qutusunda 2021–2022 arıza hesabatları", "Proqram yeniləmələri çox tez-tez gəlir"],
    commonProblems: ["DCT titrəmə 40-60 km/s aralığında (proqram yeniləməsi mövcuddur)", "Şüşə silindiri sızıntısı"],
    maintenanceCost: "orta",
    sourceNote: "J.D. Power IQS 2023 · Euro NCAP 2021",
    verdict: "Rəqabətli hibrid SUV. DCT problemlərini zəmanət çərçivəsində həll edin; uzunmüddətli etibarlılıq hələ tam sübut olunmur."
  },
  {
    make: "Hyundai", model: "Tucson PHEV", yearFrom: 2021,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 9, safety: 9 },
    ownerSatisfaction: 81,
    powertrain: {
      category: "PHEV", systemPowerHp: 261, engineCc: 1598,
      fuelConsumption: { city: 1.4, highway: 2.1, combined: 1.7, unit: "L/100km", testCycle: "WLTP",
        evOnlyCombined: 17.0, evUnit: "kWh/100km" },
      charging: { batteryKwh: 13.8, acChargeKw: 7.2, electricRangeKm: 62, connectorType: "Type2" }
    },
    strengths: ["62 km elektrik diapazonu", "7.2 kW sürətli AC şarj", "HTRAC AWD standart"],
    weaknesses: ["Şarj edilməzsə sərfiyyat artır", "Baqaj azalır (batareya)"],
    commonProblems: ["Şarj konnektoru donması (soyuq hava)", "DCT sürət qutusu problemi"],
    maintenanceCost: "orta",
    sourceNote: "WLTP Data 2023 · Euro NCAP 2021",
    verdict: "62 km EV diapazonu ilə gündəlik şəhər sürüşündə yanacaq lazım olmayan praktik seçim."
  },
  {
    make: "Hyundai", model: "Santa Fe Hybrid", yearFrom: 2021,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 82,
    powertrain: {
      category: "HEV", systemPowerHp: 230, engineCc: 1598,
      fuelConsumption: { city: 6.0, highway: 6.8, combined: 6.3, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["7 nəfərlik salon (bəzi versiyalar)", "AWD hibrid sistem", "Böyük baqaj"],
    weaknesses: ["Dinamika orta", "Yüksək qiymət"],
    commonProblems: ["HTRAC AWD debriyaj sürüşmə (nadir)", "Arxa kamera donması"],
    maintenanceCost: "orta",
    sourceNote: "J.D. Power 2023 · Consumer Reports 2024",
    verdict: "Böyük ailə üçün yaxşı hibrid SUV. Toyota Highlander Hybrid ilə birbaşa rəqibdir."
  },

  // ── Kia genişlənmə ─────────────────────────────────────────────────────────
  {
    make: "Kia", model: "EV6", yearFrom: 2021,
    ratings: { reliability: 7, comfort: 9, performance: 9, economy: 8, safety: 9 },
    ownerSatisfaction: 86,
    powertrain: {
      category: "BEV", systemPowerHp: 325,
      fuelConsumption: { combined: 15.7, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 77.4, fastChargeKw: 240, acChargeKw: 11, charge10to80Min: 18, electricRangeKm: 528, connectorType: "CCS" }
    },
    strengths: ["240 kW peak şarj gücü", "528 km WLTP diapazonu", "AWD GT seçimi 585 hp", "V2L funksiyası"],
    weaknesses: ["Nazik arxa oturaq yastığı", "Yüksək qiymət aralığı"],
    commonProblems: ["Şarj portu donma (soyuq iqlim)", "Ekran boş ekrana düşmə (OTA ilə həll edilir)"],
    maintenanceCost: "aşağı",
    sourceNote: "Euro NCAP 2022 · ADAC 2023 · Car of the Year 2022",
    verdict: "2022-ci il 'İlin Avtomobili' seçilmiş EV6, Ioniq 5 ilə eyni platformada qurulub, lakin daha sportif dizaynla gəlir."
  },
  {
    make: "Kia", model: "Sportage PHEV", yearFrom: 2022,
    ratings: { reliability: 7, comfort: 8, performance: 8, economy: 9, safety: 9 },
    ownerSatisfaction: 82,
    powertrain: {
      category: "PHEV", systemPowerHp: 265, engineCc: 1598,
      fuelConsumption: { city: 1.3, highway: 2.0, combined: 1.6, unit: "L/100km", testCycle: "WLTP",
        evOnlyCombined: 17.3, evUnit: "kWh/100km" },
      charging: { batteryKwh: 13.8, acChargeKw: 7.2, electricRangeKm: 70, connectorType: "Type2" }
    },
    strengths: ["70 km elektrik diapazonu", "Müasir kabin dizaynı", "HTRAC AWD standart"],
    weaknesses: ["Şarj olmadan sərfiyyat artır", "Bəzi proqram problemləri"],
    commonProblems: ["Brembo sürtükləri erken aşınma", "Proqram yeniləmə arıza qeydləri"],
    maintenanceCost: "orta",
    sourceNote: "Euro NCAP 2022 · WLTP Data",
    verdict: "70 km EV diapazonu ilə Sportage PHEV gündəlik şəhər sürüşündə yanacaq xərclərini minimuma endirir."
  },
  {
    make: "Kia", model: "Niro Hybrid", yearFrom: 2017,
    ratings: { reliability: 8, comfort: 7, performance: 6, economy: 9, safety: 8 },
    ownerSatisfaction: 82,
    powertrain: {
      category: "HEV", systemPowerHp: 141, engineCc: 1580,
      fuelConsumption: { city: 4.4, highway: 5.2, combined: 4.7, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["4.7 L/100km — sərfiyyatda Prius-a rəqib", "Crossover formatında gündəlik rahatlıq"],
    weaknesses: ["Dinamika zəif", "Kabin materialları premium deyil"],
    commonProblems: ["DCT titrəmə (ilk nəsil)", "Batareya soyuducusu arızası (nadir)"],
    maintenanceCost: "aşağı",
    sourceNote: "Consumer Reports 2024 · TÜV 2022",
    verdict: "Hibrid yanacaq qənaətini crossover pratikliyilə birləşdirən ağıllı seçim."
  },

  // ── Mitsubishi ─────────────────────────────────────────────────────────────
  {
    make: "Mitsubishi", model: "Outlander PHEV", yearFrom: 2014,
    ratings: { reliability: 7, comfort: 7, performance: 7, economy: 8, safety: 8 },
    ownerSatisfaction: 80,
    powertrain: {
      category: "PHEV", systemPowerHp: 221, engineCc: 2360,
      fuelConsumption: { city: 1.9, highway: 2.8, combined: 2.4, unit: "L/100km", testCycle: "WLTP",
        evOnlyCombined: 20.0, evUnit: "kWh/100km" },
      charging: { batteryKwh: 13.8, acChargeKw: 3.7, fastChargeKw: 50, electricRangeKm: 57, connectorType: "CHAdeMO" }
    },
    strengths: ["4WD PHEV — offroad imkanı", "İki elektrik motoru (ön + arxa)", "50 kW DC sürətli şarj"],
    weaknesses: ["2014–2018 modellər köhnəlib, batareya tutumu azalıb", "CHAdeMO konnektoru populyarlığını itirir"],
    commonProblems: ["Batareya tutumunun azalması (ilk nəsil, 8+ il)", "EV diapazonu real həyatda 35-40 km-ə düşür"],
    maintenanceCost: "orta",
    sourceNote: "TÜV Report 2022 · Mitsubishi Official",
    verdict: "2014–2019 modellər köhnəlmiş PHEV texnologiyası daşıyır. 2020+ yeni nəsil seçin; batareya vəziyyətini mütləq yoxlayın."
  },

  // ── Tesla ─────────────────────────────────────────────────────────────────
  {
    make: "Tesla", model: "Model 3", yearFrom: 2017,
    ratings: { reliability: 6, comfort: 8, performance: 10, economy: 9, safety: 10 },
    ownerSatisfaction: 86,
    powertrain: {
      category: "BEV", systemPowerHp: 283,
      fuelConsumption: { combined: 13.5, unit: "kWh/100km", testCycle: "EPA" },
      charging: { batteryKwh: 57.5, fastChargeKw: 250, acChargeKw: 11, charge10to80Min: 25, electricRangeKm: 491, connectorType: "Tesla-NACS" }
    },
    strengths: ["250 kW Supercharger şəbəkəsi", "Sektörün ən yüksək NHTSA təhlükəsizlik balı", "Sürətli OTA proqram yeniləmələri"],
    weaknesses: ["Panel aralıqları (panel gaps)", "Tesla servis şəbəkəsi məhdud", "Yağış/rütubətdə bəzi elektrik sistemlər"],
    commonProblems: ["Panel aralıqları — nisbətən geniş tolerans", "Pəncərə möhürü sızıntısı", "Silgi mexanizmi arızası"],
    maintenanceCost: "aşağı",
    sourceNote: "NHTSA Safety 2023 · Consumer Reports 2024 · J.D. Power IQS 2023",
    verdict: "Sürət, texnologiya və diapazonda rəqibsiz. İstehsal keyfiyyəti hələ Alman və Yapon rəqiblərinə çatmır, lakin xidmət xərci çox aşağıdır."
  },
  {
    make: "Tesla", model: "Model Y", yearFrom: 2020,
    ratings: { reliability: 6, comfort: 8, performance: 9, economy: 9, safety: 10 },
    ownerSatisfaction: 84,
    powertrain: {
      category: "BEV", systemPowerHp: 299,
      fuelConsumption: { combined: 15.0, unit: "kWh/100km", testCycle: "EPA" },
      charging: { batteryKwh: 75, fastChargeKw: 250, acChargeKw: 11, charge10to80Min: 28, electricRangeKm: 533, connectorType: "Tesla-NACS" }
    },
    strengths: ["Dünyada ən çox satılan avtomobil (2023)", "533 km diapazonu", "Geniş baqaj", "Supercharger şəbəkəsi"],
    weaknesses: ["Panel boşluqları", "Mexaniki sürtük (bəzi AWD versiyalar)"],
    commonProblems: ["Arxa süspansiyon tıqqıltısı", "Şüşə möhürü sızıntısı", "Şarj portu donması"],
    maintenanceCost: "aşağı",
    sourceNote: "NHTSA 2023 · Consumer Reports 2024",
    verdict: "Dünyada ən populyar EV. Xidmət şəbəkəsini öncədən yoxlayın; istehsal keyfiyyəti model ilindən asılıdır."
  },
  {
    make: "Tesla", model: "Model S", yearFrom: 2016,
    ratings: { reliability: 6, comfort: 9, performance: 10, economy: 8, safety: 9 },
    ownerSatisfaction: 85,
    powertrain: {
      category: "BEV", systemPowerHp: 670,
      fuelConsumption: { combined: 17.8, unit: "kWh/100km", testCycle: "EPA" },
      charging: { batteryKwh: 100, fastChargeKw: 250, acChargeKw: 11, charge10to80Min: 30, electricRangeKm: 637, connectorType: "Tesla-NACS" }
    },
    strengths: ["637 km EPA diapazonu", "Plaid versiya 1020 hp", "Ultra lüks kabin"],
    weaknesses: ["Çox yüksək qiymət", "İstehsal keyfiyyəti Alman lüksdən geri"],
    commonProblems: ["Model 2021 öncəsi: MCU ekran arızası (zəmanət altında həll edilib)", "Hava asqısı arızası"],
    maintenanceCost: "orta",
    sourceNote: "EPA 2024 · NHTSA 2023",
    verdict: "EV lüks sedanının ilk etalonu. Qiyməti, diapazonu və performansı ilə hələ güclü rəqabət gücü var."
  },

  // ── BYD ───────────────────────────────────────────────────────────────────
  {
    make: "BYD", model: "Atto 3", yearFrom: 2022,
    ratings: { reliability: 6, comfort: 8, performance: 7, economy: 8, safety: 8 },
    ownerSatisfaction: 78,
    powertrain: {
      category: "BEV", systemPowerHp: 201,
      fuelConsumption: { combined: 15.4, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 60.5, fastChargeKw: 80, acChargeKw: 7, charge10to80Min: 45, electricRangeKm: 420, connectorType: "CCS" }
    },
    strengths: ["Blade batareya texnologiyası", "Münasib qiymət", "Xoş kabin materialları"],
    weaknesses: ["80 kW DC şarj sürəti rəqibdən aşağı", "Azərbaycanda servis az", "Uzunmüddətli etibarlılıq sübut olunmur"],
    commonProblems: ["Proqram interfeysi dondurma", "Arxa kamera gecikməsi"],
    maintenanceCost: "aşağı",
    sourceNote: "Euro NCAP 2022 · ADAC 2023",
    verdict: "Blade batareya ilə gəlişmiş istilik idarəetmə. Qiymət/diapazonu nisbətinə görə Avropa bazarında güclü rəqib."
  },
  {
    make: "BYD", model: "Han", yearFrom: 2020,
    ratings: { reliability: 6, comfort: 9, performance: 9, economy: 9, safety: 8 },
    ownerSatisfaction: 82,
    powertrain: {
      category: "BEV", systemPowerHp: 517,
      fuelConsumption: { combined: 14.9, unit: "kWh/100km" },
      charging: { batteryKwh: 85.4, fastChargeKw: 120, acChargeKw: 11, electricRangeKm: 550, connectorType: "CCS" }
    },
    strengths: ["517 hp AWD", "550 km diapazonu", "Lüks kabin", "Blade batareya"],
    weaknesses: ["Servis şəbəkəsi Azərbaycanda yeni", "Yüksək qiymət"],
    commonProblems: ["OTA yeniləmə sonrası xüsusiyyət dəyişiklikləri", "Panoram tavan rütubət"],
    maintenanceCost: "orta",
    sourceNote: "BYD Global · MIIT Çin",
    verdict: "Çin bazarının premium EV sedanı. Texnoloji göstəricilər güclüdür, lakin Azərbaycanda servis imkanları formalaşır."
  },
  {
    make: "BYD", model: "Seal", yearFrom: 2022,
    ratings: { reliability: 6, comfort: 8, performance: 9, economy: 9, safety: 8 },
    ownerSatisfaction: 80,
    powertrain: {
      category: "BEV", systemPowerHp: 523,
      fuelConsumption: { combined: 14.5, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 82.5, fastChargeKw: 150, acChargeKw: 11, charge10to80Min: 35, electricRangeKm: 570, connectorType: "CCS" }
    },
    strengths: ["570 km WLTP diapazonu", "523 hp AWD", "150 kW DC şarj", "Blade batareya"],
    weaknesses: ["Azərbaycanda yeni marka", "Servis şəbəkəsi limitli"],
    commonProblems: ["İlk nəsil proqram interfeys problemləri"],
    maintenanceCost: "aşağı",
    sourceNote: "Euro NCAP 2023 · WLTP Data",
    verdict: "Tesla Model 3-ün birbaşa Çin rəqibi. Diapazonu üstündür; servis şəbəkəsi hələ izlənilməlidir."
  },

  // ── Volkswagen EV / PHEV genişlənmə ───────────────────────────────────────
  {
    make: "Volkswagen", model: "ID.4", yearFrom: 2021,
    ratings: { reliability: 7, comfort: 8, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 79,
    powertrain: {
      category: "BEV", systemPowerHp: 204,
      fuelConsumption: { combined: 16.5, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 77, fastChargeKw: 135, acChargeKw: 11, charge10to80Min: 35, electricRangeKm: 521, connectorType: "CCS" }
    },
    strengths: ["Geniş kabin", "VW Alman keyfiyyəti", "521 km WLTP"],
    weaknesses: ["İlk proqram yeniləmə problemləri (2021)", "135 kW DC şarj — rəqibdən az"],
    commonProblems: ["Proqram donması (OTA ilə aradan qalxır)", "12V batareya boşalması"],
    maintenanceCost: "orta",
    sourceNote: "Euro NCAP 2021 · ADAC 2023",
    verdict: "VW-nin elektrik keçidinin bayraqdarı. Sabit, Alman etibarlılığı üçün yaxşı seçim."
  },
  {
    make: "Volkswagen", model: "Golf GTE", yearFrom: 2020,
    ratings: { reliability: 7, comfort: 8, performance: 8, economy: 9, safety: 8 },
    ownerSatisfaction: 80,
    powertrain: {
      category: "PHEV", systemPowerHp: 245, engineCc: 1395,
      fuelConsumption: { combined: 1.5, unit: "L/100km", testCycle: "WLTP", evOnlyCombined: 15.9, evUnit: "kWh/100km" },
      charging: { batteryKwh: 13, acChargeKw: 3.6, electricRangeKm: 70, connectorType: "Type2" }
    },
    strengths: ["70 km EV diapazonu", "245 hp sportif sürüş", "Golf praktikliyi"],
    weaknesses: ["Baqaj azalır", "3.6 kW AC şarj yavaş"],
    commonProblems: ["DSG titrəmə aşağı sürətdə", "Şarj sistemi səhv göstəricisi"],
    maintenanceCost: "orta",
    sourceNote: "WLTP Data 2023 · Auto Express 2023",
    verdict: "Golf-un PHEV versiyası — gündəlik EV, lazım gəldikdə sportif benzin."
  },

  // ── BMW EV / PHEV genişlənmə ───────────────────────────────────────────────
  {
    make: "BMW", model: "i4", yearFrom: 2021,
    ratings: { reliability: 7, comfort: 8, performance: 9, economy: 8, safety: 9 },
    ownerSatisfaction: 82,
    powertrain: {
      category: "BEV", systemPowerHp: 340,
      fuelConsumption: { combined: 15.5, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 83.9, fastChargeKw: 205, acChargeKw: 11, charge10to80Min: 31, electricRangeKm: 590, connectorType: "CCS" }
    },
    strengths: ["590 km WLTP diapazonu", "BMW sportif sürüş DNA-sı", "205 kW DC şarj"],
    weaknesses: ["Yüksək qiymət", "Şarj şəbəkəsi Tesla qədər geniş deyil"],
    commonProblems: ["İlk nəsil proqram yeniləmə problemləri", "Ön əsas yastıq sərtliyi şikayətləri"],
    maintenanceCost: "orta",
    sourceNote: "Euro NCAP 2022 · ADAC 2023",
    verdict: "BMW-nin EV sahəsindəki ən güclü cavabı. Sportif sürücülər üçün EV keçidini ən rahat edən modellərindən biri."
  },
  {
    make: "BMW", model: "X5 xDrive45e", yearFrom: 2019,
    ratings: { reliability: 7, comfort: 9, performance: 9, economy: 8, safety: 9 },
    ownerSatisfaction: 84,
    powertrain: {
      category: "PHEV", systemPowerHp: 394, engineCc: 2998,
      fuelConsumption: { combined: 2.1, unit: "L/100km", testCycle: "WLTP", evOnlyCombined: 22.5, evUnit: "kWh/100km" },
      charging: { batteryKwh: 24, acChargeKw: 7.4, electricRangeKm: 87, connectorType: "Type2" }
    },
    strengths: ["87 km EV diapazonu", "394 hp sistem gücü", "Lüks BMW kabin", "xDrive AWD standart"],
    weaknesses: ["Çox yüksək qiymət", "Servis xərci yüksək"],
    commonProblems: ["Batareya soyutma sistemi (uzun istifadədə)", "Proqram yeniləmə gecikmələri"],
    maintenanceCost: "yüksək",
    sourceNote: "Euro NCAP 2020 · BMW Global 2024",
    verdict: "Lüks, güclü PHEV SUV. 87 km EV diapazonu ilə gündəlik şəhər sürüşü yanacaqsız. Yüksək xidmət xərci nəzərə alınmalıdır."
  },

  // ── Mercedes EV / PHEV genişlənmə ─────────────────────────────────────────
  {
    make: "Mercedes-Benz", model: "EQS", yearFrom: 2021,
    ratings: { reliability: 6, comfort: 10, performance: 9, economy: 8, safety: 9 },
    ownerSatisfaction: 83,
    powertrain: {
      category: "BEV", systemPowerHp: 329,
      fuelConsumption: { combined: 15.7, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 107.8, fastChargeKw: 200, acChargeKw: 22, charge10to80Min: 31, electricRangeKm: 770, connectorType: "CCS" }
    },
    strengths: ["770 km WLTP diapazonu — tam elektrik sedanda rekord", "Hyperscreen daxili ekran sistemi", "Ultra lüks kabin"],
    weaknesses: ["Çox yüksək qiymət", "Böyük ölçü şəhərdə çətin", "İlk seriya MBUX proqram xətaları"],
    commonProblems: ["MBUX Hyperscreen donması (proqram yeniləməsi ilə aradan qalxır)", "Ön süspansiyon titrəmə"],
    maintenanceCost: "yüksək",
    sourceNote: "Euro NCAP 2021 · ADAC 2022 · Autocar 2023",
    verdict: "EV dünyasının ən lüks sedanı. 770 km diapazonu range anxiety-ni tamamilə aradan qaldırır."
  },
  {
    make: "Mercedes-Benz", model: "GLC 300e", yearFrom: 2023,
    ratings: { reliability: 7, comfort: 9, performance: 8, economy: 9, safety: 9 },
    ownerSatisfaction: 83,
    powertrain: {
      category: "PHEV", systemPowerHp: 313, engineCc: 1999,
      fuelConsumption: { combined: 1.1, unit: "L/100km", testCycle: "WLTP", evOnlyCombined: 19.0, evUnit: "kWh/100km" },
      charging: { batteryKwh: 31.2, acChargeKw: 11, electricRangeKm: 134, connectorType: "Type2" }
    },
    strengths: ["134 km EV diapazonu — PHEV-lərin ən yaxşısı", "11 kW AC sürətli şarj", "Mercedes lüks kabin"],
    weaknesses: ["Çox yüksək qiymət", "Baqaj azalır (batareya)"],
    commonProblems: ["Proqram interfeys xətaları (2023 ilk seriya)", "Şarj konnektoru donması (soyuq hava)"],
    maintenanceCost: "yüksək",
    sourceNote: "WLTP 2023 · Auto Express 2023",
    verdict: "134 km EV diapazonu ilə PHEV seqmentinin şampiyonu. Gündəlik şəhər sürüşü tamamilə yanacaqsız mümkündür."
  },

  // ── Volvo genişlənmə ───────────────────────────────────────────────────────
  {
    make: "Volvo", model: "XC60 T8", yearFrom: 2018,
    ratings: { reliability: 7, comfort: 9, performance: 8, economy: 8, safety: 10 },
    ownerSatisfaction: 82,
    powertrain: {
      category: "PHEV", systemPowerHp: 455, engineCc: 1969,
      fuelConsumption: { combined: 1.6, unit: "L/100km", testCycle: "WLTP", evOnlyCombined: 20.3, evUnit: "kWh/100km" },
      charging: { batteryKwh: 14.9, acChargeKw: 3.7, electricRangeKm: 61, connectorType: "Type2" }
    },
    strengths: ["NCAP 5 ulduz + ən yüksək təhlükəsizlik reytinqi", "455 hp sistem gücü", "Skandinav minimalist dizayn"],
    weaknesses: ["3.7 kW AC şarj çox yavaş", "Yüksək qiymət"],
    commonProblems: ["Şüşə silindiri əyilməsi", "Tablet interfeys donması"],
    maintenanceCost: "yüksək",
    sourceNote: "Euro NCAP 2022 · Consumer Reports 2023",
    verdict: "Volvo-nun PHEV-i təhlükəsizlik standartları ilə öndə. 455 hp gücü ilə PHEV-lər arasında ən sürətlilərdən."
  },

  // ── Nissan EV ─────────────────────────────────────────────────────────────
  {
    make: "Nissan", model: "Leaf", yearFrom: 2018,
    ratings: { reliability: 7, comfort: 7, performance: 6, economy: 9, safety: 8 },
    ownerSatisfaction: 77,
    powertrain: {
      category: "BEV", systemPowerHp: 150,
      fuelConsumption: { combined: 15.0, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 40, fastChargeKw: 50, acChargeKw: 6.6, electricRangeKm: 270, connectorType: "CHAdeMO" }
    },
    strengths: ["Aşağı ilkin qiymət", "Şəhər üçün ideal ölçü", "Nissan servis şəbəkəsi"],
    weaknesses: ["CHAdeMO konnektoru ölür", "50 kW DC şarj çox yavaş", "270 km diapazonu məhduddur", "Batareya termik idarəetmə yoxdur"],
    commonProblems: ["Batareya tutumunun azalması isti iqlimlərdə (aktiv soyutma yoxdur)", "CHAdeMO şarj cihazı tapılması çətinləşir"],
    maintenanceCost: "aşağı",
    sourceNote: "Consumer Reports 2023 · ADAC 2022",
    verdict: "İlk kütləvi EV olaraq tarixi önəmi var. Batareya deqradasiyası isti iqlimlərdə problem; ikinci əl üçün batareya tutumunu mütləq yoxlayın."
  },

  // ── Honda Hibrid ──────────────────────────────────────────────────────────
  {
    make: "Honda", model: "CR-V Hybrid", yearFrom: 2019,
    ratings: { reliability: 8, comfort: 8, performance: 7, economy: 9, safety: 9 },
    ownerSatisfaction: 84,
    powertrain: {
      category: "HEV", systemPowerHp: 212, engineCc: 1993,
      fuelConsumption: { city: 5.5, highway: 6.5, combined: 5.9, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["Honda e:HEV iki motor sistemi", "Şəhərdə sakit sürüş", "Geniş baqaj"],
    weaknesses: ["Magistralda CVT kimi hiss olunur", "İlkin qiymət benzin versiyadan 3-4K çox"],
    commonProblems: ["e:HEV ötürücü proqram xətası (nadir)"],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports 2024 · Euro NCAP 2023",
    verdict: "Honda-nın hibrid texnologiyası Toyota-ya bənzər sakit şəhər sürüşü yaradır."
  },

  // ── Lexus genişlənmə ──────────────────────────────────────────────────────
  {
    make: "Lexus", model: "ES 300h", yearFrom: 2019,
    ratings: { reliability: 9, comfort: 9, performance: 6, economy: 9, safety: 9 },
    ownerSatisfaction: 88,
    powertrain: {
      category: "HEV", systemPowerHp: 215, engineCc: 2487,
      fuelConsumption: { city: 4.8, highway: 5.5, combined: 5.1, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["Consumer Reports-un ən etibarlı avtomobili (2023)", "5.0 L/100km — lüks sedan üçün mükəmməl", "Ultra sakit kabin"],
    weaknesses: ["Sürüş dinamikası zəif", "AWD yoxdur"],
    commonProblems: ["Rütubətli havada pəncərə buğlanması"],
    maintenanceCost: "orta",
    sourceNote: "Consumer Reports Best Buy 2023 · J.D. Power VDS 2023",
    verdict: "Dünyada ən etibarlı avtomobilin şərəfini qazanmış model. Sürüş dinamikasından razı olmayanlar E-Class-a baxmalıdır."
  },
  {
    make: "Lexus", model: "RX 450h", yearFrom: 2016,
    ratings: { reliability: 9, comfort: 9, performance: 7, economy: 8, safety: 9 },
    ownerSatisfaction: 87,
    powertrain: {
      category: "HEV", systemPowerHp: 313, engineCc: 3456,
      fuelConsumption: { city: 7.1, highway: 7.8, combined: 7.4, unit: "L/100km", testCycle: "WLTP" }
    },
    strengths: ["E-Four AWD elektrik sistemi", "313 hp hibrid güc", "Lexus ultra-etibarlılıq"],
    weaknesses: ["7.4 L/100km — hibrid üçün yüksək", "Sürüş dinamikası orta"],
    commonProblems: ["Hava süspansiyonu (F SPORT modeli)", "Navigasiya yeniləmə xərci"],
    maintenanceCost: "orta",
    sourceNote: "J.D. Power VDS 2023 · Consumer Reports 2024",
    verdict: "Hibrid SUV seqmentinin etibarlılıq etalonu. 10 il / 300k km sorunsuz işləyən modellər adi haldır."
  },

  // ── Porsche EV / PHEV ─────────────────────────────────────────────────────
  {
    make: "Porsche", model: "Taycan", yearFrom: 2019,
    ratings: { reliability: 7, comfort: 9, performance: 10, economy: 7, safety: 9 },
    ownerSatisfaction: 87,
    powertrain: {
      category: "BEV", systemPowerHp: 408,
      fuelConsumption: { combined: 20.0, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 93.4, fastChargeKw: 270, acChargeKw: 22, charge10to80Min: 23, electricRangeKm: 484, connectorType: "CCS" }
    },
    strengths: ["270 kW DC şarj — sektördə ən sürətlilərdən", "Porsche sürüş DNA-sı EV-də", "800V şarj sistemi"],
    weaknesses: ["20 kWh/100km — yüksək sərfiyyat", "Çox yüksək qiymət"],
    commonProblems: ["Ön elektronik süspansiyon arızası (ilk nəsil)", "Proqram interfeys xətaları"],
    maintenanceCost: "çox yüksək",
    sourceNote: "Auto Motor Sport 2023 · ADAC 2022",
    verdict: "Elektrik sürüş zövqünün zirvəsi. EV keçidini sürüş keyfi itirmədən etmək istəyənlər üçün ən yaxşı seçim."
  },

  // ── Audi EV / PHEV ────────────────────────────────────────────────────────
  {
    make: "Audi", model: "e-tron", yearFrom: 2019,
    ratings: { reliability: 7, comfort: 9, performance: 8, economy: 7, safety: 9 },
    ownerSatisfaction: 81,
    powertrain: {
      category: "BEV", systemPowerHp: 360,
      fuelConsumption: { combined: 22.0, unit: "kWh/100km", testCycle: "WLTP" },
      charging: { batteryKwh: 95, fastChargeKw: 150, acChargeKw: 11, charge10to80Min: 30, electricRangeKm: 441, connectorType: "CCS" }
    },
    strengths: ["Geniş, lüks kabin", "441 km WLTP", "Audi keyfiyyəti"],
    weaknesses: ["22 kWh/100km — çox enerji sərfiyyatı", "Rəqibdən baha", "150 kW DC şarj orta"],
    commonProblems: ["Şarj sistemi arızaları (ilk nəsil)", "Virtual ayna kamera buğlanması"],
    maintenanceCost: "yüksək",
    sourceNote: "Euro NCAP 2019 · ADAC 2022",
    verdict: "Audi lüksunu EV-ə gətirdi, lakin enerji sərfiyyatı yüksək. Ioniq 5 daha effektiv alternativdir."
  }
];

/**
 * Make + model + year əsasında en uyğun insight-ı tapır.
 * Tam uyğunlaşma > qismən uyğunlaşma > boş qaytarma.
 */
export function getCarInsights(
  make: string,
  model: string,
  year: number
): CarModelInsights | null {
  const makeLower = make.toLowerCase().trim();
  const modelLower = model.toLowerCase().trim();

  const matches = insights.filter((ins) => {
    const insightMake = ins.make.toLowerCase();
    const insightModel = ins.model.toLowerCase();
    if (!makeLower.includes(insightMake) && !insightMake.includes(makeLower)) return false;
    if (!modelLower.includes(insightModel) && !insightModel.includes(modelLower)) return false;
    return true;
  });

  if (matches.length === 0) return null;

  // Year range matching — prefer exact range
  const inRange = matches.filter(
    (ins) => year >= ins.yearFrom && (ins.yearTo === undefined || year <= ins.yearTo)
  );

  if (inRange.length > 0) {
    // Most specific (narrowest range) wins
    return inRange.sort((a, b) => {
      const aRange = (a.yearTo ?? 2030) - a.yearFrom;
      const bRange = (b.yearTo ?? 2030) - b.yearFrom;
      return aRange - bRange;
    })[0];
  }

  // Fallback: closest year range
  return matches.sort((a, b) => {
    const aDist = Math.min(Math.abs(year - a.yearFrom), Math.abs(year - (a.yearTo ?? 2025)));
    const bDist = Math.min(Math.abs(year - b.yearFrom), Math.abs(year - (b.yearTo ?? 2025)));
    return aDist - bDist;
  })[0];
}

export { insights as ALL_CAR_INSIGHTS };

// ── Marka-səviyyəsində ümumi etibarlılıq konteksti ──────────────────────────
// Xüsusi model tapılmadıqda göstərilir

export interface BrandContext {
  make: string;
  reliabilityTier: "top" | "above_avg" | "average" | "below_avg";
  maintenanceCost: MaintenanceCost;
  note: string;
}

export const BRAND_CONTEXTS: BrandContext[] = [
  { make: "Toyota", reliabilityTier: "top", maintenanceCost: "orta",
    note: "Toyota bütün modellərində sənayenin ən yüksək etibarlılıq standartını qoruyur. J.D. Power sıralamalarında daimi lider." },
  { make: "Lexus", reliabilityTier: "top", maintenanceCost: "orta",
    note: "Toyota-nın premium qolu olan Lexus, Consumer Reports-un ən etibarlı marka sıralamasında ilk pilləni tutur." },
  { make: "Mazda", reliabilityTier: "top", maintenanceCost: "orta",
    note: "Mazda keyfiyyət/etibarlılıq nisbətinə görə Toyota ilə rəqabət aparır. Consumer Reports tərəfindən yüksək qiymətləndirilir." },
  { make: "Honda", reliabilityTier: "above_avg", maintenanceCost: "orta",
    note: "Honda uzun illik etibarlılıq reputasiyasını qoruyur. Bəzi CVT modellərində şikayətlər var." },
  { make: "Subaru", reliabilityTier: "above_avg", maintenanceCost: "orta",
    note: "AWD sisteminin etibarlılığı yüksəkdir. Boksör mühərrikinin texniki qulluğuna diqqət tələb olunur." },
  { make: "Hyundai", reliabilityTier: "average", maintenanceCost: "orta",
    note: "Son nəsillərdə etibarlılıq əhəmiyyətli artmışdır. 2016–2020 GDi mühərrikli modellər recall siyahısını yoxlayın." },
  { make: "Kia", reliabilityTier: "average", maintenanceCost: "orta",
    note: "Hyundai ilə eyni platform — eyni güclü cəhətlər və eyni potensial problemlər." },
  { make: "Volkswagen", reliabilityTier: "average", maintenanceCost: "orta",
    note: "DSG ötürücüsü olan modellər diqqət tələb edir. Alman keyfiyyəti var, lakin xidmət xərci Yaponiaya görə yüksəkdir." },
  { make: "Skoda", reliabilityTier: "average", maintenanceCost: "orta",
    note: "Volkswagen qrupu platforması — oxşar güclü cəhətlər və problemlər, lakin qiymət daha aşağıdır." },
  { make: "Audi", reliabilityTier: "average", maintenanceCost: "yüksək",
    note: "Premium keyfiyyət, lakin texniki xidmət xərci yüksəkdir. TFSI mühərrikdə yağ sərfi şikayətləri yayılmışdır." },
  { make: "BMW", reliabilityTier: "average", maintenanceCost: "yüksək",
    note: "Dinamik sürüş ənənəsi güclüdür. Su nasosu/termostat arızaları statistik olaraq daha tez rast gəlinir." },
  { make: "Mercedes-Benz", reliabilityTier: "average", maintenanceCost: "yüksək",
    note: "Lüks konfort yüksəkdir. TÜV statistikasında xırda elektrik arızaları ortalamadan çoxdur." },
  { make: "Nissan", reliabilityTier: "below_avg", maintenanceCost: "orta",
    note: "CVT ötürücüsü Nissan-ın ən zəyif nöqtəsidir. CVT vəziyyəti alışdan əvvəl mütləq yoxlanılmalıdır." },
  { make: "Chevrolet", reliabilityTier: "below_avg", maintenanceCost: "orta",
    note: "Consumer Reports etibarlılıq sıralamasında orta-altında qalır. CVT şikayətləri geniş yayılmışdır." },
  { make: "Ford", reliabilityTier: "average", maintenanceCost: "orta",
    note: "Amerikan platformaları müxtəlif etibarlılıq göstəriciləri ilə gəlir. PowerShift DCT-li modellər diqqət tələb edir." },
  { make: "Land Rover", reliabilityTier: "below_avg", maintenanceCost: "çox yüksək",
    note: "Yolsuzluq performansı mükəmməldir, lakin etibarlılıq statistikası aşağıdır. Xidmət xərci çox yüksəkdir." },
  { make: "Jeep", reliabilityTier: "below_avg", maintenanceCost: "yüksək",
    note: "Offroad qabiliyyəti güclüdür. TÜV statistikasında etibarlılıq aşağıdır; xidmət tarixçəsi yoxlanılmalıdır." },
  { make: "Mitsubishi", reliabilityTier: "average", maintenanceCost: "orta",
    note: "Outlander/Pajero seriyaları Azərbaycanda populyardır. Ümumi etibarlılıq orta səviyyədədir." },
  { make: "Renault", reliabilityTier: "average", maintenanceCost: "orta",
    note: "Duster Azərbaycanda geniş yayılmışdır. Elektrik sistemi arızaları bəzən rast gəlinir." },
  { make: "Volvo", reliabilityTier: "above_avg", maintenanceCost: "yüksək",
    note: "Təhlükəsizlik standartları sənayenin zirvəsindədir. Xidmət xərci yüksəkdir." },
  { make: "Porsche", reliabilityTier: "above_avg", maintenanceCost: "çox yüksək",
    note: "Cayenne/Macan etibarlı mühərriklərlə gəlir. Xidmət xərci çox yüksəkdir." },
];

export function getBrandContext(make: string): BrandContext | null {
  const lower = make.toLowerCase().trim();
  return BRAND_CONTEXTS.find((b) => b.make.toLowerCase() === lower) ?? null;
}
