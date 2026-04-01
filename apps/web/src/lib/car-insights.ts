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
