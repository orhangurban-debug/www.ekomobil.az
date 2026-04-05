export const PART_CATEGORIES = [
  "Mühərrik və aqreqatlar",
  "Asqı və sükan",
  "Əyləc sistemi",
  "Elektrik və elektronika",
  "İşıqlandırma",
  "Filtrlər və yağlar",
  "Təkər və disklər",
  "Kuzov hissələri",
  "Salon və aksesuar",
  "Akkumulyator və enerji",
  "Soyutma və kondisioner",
  "Transmissiya və debriyaj"
] as const;

export const PART_SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  "Mühərrik və aqreqatlar": ["Mühərrik", "Turbo", "Nasos", "Enjektor", "Kəmər və zəncir", "Silindr başlığı", "Conta dəsti"],
  "Asqı və sükan": ["Amortizator", "Yay", "Şarovoy", "Rul ucluğu", "Rul reykası", "Stabilizator"],
  "Əyləc sistemi": ["Əyləc diski", "Əyləc kolodkası", "SUPORT", "ABS sensoru", "Əyləc mayesi"],
  "Elektrik və elektronika": ["Sensor", "ECU", "Generator", "Starter", "Kabel dəsti", "Açar/modul"],
  "İşıqlandırma": ["Faralar", "Stop", "Duman farası", "Lampa", "LED modul"],
  "Filtrlər və yağlar": ["Mühərrik yağı", "Transmissiya yağı", "Yağ filtri", "Hava filtri", "Salon filtri", "Yanacaq filtri"],
  "Təkər və disklər": ["Yay təkəri", "Qış təkəri", "4 mövsüm", "Disk", "Bolt/qayka", "Təzyiq sensoru"],
  "Kuzov hissələri": ["Qapı", "Kapot", "Bamper", "Palçıq qoruyucu", "Güzgü", "Şüşə"],
  "Salon və aksesuar": ["Multimedia", "Maqnitola", "DVR", "Kovrik", "Çexol", "Tavan relsi"],
  "Akkumulyator və enerji": ["Akkumulyator", "Şarj cihazı", "Klem", "İnverter"],
  "Soyutma və kondisioner": ["Radiator", "Termostat", "Ventilyator", "Kondisioner kompressoru", "Freon komponentləri"],
  "Transmissiya və debriyaj": ["Sürət qutusu", "Debriyaj komplekti", "Şrus", "Diferensial", "Kardan"]
};

export const PART_BRANDS = [
  "Bosch", "Mann", "Mahle", "Sachs", "Luk", "INA", "SKF", "NGK", "Denso", "Valeo",
  "Continental", "Michelin", "Bridgestone", "Goodyear", "Pirelli", "Mobil", "Castrol",
  "Liqui Moly", "Shell", "Total", "Motul", "ATE", "Brembo", "TRW", "KYB", "Monroe",
  "Hella", "Philips", "Osram", "Varta", "Exide", "Yuasa", "Digər"
] as const;

export const PART_CONDITIONS: Array<{ value: "new" | "used" | "refurbished"; label: string }> = [
  { value: "new", label: "Yeni" },
  { value: "used", label: "İşlənmiş" },
  { value: "refurbished", label: "Bərpa olunmuş" }
];

