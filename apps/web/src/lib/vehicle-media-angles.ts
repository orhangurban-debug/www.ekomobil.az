import type { MediaProtocolInput } from "@/lib/media-protocol";

export type VehicleMediaAngleKey = Exclude<
  keyof MediaProtocolInput,
  "imageCount" | "engineVideoDurationSec"
>;

/** İstifadəçinin seçdiyi şəkil növü — protokol bayraqlarından daha ətraflı */
export type ImagePhotoTag =
  | "exterior_front"
  | "exterior_rear"
  | "exterior_left"
  | "exterior_right"
  | "exterior_front_left"
  | "exterior_front_right"
  | "exterior_rear_left"
  | "exterior_rear_right"
  | "interior_dashboard"
  | "interior_front_seats"
  | "interior_rear_seats"
  | "interior_ceiling"
  | "odometer"
  | "trunk"
  | "engine"
  | "wheel"
  | "detail_damage"
  | "other";

export type PhotoTagGroupId = "xarici" | "salon" | "texniki" | "elave";

export interface PhotoTagOption {
  id: ImagePhotoTag;
  label: string;
  shortLabel: string;
  hint: string;
  group: PhotoTagGroupId;
  protocolKey?: VehicleMediaAngleKey;
}

export const PHOTO_TAG_GROUPS: { id: PhotoTagGroupId; label: string }[] = [
  { id: "xarici", label: "Avtomobil tərəfləri" },
  { id: "salon", label: "Salon" },
  { id: "texniki", label: "Texniki" },
  { id: "elave", label: "Əlavə şəkillər" }
];

export const IMAGE_PHOTO_TAG_OPTIONS: PhotoTagOption[] = [
  {
    id: "exterior_front",
    label: "Ön tərəf",
    shortLabel: "Ön tərəf",
    hint: "Düz ön və ya ön 3/4 rakurs",
    group: "xarici",
    protocolKey: "hasFrontAngle"
  },
  {
    id: "exterior_rear",
    label: "Arxa tərəf",
    shortLabel: "Arxa tərəf",
    hint: "Düz arxa və ya arxa 3/4 rakurs",
    group: "xarici",
    protocolKey: "hasRearAngle"
  },
  {
    id: "exterior_left",
    label: "Sol tərəf (profil)",
    shortLabel: "Sol profil",
    hint: "Tam sol tərəf, düz müstəvi",
    group: "xarici",
    protocolKey: "hasLeftSide"
  },
  {
    id: "exterior_right",
    label: "Sağ tərəf (profil)",
    shortLabel: "Sağ profil",
    hint: "Tam sağ tərəf, düz müstəvi",
    group: "xarici",
    protocolKey: "hasRightSide"
  },
  {
    id: "exterior_front_left",
    label: "Ön-sol (3/4)",
    shortLabel: "Ön-Sol",
    hint: "Ön-sol 3/4 rakurs — ən çox istifadə edilən satış rakursu",
    group: "xarici",
    protocolKey: "hasFrontAngle"
  },
  {
    id: "exterior_front_right",
    label: "Ön-sağ (3/4)",
    shortLabel: "Ön-Sağ",
    hint: "Ön-sağ 3/4 rakurs",
    group: "xarici",
    protocolKey: "hasFrontAngle"
  },
  {
    id: "exterior_rear_left",
    label: "Arxa-sol (3/4)",
    shortLabel: "Arxa-Sol",
    hint: "Arxa-sol 3/4 rakurs",
    group: "xarici",
    protocolKey: "hasRearAngle"
  },
  {
    id: "exterior_rear_right",
    label: "Arxa-sağ (3/4)",
    shortLabel: "Arxa-Sağ",
    hint: "Arxa-sağ 3/4 rakurs",
    group: "xarici",
    protocolKey: "hasRearAngle"
  },
  {
    id: "interior_dashboard",
    label: "Sükan və cihazlar paneli",
    shortLabel: "Sükan paneli",
    hint: "Sükan, tablo, ekran və düymələr — ön panel deyil, daxili idarəetmə sahəsi",
    group: "salon",
    protocolKey: "hasDashboard"
  },
  {
    id: "interior_front_seats",
    label: "Ön oturacaqlar",
    shortLabel: "Ön oturacaq",
    hint: "Ön oturacaqlar və torpedo ətrafı",
    group: "salon",
    protocolKey: "hasInterior"
  },
  {
    id: "interior_rear_seats",
    label: "Arxa oturacaqlar",
    shortLabel: "Arxa oturacaq",
    hint: "Arxa oturacaqlar və arxa salon sahəsi",
    group: "salon",
    protocolKey: "hasInterior"
  },
  {
    id: "interior_ceiling",
    label: "Tavan / lyuk",
    shortLabel: "Tavan",
    hint: "Tavan, lyuk və ya arxa baxış güzgüsü",
    group: "salon",
    protocolKey: "hasInterior"
  },
  {
    id: "odometer",
    label: "Yürüş sayğacı",
    shortLabel: "Yürüş",
    hint: "Odometr rəqəmləri oxunaqlı",
    group: "texniki",
    protocolKey: "hasOdometer"
  },
  {
    id: "trunk",
    label: "Baqaj / yük yeri",
    shortLabel: "Baqaj",
    hint: "Baqaj və ya yük sahəsi açıq",
    group: "texniki",
    protocolKey: "hasTrunk"
  },
  {
    id: "engine",
    label: "Mühərrik bölməsi",
    shortLabel: "Mühərrik",
    hint: "Kapot açıq, mühərrik görünüşü",
    group: "texniki"
  },
  {
    id: "wheel",
    label: "Təkər / disk",
    shortLabel: "Təkər",
    hint: "Təkər, disk və ya təkər profili",
    group: "elave"
  },
  {
    id: "detail_damage",
    label: "Detal / zədə",
    shortLabel: "Zədə",
    hint: "Cızıq, əzik, zədə və ya xüsusi detal",
    group: "elave"
  },
  {
    id: "other",
    label: "Digər şəkil",
    shortLabel: "Digər",
    hint: "Yuxarıdakı növlərə uyğun gəlmirsə",
    group: "elave"
  }
];

/** Media protokolunun 8 tövsiyə olunan rakursu — soft checklist / trust üçün */
export const PROTOCOL_REQUIREMENT_OPTIONS: {
  key: VehicleMediaAngleKey;
  shortLabel: string;
  hint: string;
}[] = [
  { key: "hasFrontAngle", shortLabel: "Ön tərəf", hint: "Ön tərəfin şəkli" },
  { key: "hasRearAngle", shortLabel: "Arxa tərəf", hint: "Arxa tərəfin şəkli" },
  { key: "hasLeftSide", shortLabel: "Sol profil", hint: "Sol tərəfin şəkli" },
  { key: "hasRightSide", shortLabel: "Sağ profil", hint: "Sağ tərəfin şəkli" },
  {
    key: "hasDashboard",
    shortLabel: "Sükan paneli",
    hint: "Sükan və cihazlar panelinin şəkli"
  },
  {
    key: "hasInterior",
    shortLabel: "Salon",
    hint: "Ön oturacaq, arxa oturacaq və ya tavan"
  },
  { key: "hasOdometer", shortLabel: "Yürüş", hint: "Yürüş sayğacının şəkli" },
  { key: "hasTrunk", shortLabel: "Baqaj", hint: "Baqajın şəkli" }
];

/** Ana şəkil (üz qabığı) üçün icazə verilən xarici istiqamətlər */
export const COVER_PHOTO_TAGS: ImagePhotoTag[] = [
  "exterior_front_left",
  "exterior_front",
  "exterior_front_right",
  "exterior_left",
  "exterior_right",
  "exterior_rear_left",
  "exterior_rear_right",
  "exterior_rear"
];

export const DEFAULT_COVER_PHOTO_TAG: ImagePhotoTag = "exterior_front_left";

export function isCoverPhotoTag(tag: string | null | undefined): tag is ImagePhotoTag {
  return Boolean(tag && (COVER_PHOTO_TAGS as string[]).includes(tag));
}

export function coverPhotoMissingMessage(): string {
  return "Ana şəkil üçün istiqamət seçin (ön, yan və ya arxa rakurs).";
}

/** @deprecated Köhnə API uyğunluğu — yeni kod IMAGE_PHOTO_TAG_OPTIONS istifadə etsin */
export const VEHICLE_MEDIA_ANGLE_OPTIONS = PROTOCOL_REQUIREMENT_OPTIONS.map((item) => ({
  key: item.key,
  label: item.hint,
  shortLabel: item.shortLabel,
  hint: item.hint
}));

const LEGACY_ANGLE_TO_PHOTO_TAG: Record<VehicleMediaAngleKey, ImagePhotoTag> = {
  hasFrontAngle: "exterior_front",
  hasRearAngle: "exterior_rear",
  hasLeftSide: "exterior_left",
  hasRightSide: "exterior_right",
  hasDashboard: "interior_dashboard",
  hasInterior: "interior_front_seats",
  hasOdometer: "odometer",
  hasTrunk: "trunk"
};

export function legacyAngleToPhotoTag(key: VehicleMediaAngleKey): ImagePhotoTag {
  return LEGACY_ANGLE_TO_PHOTO_TAG[key];
}

export function photoTagOption(tag: ImagePhotoTag): PhotoTagOption | undefined {
  return IMAGE_PHOTO_TAG_OPTIONS.find((item) => item.id === tag);
}

export function photoTagLabel(tag: ImagePhotoTag): string {
  return photoTagOption(tag)?.shortLabel ?? tag;
}

export function buildMediaAnglesFromTags(
  tags: Array<ImagePhotoTag | null>,
  imageCount: number,
  prev: MediaProtocolInput
): MediaProtocolInput {
  const protocolKeys = new Set<VehicleMediaAngleKey>();
  for (const tag of tags) {
    if (!tag) continue;
    const option = photoTagOption(tag);
    if (option?.protocolKey) protocolKeys.add(option.protocolKey);
  }

  return {
    ...prev,
    imageCount,
    hasFrontAngle: protocolKeys.has("hasFrontAngle"),
    hasRearAngle: protocolKeys.has("hasRearAngle"),
    hasLeftSide: protocolKeys.has("hasLeftSide"),
    hasRightSide: protocolKeys.has("hasRightSide"),
    hasDashboard: protocolKeys.has("hasDashboard"),
    hasInterior: protocolKeys.has("hasInterior"),
    hasOdometer: protocolKeys.has("hasOdometer"),
    hasTrunk: protocolKeys.has("hasTrunk")
  };
}

/** @deprecated photoTagLabel istifadə edin */
export function mediaAngleLabel(key: VehicleMediaAngleKey): string {
  return PROTOCOL_REQUIREMENT_OPTIONS.find((item) => item.key === key)?.shortLabel ?? key;
}

export function applyAiImageTagsToAngleList(
  imageCount: number,
  imageTags: Array<{ index: number; angle: VehicleMediaAngleKey | null }> | undefined,
  fallbackAngles?: Partial<Record<VehicleMediaAngleKey, boolean>>
): Array<ImagePhotoTag | null> {
  const next = Array.from({ length: imageCount }, () => null as ImagePhotoTag | null);

  if (imageTags?.length) {
    for (const tag of imageTags) {
      if (tag.index < 0 || tag.index >= imageCount || !tag.angle) continue;
      next[tag.index] = legacyAngleToPhotoTag(tag.angle);
    }
    return next;
  }

  if (fallbackAngles) {
    const priority: VehicleMediaAngleKey[] = [
      "hasFrontAngle",
      "hasRearAngle",
      "hasLeftSide",
      "hasRightSide",
      "hasDashboard",
      "hasInterior",
      "hasOdometer",
      "hasTrunk"
    ];
    let cursor = 0;
    for (const key of priority) {
      if (!fallbackAngles[key]) continue;
      while (cursor < next.length && next[cursor]) cursor += 1;
      if (cursor >= next.length) break;
      next[cursor] = legacyAngleToPhotoTag(key);
      cursor += 1;
    }
  }

  return next;
}

/** Elan kartı və qalereya üçün şəkil sıralaması — ön xarici görüntü həmişə birinci */
export const LISTING_IMAGE_TAG_DISPLAY_ORDER: ImagePhotoTag[] = [
  "exterior_front",
  "exterior_front_left",
  "exterior_front_right",
  "exterior_left",
  "exterior_right",
  "exterior_rear_left",
  "exterior_rear_right",
  "exterior_rear",
  "wheel",
  "engine",
  "interior_dashboard",
  "interior_front_seats",
  "interior_rear_seats",
  "interior_ceiling",
  "odometer",
  "trunk",
  "detail_damage",
  "other"
];

export function listingPhotoTagSortRank(tag: ImagePhotoTag | null | undefined): number {
  if (!tag) return 100;
  const index = LISTING_IMAGE_TAG_DISPLAY_ORDER.indexOf(tag);
  return index >= 0 ? index : 90;
}

/** SQL: listing_media üzrə üzlük şəkli və qalereya sıralaması */
export const LISTING_MEDIA_DISPLAY_ORDER_SQL = `
  CASE COALESCE(lm.photo_tag, '')
    WHEN 'exterior_front'       THEN 0
    WHEN 'exterior_front_left'  THEN 1
    WHEN 'exterior_front_right' THEN 2
    WHEN 'exterior_left'        THEN 3
    WHEN 'exterior_right'       THEN 4
    WHEN 'exterior_rear_left'   THEN 5
    WHEN 'exterior_rear_right'  THEN 6
    WHEN 'exterior_rear'        THEN 7
    WHEN 'wheel'                THEN 8
    WHEN 'engine'               THEN 9
    WHEN 'interior_dashboard'   THEN 20
    WHEN 'interior_front_seats' THEN 21
    WHEN 'interior_rear_seats'  THEN 22
    WHEN 'interior_ceiling'     THEN 23
    WHEN 'odometer'             THEN 24
    WHEN 'trunk'                THEN 25
    WHEN 'detail_damage'        THEN 30
    WHEN 'other'                THEN 31
    ELSE 40
  END,
  lm.sort_order ASC
`;

export function reorderListingImageArrays(
  imageUrls: string[],
  imageHashes: string[],
  tags: Array<ImagePhotoTag | null | undefined>
): { imageUrls: string[]; imageHashes: string[]; photoTags: Array<ImagePhotoTag | null> } {
  if (imageUrls.length === 0) {
    return { imageUrls: [], imageHashes: [], photoTags: [] };
  }

  // Ana şəkil (ilk yüklənən) həmişə üzlükdə qalır — digərləri rakurs sırası ilə düzülür.
  const cover = {
    url: imageUrls[0],
    hash: imageHashes[0] ?? "",
    tag: (tags[0] ?? null) as ImagePhotoTag | null
  };
  const rest = imageUrls.slice(1).map((url, offset) => {
    const index = offset + 1;
    return {
      url,
      hash: imageHashes[index] ?? "",
      tag: (tags[index] ?? null) as ImagePhotoTag | null,
      index
    };
  });
  rest.sort(
    (a, b) => listingPhotoTagSortRank(a.tag) - listingPhotoTagSortRank(b.tag) || a.index - b.index
  );

  const ordered = [cover, ...rest];
  return {
    imageUrls: ordered.map((item) => item.url),
    imageHashes: ordered.map((item) => item.hash),
    photoTags: ordered.map((item) => item.tag)
  };
}
