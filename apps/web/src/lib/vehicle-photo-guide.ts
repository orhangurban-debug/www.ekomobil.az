export type VehiclePhotoGuideCategory = "car" | "motorcycle" | "commercial";

export type PhotoGuidePriority = "essential" | "important" | "recommended";

export type PhotoGuideIllustrationId =
  | "front_left_34"
  | "front_right_34"
  | "rear_left_34"
  | "rear_right_34"
  | "left_side"
  | "right_side"
  | "front_straight"
  | "rear_straight"
  | "dashboard"
  | "rear_seats"
  | "odometer"
  | "trunk"
  | "engine"
  | "cargo_area"
  | "chain_detail"
  | "damage_detail";

export interface PhotoGuideShot {
  id: string;
  order: number;
  label: string;
  priority: PhotoGuidePriority;
  tip: string;
  illustration: PhotoGuideIllustrationId;
}

export interface VehiclePhotoGuideCategoryMeta {
  id: VehiclePhotoGuideCategory;
  label: string;
  description: string;
  icon: string;
}

export const PHOTO_GUIDE_PRIORITY_LABELS: Record<PhotoGuidePriority, string> = {
  essential: "Əsas",
  important: "Vacib",
  recommended: "Tövsiyə"
};

export const VEHICLE_PHOTO_GUIDE_CATEGORIES: VehiclePhotoGuideCategoryMeta[] = [
  {
    id: "car",
    label: "Avtomobil",
    description: "Sedan, SUV, hatchback, kupe",
    icon: "🚗"
  },
  {
    id: "motorcycle",
    label: "Motosiklet",
    description: "Moto, skuter, moped",
    icon: "🏍️"
  },
  {
    id: "commercial",
    label: "Kommersiya",
    description: "Furqon, pikap, minibus",
    icon: "🚐"
  }
];

const CAR_SHOTS: PhotoGuideShot[] = [
  {
    id: "front-left-34",
    order: 1,
    label: "Ön sol 3/4",
    priority: "essential",
    tip: "Gündüz, kölgəsiz. Ön fara və kuzov xətləri tam görünsün.",
    illustration: "front_left_34"
  },
  {
    id: "front-right-34",
    order: 2,
    label: "Ön sağ 3/4",
    priority: "essential",
    tip: "Əks perspektiv — alıcı bütün ön hissəni qiymətləndirə bilsin.",
    illustration: "front_right_34"
  },
  {
    id: "rear-left-34",
    order: 3,
    label: "Arxa sol 3/4",
    priority: "important",
    tip: "Arxa faralar, spoiler və zədələr aydın görünməlidir.",
    illustration: "rear_left_34"
  },
  {
    id: "rear-right-34",
    order: 4,
    label: "Arxa sağ 3/4",
    priority: "important",
    tip: "Nömrə boşqabı və arxa bufer detalları oxunaqlı olsun.",
    illustration: "rear_right_34"
  },
  {
    id: "left-side",
    order: 5,
    label: "Sol profil",
    priority: "important",
    tip: "Tam boy — ön təkərdən arxa təkərə qədər, düz müstəvi.",
    illustration: "left_side"
  },
  {
    id: "right-side",
    order: 6,
    label: "Sağ profil",
    priority: "important",
    tip: "Sol profil ilə eyni məsafə və işıq şəraitində çəkin.",
    illustration: "right_side"
  },
  {
    id: "front-straight",
    order: 7,
    label: "Ön görünüş",
    priority: "recommended",
    tip: "Simmetrik ön görünüş — radiator barmağı və loqolar net olsun.",
    illustration: "front_straight"
  },
  {
    id: "rear-straight",
    order: 8,
    label: "Arxa görünüş",
    priority: "recommended",
    tip: "Arxa qapı və stop işıqları mərkəzdə, düz bucaqla.",
    illustration: "rear_straight"
  },
  {
    id: "dashboard",
    order: 9,
    label: "Salon / ön panel",
    priority: "important",
    tip: "Sükan, cihazlar paneli, mərkəzi ekran və ön konsol aydın görünsün.",
    illustration: "dashboard"
  },
  {
    id: "rear-seats",
    order: 10,
    label: "Arxa salon",
    priority: "recommended",
    tip: "Arxa oturacaqlar, döşəmə və qapı panelləri — təmizlik vəziyyəti önəmlidir.",
    illustration: "rear_seats"
  },
  {
    id: "odometer",
    order: 11,
    label: "Yürüş sayğacı",
    priority: "important",
    tip: "Kontaktlı, motor işlək vəziyyətdə — rəqəmlər oxunaqlı olmalıdır.",
    illustration: "odometer"
  },
  {
    id: "trunk",
    order: 12,
    label: "Baqaj / yük yeri",
    priority: "important",
    tip: "Baqaj qapağı açıq, ehtiyat təkər və alətlər görünsün.",
    illustration: "trunk"
  },
  {
    id: "engine",
    order: 13,
    label: "Mühərrik bölməsi",
    priority: "recommended",
    tip: "Kapoton açıq — yağ səviyyəsi, sızma və ümumi təmizlik göstərilsin.",
    illustration: "engine"
  },
  {
    id: "damage",
    order: 14,
    label: "Zədə / detal",
    priority: "recommended",
    tip: "Cızıq, əzik və ya rəng fərqi varsa, yaxın planla göstərin — etibar artır.",
    illustration: "damage_detail"
  }
];

const MOTORCYCLE_SHOTS: PhotoGuideShot[] = [
  {
    id: "front-left-34",
    order: 1,
    label: "Ön sol 3/4",
    priority: "essential",
    tip: "Ön fənər, qabaq təkər və tank forması tam görünsün.",
    illustration: "front_left_34"
  },
  {
    id: "rear-right-34",
    order: 2,
    label: "Arxa sağ 3/4",
    priority: "essential",
    tip: "Arxa amortizator, qoruyucu plastik və nömrə boşqabı aydın olsun.",
    illustration: "rear_right_34"
  },
  {
    id: "left-side",
    order: 3,
    label: "Sol profil",
    priority: "important",
    tip: "Tam profil — çərçivə, oturacaq və egzoz xətti bir kadrdə.",
    illustration: "left_side"
  },
  {
    id: "right-side",
    order: 4,
    label: "Sağ profil",
    priority: "important",
    tip: "Əks tərəf — zədə və rəng uyğunluğunu yoxlamaq üçün vacibdir.",
    illustration: "right_side"
  },
  {
    id: "front-straight",
    order: 5,
    label: "Ön görünüş",
    priority: "important",
    tip: "Fənərlər, ön təkər və sükan mövqeyi simmetrik görünsün.",
    illustration: "front_straight"
  },
  {
    id: "rear-straight",
    order: 6,
    label: "Arxa görünüş",
    priority: "important",
    tip: "Arxa stop işıqları və arxa təkər görünməlidir.",
    illustration: "rear_straight"
  },
  {
    id: "dashboard",
    order: 7,
    label: "Göstərici paneli",
    priority: "important",
    tip: "Sürət, yürüş və xəbərdarlıq işıqları — kontaktlı çəkiliş.",
    illustration: "dashboard"
  },
  {
    id: "odometer",
    order: 8,
    label: "Yürüş sayğacı",
    priority: "important",
    tip: "Rəqəmlər oxunaqlı, ekran parlaması olmasın.",
    illustration: "odometer"
  },
  {
    id: "engine",
    order: 9,
    label: "Mühərrik / silindr",
    priority: "recommended",
    tip: "Silindr başlığı, radiator və yağ sızması yoxlanılsın.",
    illustration: "engine"
  },
  {
    id: "chain",
    order: 10,
    label: "Zəncir / əyləc",
    priority: "recommended",
    tip: "Zəncir gərginliyi, əyləc diski və təkər profili yaxın planda.",
    illustration: "chain_detail"
  },
  {
    id: "trunk",
    order: 11,
    label: "Boks / baqaj",
    priority: "recommended",
    tip: "Yan boks və ya arxa baqaj varsa, içindəki vəziyyətlə birlikdə.",
    illustration: "trunk"
  }
];

const COMMERCIAL_SHOTS: PhotoGuideShot[] = [
  {
    id: "front-left-34",
    order: 1,
    label: "Ön sol 3/4",
    priority: "essential",
    tip: "Kabin və yük bölməsinin proporsiyası aydın görünsün.",
    illustration: "front_left_34"
  },
  {
    id: "rear-right-34",
    order: 2,
    label: "Arxa sağ 3/4",
    priority: "essential",
    tip: "Arxa qapılar, bufer və yükləmə hündürlüyü görünməlidir.",
    illustration: "rear_right_34"
  },
  {
    id: "left-side",
    order: 3,
    label: "Sol profil (tam boy)",
    priority: "essential",
    tip: "Bütün uzunluq kadra sığsın — təkərlər və kuzov xətləri net.",
    illustration: "left_side"
  },
  {
    id: "right-side",
    order: 4,
    label: "Sağ profil",
    priority: "important",
    tip: "Yan qapılar, addım və yan güzgülər aydın olsun.",
    illustration: "right_side"
  },
  {
    id: "front-straight",
    order: 5,
    label: "Ön görünüş",
    priority: "important",
    tip: "Kabin ön görünüşü, faralar və ön bufer.",
    illustration: "front_straight"
  },
  {
    id: "rear-straight",
    order: 6,
    label: "Arxa görünüş",
    priority: "important",
    tip: "Arxa qapılar açıq və ya bağlı — hər iki variant faydalıdır.",
    illustration: "rear_straight"
  },
  {
    id: "dashboard",
    order: 7,
    label: "Sürücü kabini",
    priority: "important",
    tip: "Sükan, panel, oturacaq vəziyyəti və kabin təmizliyi.",
    illustration: "dashboard"
  },
  {
    id: "cargo",
    order: 8,
    label: "Yük sahəsi",
    priority: "essential",
    tip: "Yük qutusu içi, döşəmə və yan divarlar — həcmi göstərmək üçün vacib.",
    illustration: "cargo_area"
  },
  {
    id: "odometer",
    order: 9,
    label: "Yürüş sayğacı",
    priority: "important",
    tip: "Yürüş və yanacaq səviyyəsi bir kadrdə mümkünsə.",
    illustration: "odometer"
  },
  {
    id: "engine",
    order: 10,
    label: "Mühərrik",
    priority: "recommended",
    tip: "Kapoton açıq — kommersiya avtomobillərində texniki vəziyyət önəmlidir.",
    illustration: "engine"
  },
  {
    id: "damage",
    order: 11,
    label: "Zədə / korroziya",
    priority: "recommended",
    tip: "Yük döşəməsi, eşik və qapı kənarlarında korroziya varsa göstərin.",
    illustration: "damage_detail"
  }
];

export const VEHICLE_PHOTO_GUIDE_SHOTS: Record<VehiclePhotoGuideCategory, PhotoGuideShot[]> = {
  car: CAR_SHOTS,
  motorcycle: MOTORCYCLE_SHOTS,
  commercial: COMMERCIAL_SHOTS
};

const MOTORCYCLE_BODY_TYPES = new Set(["Motosiklet", "Skuter", "Moped"]);
const COMMERCIAL_BODY_TYPES = new Set(["Van", "Pickup", "Minivan"]);

export function photoGuideCategoryFromBodyType(bodyType: string): VehiclePhotoGuideCategory | null {
  if (!bodyType.trim()) return null;
  if (MOTORCYCLE_BODY_TYPES.has(bodyType)) return "motorcycle";
  if (COMMERCIAL_BODY_TYPES.has(bodyType)) return "commercial";
  return "car";
}
