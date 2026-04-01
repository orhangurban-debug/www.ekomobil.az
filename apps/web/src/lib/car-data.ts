/**
 * EkoMobil — avtomobil markaları, modellər və filter seçimləri
 * Turbo.az kataloqu + beynəlxalq bazarlar əsasında
 */

export const CAR_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Brilliance", "Bugatti",
  "Buick", "BYD", "Cadillac", "Changan", "Chery", "Chevrolet", "Chrysler", "Citroën",
  "Cupra", "Dacia", "Daewoo", "Daihatsu", "Dodge", "Dongfeng", "DS", "Exeed",
  "FAW", "Ferrari", "Fiat", "Fisker", "Ford", "Foton", "GAC", "Geely",
  "Genesis", "GMC", "Great Wall", "Haval", "Honda", "Hongqi", "Horizon", "Hummer",
  "Hyundai", "Infiniti", "Iran Khodro", "Isuzu", "JAC", "Jaguar", "Jeep", "Jetour",
  "Jetta", "Kia", "Koenigsegg", "Lada", "Lamborghini", "Lancia", "Land Rover", "Lexus",
  "Lifan", "Lincoln", "Lotus", "Lucid", "Lynk & Co", "Maserati", "Maybach", "Mazda",
  "McLaren", "Mercedes-Benz", "MG", "Mini", "Mitsubishi", "Nio", "Nissan", "Opel",
  "Ora", "Pagani", "Peugeot", "Polestar", "Porsche", "Ravon", "Renault", "Rivian",
  "Rolls-Royce", "Saab", "Saipa", "Seat", "Skoda", "Smart", "SsangYong", "Subaru",
  "Suzuki", "Tank", "Tata", "Tesla", "Toyota", "Volkswagen", "Volvo", "Zeekr"
] as const;

export const BODY_TYPES = [
  "Sedan", "Hatchback", "Universal", "SUV", "Crossover", "Coupe", "Cabrio", "Minivan",
  "Pickup", "Van", "Limuzin", "Roadster"
] as const;

export const FUEL_TYPES = [
  "Benzin", "Dizel", "Hibrid", "Plug-in Hibrid", "Elektrik", "Qaz (LPG)", "Qaz (CNG)"
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
  "Qəzasız", "Rənglənmiş", "Qəzalı"
] as const;

export const AZERBAIJAN_CITIES = [
  "Bakı", "Sumqayıt", "Gəncə", "Mingəçevir", "Lənkəran", "Naxçıvan", "Şəki",
  "Yevlax", "Xankəndi", "Bərdə", "Cəlilabad", "Şirvan", "Ağcabədi", "Quba",
  "Qusar", "Masallı", "Saatlı", "Sabirabad", "Salyan", "Zaqatala", "Digər"
] as const;

export type CarMake = (typeof CAR_MAKES)[number];
export type BodyType = (typeof BODY_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type DriveType = (typeof DRIVE_TYPES)[number];
export type Color = (typeof COLORS)[number];
export type Condition = (typeof CONDITIONS)[number];

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
    "Arrizo 5", "Arrizo 6", "Arrizo 8", "Omoda 5"
  ],
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
};

/**
 * Marka üçün modelləri qaytarır. Tapılmasa boş siyahı qaytarır.
 */
export function getModelsForMake(make: string): string[] {
  return CAR_MODELS_BY_MAKE[make] ?? [];
}
