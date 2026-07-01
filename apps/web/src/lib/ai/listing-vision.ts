import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BODY_TYPES,
  CAR_MAKES,
  COLORS,
  CONDITIONS,
  DRIVE_TYPES,
  FUEL_TYPES,
  getModelsForMake
} from "@/lib/car-data";
import {
  PART_AUTHENTICITY_OPTIONS,
  PART_BRANDS,
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_SUBCATEGORIES_BY_CATEGORY
} from "@/lib/parts-catalog";
import type {
  ListingAiAnalyzeResult,
  ListingKindForAi,
  PartBulkProductSuggestion,
  PartAiSuggestion,
  VehicleAiSuggestion
} from "@/lib/ai/listing-vision-types";

const GEMINI_MODEL = "gemini-1.5-flash";

async function resolveImageBase64(imageUrl: string, appBaseUrl: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    let buffer: Buffer;
    let mimeType = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      mimeType = match[1];
      buffer = Buffer.from(match[2], "base64");
    } else if (imageUrl.startsWith("/api/support/uploads/file/")) {
      const relative = imageUrl.replace("/api/support/uploads/file/", "");
      const root = process.env.SUPPORT_UPLOADS_DIR || path.join(process.cwd(), ".support-uploads");
      const full = path.join(root, relative);
      buffer = await readFile(full);
      if (relative.toLowerCase().endsWith(".png")) mimeType = "image/png";
      else if (relative.toLowerCase().endsWith(".webp")) mimeType = "image/webp";
    } else if (imageUrl.startsWith("http")) {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = response.headers.get("content-type") || mimeType;
    } else {
      const absolute = new URL(imageUrl, appBaseUrl).toString();
      const response = await fetch(absolute);
      if (!response.ok) return null;
      buffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get("content-type") || mimeType;
    }

    return { mimeType, data: buffer.toString("base64") };
  } catch {
    return null;
  }
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  const exact = allowed.find((item) => item.toLowerCase() === normalized.toLowerCase());
  return exact;
}

function sanitizeVehicle(raw: Record<string, unknown>): VehicleAiSuggestion {
  const make = typeof raw.make === "string" ? raw.make.trim() : undefined;
  const model = typeof raw.model === "string" ? raw.model.trim() : undefined;
  const models = make ? getModelsForMake(make) : [];
  const validModel = model && models.includes(model) ? model : model;

  const media = (raw.mediaAngles ?? {}) as Record<string, unknown>;
  return {
    title: typeof raw.title === "string" ? raw.title.trim() : undefined,
    make: pickEnum(make, CAR_MAKES) ?? make,
    model: validModel,
    year: typeof raw.year === "number" ? Math.round(raw.year) : undefined,
    color: pickEnum(raw.color, COLORS) ?? (typeof raw.color === "string" ? raw.color : undefined),
    bodyType: pickEnum(raw.bodyType, BODY_TYPES) ?? (typeof raw.bodyType === "string" ? raw.bodyType : undefined),
    fuelType: pickEnum(raw.fuelType, FUEL_TYPES) ?? (typeof raw.fuelType === "string" ? raw.fuelType : undefined),
    engineType: typeof raw.engineType === "string" ? raw.engineType : undefined,
    transmission: typeof raw.transmission === "string" ? raw.transmission : undefined,
    driveType: pickEnum(raw.driveType, DRIVE_TYPES) ?? (typeof raw.driveType === "string" ? raw.driveType : undefined),
    vehicleCondition:
      pickEnum(raw.vehicleCondition, CONDITIONS) ??
      (typeof raw.vehicleCondition === "string" ? raw.vehicleCondition : undefined),
    declaredMileageKm:
      typeof raw.declaredMileageKm === "number" ? Math.max(0, Math.round(raw.declaredMileageKm)) : undefined,
    vin: typeof raw.vin === "string" ? raw.vin.trim().toUpperCase().slice(0, 17) : undefined,
    description: typeof raw.description === "string" ? raw.description.trim() : undefined,
    priceAzn: typeof raw.priceAzn === "number" ? Math.max(0, Math.round(raw.priceAzn)) : undefined,
    mediaAngles: {
      hasFrontAngle: media.hasFrontAngle === true,
      hasRearAngle: media.hasRearAngle === true,
      hasLeftSide: media.hasLeftSide === true,
      hasRightSide: media.hasRightSide === true,
      hasDashboard: media.hasDashboard === true,
      hasInterior: media.hasInterior === true,
      hasOdometer: media.hasOdometer === true,
      hasTrunk: media.hasTrunk === true
    },
    fieldConfidence:
      raw.fieldConfidence && typeof raw.fieldConfidence === "object"
        ? (raw.fieldConfidence as Record<string, number>)
        : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : undefined
  };
}

function sanitizePart(raw: Record<string, unknown>): PartAiSuggestion {
  const category =
    pickEnum(raw.partCategory, PART_CATEGORIES) ??
    (typeof raw.partCategory === "string" ? raw.partCategory : undefined);
  const subcategories = category ? PART_SUBCATEGORIES_BY_CATEGORY[category] ?? [] : [];
  const sub =
    pickEnum(raw.partSubcategory, subcategories as readonly string[]) ??
    (typeof raw.partSubcategory === "string" ? raw.partSubcategory : undefined);

  const conditionValues = PART_CONDITIONS.map((item) => item.value);
  const authValues = PART_AUTHENTICITY_OPTIONS.map((item) => item.value);

  return {
    title: typeof raw.title === "string" ? raw.title.trim() : undefined,
    partName: typeof raw.partName === "string" ? raw.partName.trim() : undefined,
    partCategory: category,
    partSubcategory: sub,
    partBrand:
      pickEnum(raw.partBrand, PART_BRANDS) ?? (typeof raw.partBrand === "string" ? raw.partBrand : undefined),
    partCondition: pickEnum(raw.partCondition, conditionValues as readonly ("new" | "used" | "refurbished")[]),
    partAuthenticity: pickEnum(
      raw.partAuthenticity,
      authValues as readonly ("original" | "oem" | "aftermarket")[]
    ),
    partOemCode: typeof raw.partOemCode === "string" ? raw.partOemCode.trim() : undefined,
    partSku: typeof raw.partSku === "string" ? raw.partSku.trim() : undefined,
    partCompatibility: typeof raw.partCompatibility === "string" ? raw.partCompatibility.trim() : undefined,
    description: typeof raw.description === "string" ? raw.description.trim() : undefined,
    priceAzn: typeof raw.priceAzn === "number" ? Math.max(0, Math.round(raw.priceAzn)) : undefined,
    partQuantity: typeof raw.partQuantity === "number" ? Math.max(1, Math.round(raw.partQuantity)) : undefined,
    fieldConfidence:
      raw.fieldConfidence && typeof raw.fieldConfidence === "object"
        ? (raw.fieldConfidence as Record<string, number>)
        : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : undefined
  };
}

async function callGeminiVision(input: {
  prompt: string;
  images: Array<{ mimeType: string; data: string }>;
}): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || input.images.length === 0) return null;

  const parts = [
    ...input.images.map((image) => ({
      inline_data: { mime_type: image.mimeType, data: image.data }
    })),
    { text: input.prompt }
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const VEHICLE_PROMPT = `Sən avtomobil elanı analiz ekspertisən. Şəkillərdən avtomobil haqqında JSON çıxar.
Yalnız şəkildə görünən və ya etiket/salon ekranında oxunan məlumatları yaz. Təxmin etdiyin hər sahə üçün fieldConfidence 0-1 ver.
Kateqoriyalar: make markalarından (${CAR_MAKES.slice(0, 20).join(", ")}...), fuelType: ${FUEL_TYPES.join(", ")}, bodyType: ${BODY_TYPES.join(", ")}.
mediaAngles: hansı rakursların şəkildə olduğunu boolean olaraq qeyd et.
Cavab YALNIZ JSON:
{"title":"","make":"","model":"","year":2020,"color":"","bodyType":"","fuelType":"","transmission":"","driveType":"","vehicleCondition":"","declaredMileageKm":null,"vin":"","description":"","priceAzn":null,"mediaAngles":{"hasFrontAngle":false,"hasRearAngle":false,"hasLeftSide":false,"hasRightSide":false,"hasDashboard":false,"hasInterior":false,"hasOdometer":false,"hasTrunk":false},"fieldConfidence":{},"notes":""}`;

const PART_PROMPT = `Sən avtomobil hissəsi/məhsul elanı analiz ekspertisən. Şəkillərdən məhsul haqqında JSON çıxar.
partCategory seç: ${PART_CATEGORIES.join(" | ")}.
partBrand seç: ${PART_BRANDS.slice(0, 15).join(", ")} və s.
partCondition: new|used|refurbished. partAuthenticity: original|oem|aftermarket.
Yalnız oxunan/ görünən məlumat; fieldConfidence 0-1.
Cavab YALNIZ JSON:
{"title":"","partName":"","partCategory":"","partSubcategory":"","partBrand":"","partCondition":"new","partAuthenticity":"oem","partOemCode":"","partSku":"","partCompatibility":"","description":"","priceAzn":null,"partQuantity":1,"fieldConfidence":{},"notes":""}`;

const PART_BULK_PROMPT = `Sən avtomobil mağazası inventar analiz ekspertisən. Verilən şəkilləri eyni məhsula aid qrupla.
Hər qrup üçün ayrı elan sahələri çıxar. imageIndices 0-based indekslərdir.
partCategory: ${PART_CATEGORIES.join(" | ")}.
Cavab YALNIZ JSON:
{"products":[{"imageIndices":[0,1],"title":"","partName":"","partCategory":"","partSubcategory":"","partBrand":"","partCondition":"new","partAuthenticity":"oem","partOemCode":"","partCompatibility":"","description":"","priceAzn":null,"partQuantity":1,"fieldConfidence":{},"notes":""}]}`;

export async function analyzeListingImages(input: {
  listingKind: ListingKindForAi;
  imageUrls: string[];
  bulkMode?: boolean;
  appBaseUrl: string;
}): Promise<ListingAiAnalyzeResult | null> {
  const maxImages = input.bulkMode ? 30 : 12;
  const urls = input.imageUrls.slice(0, maxImages);
  const encoded: Array<{ mimeType: string; data: string }> = [];
  for (const url of urls) {
    const image = await resolveImageBase64(url, input.appBaseUrl);
    if (image) encoded.push(image);
  }
  if (encoded.length === 0) return null;

  const disclaimer =
    "AI təklifi yalnız kömək üçündür. Yoxlamadan əvvəl bütün sahələri redaktə edin. Məhsul/ avtomobil həqiqətinə uyğunluq satıcının məsuliyyətidir.";

  if (input.listingKind === "vehicle") {
    const raw = await callGeminiVision({ prompt: VEHICLE_PROMPT, images: encoded.slice(0, 8) });
    if (!raw) return null;
    return {
      listingKind: "vehicle",
      vehicle: sanitizeVehicle(raw),
      analyzedImageCount: encoded.length,
      optional: false,
      disclaimer
    };
  }

  if (input.bulkMode && encoded.length > 1) {
    const raw = await callGeminiVision({
      prompt: `${PART_BULK_PROMPT}\n\nÜmumi şəkil sayı: ${encoded.length}. Şəkillər ardıcıl indekslənir 0..${encoded.length - 1}.`,
      images: encoded
    });
    if (!raw || !Array.isArray(raw.products)) return null;
    const bulkProducts = (raw.products as Array<Record<string, unknown>>).map((item) => ({
      ...sanitizePart(item),
      imageIndices: Array.isArray(item.imageIndices)
        ? item.imageIndices.filter((v): v is number => typeof v === "number").map((v) => Math.max(0, Math.floor(v)))
        : []
    })) as PartBulkProductSuggestion[];

    return {
      listingKind: "part",
      bulkProducts,
      analyzedImageCount: encoded.length,
      optional: true,
      disclaimer
    };
  }

  const raw = await callGeminiVision({ prompt: PART_PROMPT, images: encoded.slice(0, 8) });
  if (!raw) return null;
  return {
    listingKind: "part",
    part: sanitizePart(raw),
    analyzedImageCount: encoded.length,
    optional: true,
    disclaimer
  };
}
