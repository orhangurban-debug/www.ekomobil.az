/**
 * EkoMobil — avtomobil markaları və filter seçimləri
 * Turbo.az və beynəlxalq kataloqlar əsasında
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
