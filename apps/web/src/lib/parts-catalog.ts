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
  "Transmissiya və debriyaj",
  "Səsboğucu və egzoz",
  "Təhlükəsizlik sistemləri",
  "Detailing və kimyəvi məhsullar",
  "Alətlər və servis avadanlığı",
  "12V/220V avto elektronika",
  "Motosiklet və ATV hissələri",
  "Universal məhsullar"
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
  ,
  "Səsboğucu və egzoz": ["Səsboğucu", "Katalizator", "Lambda sensoru", "Egzoz borusu", "Dəstək və asqılar"],
  "Təhlükəsizlik sistemləri": ["Airbag", "Kəmər mexanizmi", "ABS/ESP modul", "Kamera və sensor", "İmmobilayzer"],
  "Detailing və kimyəvi məhsullar": ["Yuma şampunu", "Polish", "Boya qoruyucu", "Salon təmizləyici", "Texniki maye"],
  "Alətlər və servis avadanlığı": ["Diaqnostika cihazı", "Kompressor", "Domkrat", "Açar dəsti", "Servis stendi"],
  "12V/220V avto elektronika": ["DVR", "Radar detektor", "Şarj adapteri", "LED lent", "GPS/Naviqasiya"],
  "Motosiklet və ATV hissələri": ["Zəncir dəsti", "Təkər", "Filtr", "Əyləc", "Aksesuar"],
  "Universal məhsullar": ["Bolt/qayka", "Bərkidici", "Universal filtr", "Universal aksesuar", "Digər"]
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

export const PART_AUTHENTICITY_OPTIONS: Array<{ value: "original" | "oem" | "aftermarket"; label: string }> = [
  { value: "original", label: "Orijinal (OE)" },
  { value: "oem", label: "OEM/Firma" },
  { value: "aftermarket", label: "Aftermarket" }
];

