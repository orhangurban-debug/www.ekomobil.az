/**
 * EkoMobil — avtomobil markaları, modellər və filter seçimləri
 * Turbo.az kataloqu + beynəlxalq bazarlar əsasında
 */

export const CAR_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "BAIC", "Bentley", "BMW", "Brilliance", "Bugatti",
  "Buick", "BYD", "Cadillac", "CFMoto", "Changan", "Chery", "Chevrolet", "Chrysler", "Citroën",
  "Cupra", "Dacia", "Daewoo", "Daihatsu", "Dodge", "Dongfeng", "DS", "Exeed",
  "FAW", "Ferrari", "Fiat", "Fisker", "Ford", "Foton", "GAC", "GAZ", "Geely",
  "Genesis", "GMC", "Great Wall", "Harley-Davidson", "Haval", "Honda", "Hongqi", "Horizon", "Hummer",
  "Hyundai", "Infiniti", "Iran Khodro", "Isuzu", "JAC", "Jaecoo", "Jaguar", "Jeep", "Jetour",
  "Jetta", "Kawasaki", "Kia", "Koenigsegg", "KTM", "Lada", "Lamborghini", "Lancia", "Land Rover", "Lexus",
  "Li Auto", "Lifan", "Lincoln", "Lotus", "Lucid", "Lynk & Co", "Maserati", "Maybach", "Mazda",
  "McLaren", "Mercedes-Benz", "MG", "Mini", "Mitsubishi", "Nio", "Nissan", "Omoda", "Opel",
  "Ora", "Pagani", "Peugeot", "Polestar", "Porsche", "Ravon", "Renault", "Rivian",
  "Rolls-Royce", "Saab", "Saipa", "Seat", "Skoda", "Smart", "SsangYong", "Subaru",
  "Suzuki", "Tank", "Tata", "Tesla", "Toyota", "UAZ", "Volkswagen", "Volvo", "XPeng", "Yamaha", "Zeekr"
] as const;

export const BODY_TYPES = [
  "Sedan", "Hatchback", "Universal", "SUV", "Crossover", "Coupe", "Cabrio", "Minivan",
  "Pickup", "Van", "Limuzin", "Roadster", "Yük maşını", "Avtobus", "Mikroavtobus",
  "Motosiklet", "Skuter", "Moped"
] as const;

export const FUEL_TYPES = [
  "Benzin",
  "Dizel",
  "Hibrid",
  "Mild Hibrid (MHEV)",
  "Plug-in Hibrid",
  "Range Extender (EREV)",
  "Elektrik",
  "Hidrogen (FCEV)",
  "Qaz (LPG)",
  "Qaz (CNG)"
] as const;

export const ENGINE_TYPES = [
  "Atmosfer",
  "Turbo",
  "Kompressor",
  "Hibrid sistem",
  "Elektrik motoru",
  "Range extender generator",
  "Hidrogen yanacaq hüceyrəsi"
] as const;

export const TRANSMISSIONS = [
  "Avtomat", "Mexanik", "Variator (CVT)", "Robotlaşdırılmış", "İki sürətli"
] as const;

export const DRIVE_TYPES = [
  "Ön təkər", "Arxa təkər", "Tam ötürmə (4x4)"
] as const;

export const COLORS = [
  "Ağ", "Qara", "Boz", "Gümüşü", "Bəyaz", "Qırmızı", "Mavi", "Yaşıl",
  "Narıncı", "Sarı", "Qəhvəyi", "Bənövşəyi", "Bej", "Çəhrayı"
] as const;

export const CONDITIONS = [
  "Qəzasız, rənglənməmiş",
  "Qəzasız",
  "Rənglənmiş",
  "Qəzalı",
  "Su altında qalmış",
  "Kuzov zərərli"
] as const;

export const INTERIOR_MATERIALS = [
  "Parça",
  "Dəri",
  "Alkantara",
  "Kombinə",
  "Vinil"
] as const;

export const AZERBAIJAN_CITIES = [
  "Bakı", "Sumqayıt", "Gəncə", "Mingəçevir", "Lənkəran", "Naxçıvan", "Şəki",
  "Yevlax", "Xankəndi", "Bərdə", "Cəlilabad", "Şirvan", "Ağcabədi", "Quba",
  "Qusar", "Masallı", "Saatlı", "Sabirabad", "Salyan", "Zaqatala", "Digər"
] as const;

export type CarMake = (typeof CAR_MAKES)[number];
export type BodyType = (typeof BODY_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type EngineType = (typeof ENGINE_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type DriveType = (typeof DRIVE_TYPES)[number];
export type Color = (typeof COLORS)[number];
export type Condition = (typeof CONDITIONS)[number];
export type InteriorMaterial = (typeof INTERIOR_MATERIALS)[number];

/**
 * Marka → Model siyahısı
 * Azərbaycan bazarında aktiv olan modellər (Turbo.az kataloqu əsasında)
 */
export const CAR_MODELS_BY_MAKE: Record<string, string[]> = {
  "Toyota": [
    "Camry", "Corolla", "Corolla Cross", "RAV4", "C-HR",
    "Yaris", "Yaris Cross", "Land Cruiser", "Land Cruiser Prado", "Land Cruiser 200",
    "Land Cruiser 300", "Fortuner", "Highlander", "4Runner", "Sequoia",
    "Prius", "Prius+", "Venza", "Alphard", "Vellfire",
    "FJ Cruiser", "Rush", "Hilux", "Tundra", "Tacoma",
    "Avensis", "Auris", "Verso"
  ],
  "Hyundai": [
    "Accent", "Elantra", "Sonata", "Grandeur", "Azera",
    "Tucson", "Santa Fe", "Creta", "ix35", "Palisade",
    "Kona", "i20", "i30", "i40", "Staria",
    "Ioniq", "Ioniq 5", "Ioniq 6", "Nexo", "Veloster"
  ],
  "Kia": [
    "Rio", "Cerato", "Forte", "K5", "K8",
    "Cadenza", "Stinger", "Quoris", "Sportage", "Sorento",
    "Carnival", "Sedona", "Telluride", "Niro", "EV6",
    "Seltos", "Soul", "Mohave", "Picanto", "Morning"
  ],
  "Mercedes-Benz": [
    "A-Class", "B-Class", "C-Class", "E-Class", "S-Class",
    "CLA", "CLS", "AMG GT", "G-Class", "GLA",
    "GLB", "GLC", "GLE", "GLS", "ML-Class",
    "GL-Class", "V-Class", "Vito", "Sprinter", "EQC",
    "EQS", "EQE", "EQA", "EQB", "Maybach S-Class"
  ],
  "BMW": [
    "1 Series", "2 Series", "3 Series", "4 Series", "5 Series",
    "6 Series", "7 Series", "8 Series", "X1", "X2",
    "X3", "X4", "X5", "X6", "X7",
    "M2", "M3", "M4", "M5", "M8",
    "Z3", "Z4", "i3", "i4", "i5",
    "iX", "iX3", "iX1", "X5 M", "X6 M"
  ],
  "Volkswagen": [
    "Golf", "Polo", "Passat", "Jetta", "Arteon",
    "Tiguan", "Tiguan Allspace", "Touareg", "T-Roc", "T-Cross",
    "Sharan", "Touran", "Caddy", "ID.3", "ID.4",
    "ID.5", "Transporter", "Amarok", "Phaeton", "CC"
  ],
  "Chevrolet": [
    "Malibu", "Equinox", "Traverse", "Captiva", "Cobalt",
    "Cruze", "Aveo", "Lacetti", "Spark", "Trailblazer",
    "Trax", "Tahoe", "Suburban", "Silverado", "Colorado",
    "Camaro", "Corvette", "Impala", "Sonic", "Orlando"
  ],
  "Honda": [
    "Accord", "Civic", "CR-V", "HR-V", "Pilot",
    "Passport", "Odyssey", "Ridgeline", "Jazz", "Fit",
    "Legend", "CR-Z", "Insight", "ZR-V", "e:Ny1"
  ],
  "Nissan": [
    "Qashqai", "X-Trail", "Altima", "Maxima", "Sentra",
    "Juke", "Kicks", "Pathfinder", "Murano", "Patrol",
    "Navara", "Frontier", "Leaf", "Ariya", "GT-R",
    "370Z", "350Z", "Note", "Tiida", "Micra/March"
  ],
  "Lexus": [
    "ES", "IS", "GS", "LS", "LC",
    "NX", "RX", "GX", "LX", "UX",
    "RC", "RC F", "CT 200h", "LS 500h", "RZ"
  ],
  "Audi": [
    "A1", "A3", "A4", "A5", "A6",
    "A7", "A8", "Q2", "Q3", "Q5",
    "Q7", "Q8", "TT", "TT RS", "R8",
    "RS3", "RS4", "RS5", "RS6", "RS7",
    "S3", "S4", "S5", "SQ5", "SQ7",
    "e-tron", "e-tron GT", "Q4 e-tron", "Q8 e-tron", "e-tron Sportback"
  ],
  "Land Rover": [
    "Range Rover", "Range Rover Sport", "Range Rover Velar",
    "Range Rover Evoque", "Defender", "Discovery",
    "Discovery Sport", "Freelander", "LR2", "LR4"
  ],
  "Porsche": [
    "Cayenne", "Cayenne Coupe", "Macan", "Panamera",
    "911", "Boxster", "Cayman", "Taycan", "Taycan Cross Turismo"
  ],
  "Jeep": [
    "Grand Cherokee", "Cherokee", "Wrangler", "Renegade",
    "Compass", "Gladiator", "Commander", "Patriot"
  ],
  "Ford": [
    "Focus", "Mondeo", "Fusion", "Explorer", "Escape",
    "Kuga", "F-150", "F-250", "Ranger", "Mustang",
    "Edge", "Expedition", "Transit", "EcoSport", "Maverick",
    "Bronco", "Puma", "Fiesta"
  ],
  "Mitsubishi": [
    "Outlander", "Eclipse Cross", "ASX", "Galant", "Lancer",
    "Pajero", "Pajero Sport", "L200", "Colt", "Space Star",
    "Carisma", "Grandis", "Sigma"
  ],
  "Subaru": [
    "Outback", "Forester", "XV", "Crosstrek", "Impreza",
    "Legacy", "WRX", "WRX STI", "BRZ", "Ascent",
    "Levorg", "Solterra"
  ],
  "Mazda": [
    "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5",
    "CX-7", "CX-9", "CX-60", "MX-5", "RX-8",
    "2", "5", "Premacy", "BT-50"
  ],
  "Renault": [
    "Duster", "Logan", "Sandero", "Megane", "Koleos",
    "Captur", "Fluence", "Talisman", "Clio", "Arkana",
    "Kadjar", "Scenic", "Laguna", "Vel Satis"
  ],
  "Skoda": [
    "Octavia", "Superb", "Kodiaq", "Karoq", "Fabia",
    "Rapid", "Scala", "Kamiq", "Enyaq", "Yeti",
    "Roomster", "Citigo"
  ],
  "Volvo": [
    "XC40", "XC60", "XC90", "S40", "S60",
    "S80", "S90", "V40", "V60", "V90",
    "C30", "C40", "C70"
  ],
  "Lada": [
    "Vesta", "Granta", "Niva", "Niva Travel", "Largus",
    "Priora", "Kalina", "2107", "2108", "2109",
    "2110", "2111", "2112", "2114", "2115"
  ],
  "Daewoo": [
    "Nexia", "Lanos", "Matiz", "Nubira", "Lacetti",
    "Leganza", "Espero", "Tico", "Gentra"
  ],
  "Ravon": ["R2", "R3", "R4", "R4 Active"],
  "Chery": [
    "Tiggo 2", "Tiggo 4", "Tiggo 4 Pro", "Tiggo 7",
    "Tiggo 7 Pro", "Tiggo 8", "Tiggo 8 Pro",
    "Arrizo 5", "Arrizo 6", "Arrizo 8"
  ],
  "Omoda": ["C5", "S5", "E5", "C7"],
  "Jaecoo": ["J7", "J8", "J5"],
  "BAIC": ["X55", "X7", "BJ40", "BJ60", "EU5", "U5"],
  "XPeng": ["G6", "G9", "P7", "P5", "X9"],
  "Li Auto": ["L6", "L7", "L8", "L9", "MEGA"],
  "GAZ": ["Gazelle", "Gazelle Next", "Sobol", "Valdai", "3307"],
  "UAZ": ["Patriot", "Hunter", "Bukhanka", "Pickup", "Profi"],
  "Yamaha": ["YZF-R3", "YZF-R6", "MT-07", "MT-09", "XMAX", "NMAX", "Tracer 9"],
  "Kawasaki": ["Ninja 400", "Ninja 650", "Z650", "Z900", "Versys 650", "Vulcan S"],
  "Harley-Davidson": ["Street 750", "Iron 883", "Forty-Eight", "Sportster", "Fat Boy"],
  "KTM": ["Duke 390", "Duke 890", "RC 390", "Adventure 390", "Adventure 890"],
  "CFMoto": ["300NK", "450NK", "700CL-X", "800MT", "250SR"],
  "Haval": [
    "H1", "H2", "H4", "H6", "H9",
    "F5", "F7", "F7x", "Jolion", "Dargo",
    "Big Dog", "Shenshou"
  ],
  "Geely": [
    "Atlas", "Atlas Pro", "Coolray", "Emgrand",
    "Tugella", "Boyue", "Monjaro", "Okavango", "Preface"
  ],
  "BYD": [
    "Han", "Tang", "Song", "Song Plus", "Atto 3",
    "Dolphin", "Seal", "Sealion 6", "F3", "L6"
  ],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Infiniti": [
    "Q50", "Q60", "Q70", "QX30", "QX50",
    "QX55", "QX60", "QX80", "G35", "G37",
    "FX35", "FX37", "EX35", "JX35"
  ],
  "Opel": [
    "Astra", "Insignia", "Corsa", "Mokka", "Crossland",
    "Grandland", "Zafira", "Vectra", "Meriva", "Antara",
    "Combo", "Omega", "Frontera"
  ],
  "Peugeot": [
    "208", "308", "508", "2008", "3008",
    "5008", "406", "407", "408", "e-2008",
    "e-208", "1007", "3008 PHEV"
  ],
  "Mini": [
    "Cooper", "Hatch", "Countryman", "Clubman", "Paceman",
    "Cabrio", "Coupe", "Roadster", "Paceman"
  ],
  "Dodge": [
    "Charger", "Challenger", "Durango", "Journey", "RAM 1500",
    "RAM 2500", "RAM 3500", "Nitro", "Caliber"
  ],
  "Cadillac": [
    "Escalade", "CT4", "CT5", "CT6", "XT4",
    "XT5", "XT6", "SRX", "ATS", "CTS",
    "DTS", "STS", "Eldorado"
  ],
  "Jaguar": [
    "XE", "XF", "XJ", "F-Pace", "E-Pace",
    "I-Pace", "F-Type", "X-Type", "S-Type", "XK"
  ],
  "GMC": [
    "Yukon", "Yukon XL", "Terrain", "Acadia", "Envoy",
    "Sierra", "Canyon", "Jimmy", "Typhoon"
  ],
  "Lincoln": [
    "Navigator", "Aviator", "Corsair", "Nautilus",
    "MKZ", "MKX", "MKT", "MKC", "Continental"
  ],
  "Acura": ["MDX", "RDX", "TLX", "ILX", "RLX", "NSX", "CDX"],
  "Genesis": ["G70", "G80", "G90", "GV70", "GV80", "GV60"],
  "MG": ["ZS", "HS", "RX5", "5", "6", "3", "4", "Marvel R", "One"],
  "Hummer": ["H2", "H3", "EV"],
  "Maserati": [
    "Ghibli", "Quattroporte", "Levante", "GranTurismo",
    "GranCabrio", "Grecale", "MC20"
  ],
  "Seat": [
    "Ibiza", "Leon", "Ateca", "Tarraco", "Arona",
    "Alhambra", "Toledo", "Altea", "Exeo"
  ],
  "Alfa Romeo": [
    "Giulia", "Stelvio", "Tonale", "Giulietta",
    "159", "156", "147", "Spider", "4C"
  ],
  "Suzuki": [
    "Vitara", "S-Cross", "Grand Vitara", "SX4",
    "Jimny", "Swift", "Baleno", "Ignis", "Ertiga"
  ],
  "Aston Martin": [
    "DB9", "DB11", "DB12", "Vantage", "DBS",
    "Rapide", "Virage", "Vanquish", "DBX"
  ],
  "Lamborghini": [
    "Huracán", "Urus", "Aventador", "Gallardo",
    "Murciélago", "Diablo"
  ],
  "Ferrari": [
    "488", "F8", "Roma", "Portofino", "SF90",
    "GTC4Lusso", "California", "812 Superfast", "296 GTB"
  ],
  "Rolls-Royce": [
    "Ghost", "Phantom", "Wraith", "Dawn",
    "Cullinan", "Silver Shadow", "Silver Seraph"
  ],
  "Bentley": [
    "Continental GT", "Flying Spur", "Bentayga",
    "Mulsanne", "Arnage"
  ],
  "Buick": [
    "Encore", "Encore GX", "Envision", "Enclave",
    "LaCrosse", "Regal", "Verano", "Lucerne"
  ],
  "Saab": ["9-3", "9-5", "9-7X"],
  "Dacia": ["Duster", "Logan", "Sandero", "Spring", "Jogger", "Dokker"],
  "Fiat": [
    "500", "Panda", "Tipo", "Punto",
    "Doblo", "Ducato", "Bravo", "Stilo", "Croma"
  ],
  "Polestar": ["1", "2", "3", "4"],
  "Changan": [
    "CS35", "CS55", "CS75", "CS85", "CS95",
    "UNI-K", "UNI-T", "Eado", "Raeton"
  ],
  "Exeed": ["TXL", "VX", "LX", "RX", "TX"],
  "Jetour": ["X70", "X90", "X70 Plus", "Dashing", "Traveler"],
  "JAC": ["S3", "S5", "S7", "T6", "T8", "J7"],
  "Foton": ["Tunland", "Sauvana", "View"],
  // Markalar — Azərbaycan bazarında tez-tez rast gəlinən / boş qalanlar
  "Citroën": ["C3", "C4", "C5 Aircross", "Berlingo", "Jumpy", "Jumper"],
  "Cupra": ["Formentor", "Leon", "Ateca", "Born", "Tavascan"],
  "Daihatsu": ["Terios", "Sirion", "Materia", "Rocky"],
  "Dongfeng": ["AX7", "Shine", "Rich", "Captain"],
  "DS": ["3", "4", "7", "9"],
  "FAW": ["Bestune T77", "Bestune T99", "B50", "V2"],
  "GAC": ["GS3", "GS4", "GS8", "Empow", "Aion S", "Aion Y"],
  "Great Wall": ["Poer", "Wingle", "Hover H3", "Hover H5", "Cannon"],
  "Hongqi": ["H5", "H9", "HS5", "HS7", "E-HS9"],
  "Iran Khodro": ["Samand", "Dena", "Runna", "Soren"],
  "Isuzu": ["D-Max", "MU-X", "NPR", "NQR", "Elf"],
  "Jetta": ["VS5", "VS7", "VA3", "VA7"],
  "Lifan": ["X60", "X70", "Solano", "Myway"],
  "Lynk & Co": ["01", "02", "03", "05", "08", "09"],
  "Nio": ["ET5", "ET7", "ES6", "ES8", "EC6", "EC7"],
  "Ora": ["Good Cat", "Funky Cat", "Lightning Cat"],
  "Saipa": ["Pride", "Saina", "Quick", "Shahin"],
  "Smart": ["ForTwo", "ForFour", "#1", "#3"],
  "SsangYong": ["Rexton", "Korando", "Tivoli", "Musso", "Actyon"],
  "Tank": ["300", "500", "700"],
  "Zeekr": ["001", "007", "X", "009"],
  "Brilliance": ["V3", "V5", "H530", "FRV"],
  "Chrysler": ["300C", "Pacifica", "Voyager", "Town & Country"],
  "Maybach": ["S-Class", "GLS", "EQS"],
  "Bugatti": ["Chiron", "Veyron", "Divo"],
  "Fisker": ["Ocean", "Karma"],
  "Horizon": ["C8", "C9"],
  "Koenigsegg": ["Jesko", "Gemera", "Regera"],
  "Lancia": ["Ypsilon", "Delta", "Thema"],
  "Lotus": ["Emira", "Eletre", "Evija"],
  "Lucid": ["Air", "Gravity"],
  "McLaren": ["720S", "Artura", "GT", "750S"],
  "Pagani": ["Huayra", "Zonda", "Utopia"],
  "Rivian": ["R1T", "R1S", "EDV"],
  "Tata": ["Nexon", "Punch", "Harrier", "Safari"],
};

/**
 * Marka üçün modelləri qaytarır. Tapılmasa boş siyahı qaytarır.
 */
export function getModelsForMake(make: string): string[] {
  return CAR_MODELS_BY_MAKE[make] ?? [];
}

export function getCompatibleEngineTypes(fuelType?: string): EngineType[] {
  if (!fuelType) return [...ENGINE_TYPES];
  if (fuelType === "Elektrik") return ["Elektrik motoru"];
  if (fuelType === "Hidrogen (FCEV)") return ["Hidrogen yanacaq hüceyrəsi", "Elektrik motoru"];
  if (fuelType === "Range Extender (EREV)") return ["Elektrik motoru", "Range extender generator"];
  if (fuelType === "Hibrid" || fuelType === "Mild Hibrid (MHEV)" || fuelType === "Plug-in Hibrid") {
    return ["Hibrid sistem", "Atmosfer", "Turbo"];
  }
  return ["Atmosfer", "Turbo", "Kompressor"];
}

export function getCompatibleTransmissions(fuelType?: string): Transmission[] {
  if (!fuelType) return [...TRANSMISSIONS];
  if (fuelType === "Elektrik" || fuelType === "Hidrogen (FCEV)" || fuelType === "Range Extender (EREV)") {
    return ["Avtomat", "İki sürətli"];
  }
  if (fuelType === "Hibrid" || fuelType === "Mild Hibrid (MHEV)" || fuelType === "Plug-in Hibrid") {
    return ["Avtomat", "Variator (CVT)", "Robotlaşdırılmış"];
  }
  return ["Avtomat", "Mexanik", "Variator (CVT)", "Robotlaşdırılmış"];
}
