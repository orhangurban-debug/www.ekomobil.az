/**
 * Zod schemas for all critical API inputs.
 * Centralised here to keep route handlers clean.
 */

import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid("Yanlış UUID formatı");
export const aznAmountSchema = z
  .number()
  .positive("Məbləğ müsbət olmalıdır")
  .max(10_000_000, "Məbləğ 10,000,000 ₼-dən çox ola bilməz")
  .multipleOf(0.01, "Məbləğ maksimum 2 onluq rəqəmlə ifadə edilməlidir");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .email("Düzgün email daxil edin")
    .max(320, "Email çox uzundur")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Şifrə boş ola bilməz")
    .max(1024, "Şifrə çox uzundur"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .email("Düzgün email daxil edin")
    .max(320, "Email çox uzundur")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Şifrə ən az 8 simvol olmalıdır")
    .max(1024, "Şifrə çox uzundur"),
  fullName: z.string().max(100, "Ad çox uzundur").trim().optional(),
  city: z.string().max(80, "Şəhər adı çox uzundur").trim().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{6,20}$/, "Düzgün telefon nömrəsi daxil edin")
    .optional(),
});

// ─── Auction Create ───────────────────────────────────────────────────────────

export const createAuctionSchema = z
  .object({
    listingId: uuidSchema,
    mode: z.enum(["ascending", "reserve"]).optional(),
    startingBidAzn: aznAmountSchema.optional(),
    reservePriceAzn: aznAmountSchema.optional(),
    buyNowPriceAzn: aznAmountSchema.optional(),
    startsAt: z
      .string()
      .datetime({ message: "Yanlış tarix formatı" })
      .optional(),
    endsAt: z
      .string()
      .datetime({ message: "Yanlış tarix formatı" })
      .optional(),
    depositRequired: z.boolean().optional(),
    depositAmountAzn: aznAmountSchema.optional(),
    sellerBondRequired: z.boolean().optional(),
    sellerBondAmountAzn: aznAmountSchema.optional(),
    vinInfoUrl: z.string().url("VIN linki düzgün URL formatında olmalıdır").max(500).optional(),
    serviceHistoryUrl: z.string().url("Servis tarixçəsi linki düzgün URL formatında olmalıdır").max(500).optional(),
    vinDocumentRef: z.string().trim().max(500, "VIN sənəd istinadı çox uzundur").optional(),
    serviceHistoryDocumentRef: z.string().trim().max(500, "Servis tarixçəsi sənəd istinadı çox uzundur").optional(),
    /** Satıcı şərt qəbul checkboxları tamamlandı — server tərəfindən qeyd üçün tələb olunur */
    sellerTermsAccepted: z.literal(true, {
      errorMap: () => ({ message: "Auksion şərtlərini qəbul etmədən lot yerləşdirə bilməzsiniz" })
    })
  })
  .refine(
    (data) =>
      !data.startsAt || !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt),
    { message: "Bitmə vaxtı başlanğıcdan sonra olmalıdır" }
  )
  .refine(
    (data) =>
      !data.reservePriceAzn ||
      !data.startingBidAzn ||
      data.reservePriceAzn >= data.startingBidAzn,
    { message: "Rezerv qiyməti başlanğıc qiymətdən böyük olmalıdır" }
  )
  .refine(
    (data) => !data.sellerBondRequired || !!data.sellerBondAmountAzn,
    { message: "Satıcı bond aktivdirsə, bond məbləği daxil edilməlidir" }
  );

// ─── Bid ──────────────────────────────────────────────────────────────────────

export const placeBidSchema = z.object({
  amountAzn: aznAmountSchema,
  autoBidMaxAzn: aznAmountSchema.optional(),
}).refine(
  (data) => !data.autoBidMaxAzn || data.autoBidMaxAzn >= data.amountAzn,
  { message: "Maksimum avtomatik bid cari biddən az ola bilməz" }
);

// ─── Confirm sale ─────────────────────────────────────────────────────────────

export const confirmSaleSchema = z.object({
  actorRole: z.enum(["buyer", "seller"]),
  outcome: z.enum(["confirmed", "no_show", "seller_breach", "disputed"]),
  note: z.string().max(1000, "Qeyd çox uzundur").optional(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const auctionPaymentSchema = z.object({
  auctionId: uuidSchema,
  note: z.string().max(500).optional(),
});

export const deepKycSubmitSchema = z.object({
  legalName: z.string().trim().min(3, "Hüquqi ad ən az 3 simvol olmalıdır").max(120, "Hüquqi ad çox uzundur"),
  nationalIdLast4: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "Ş/V nömrəsinin son 4 rəqəmini daxil edin"),
  documentRef: z.string().trim().max(500, "Sənəd istinadı çox uzundur").optional(),
});

export const deepKycReviewSchema = z.object({
  userId: uuidSchema,
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500, "Qeyd çox uzundur").optional(),
});

// ─── File upload ──────────────────────────────────────────────────────────────

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Magic bytes for file type verification (defense against renamed executables)
const MAGIC_BYTES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/jpg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF (check WEBP at offset 8)
];

export function validateFileMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const mime = declaredMime.toLowerCase();

  // For WebP: check RIFF header + WEBP marker at offset 8
  if (mime === "image/webp") {
    if (buffer.length < 12) return false;
    const riff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
    const webp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
    return riff && webp;
  }

  // HEIC/HEIF: ftyp box at offset 4, brand includes heic/heif/mif1/msf1
  if (mime === "image/heic" || mime === "image/heif") {
    if (buffer.length < 12) return false;
    const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    return ["heic", "heif", "mif1", "msf1", "heix", "hevc"].some((b) => brand.includes(b));
  }

  const magic = MAGIC_BYTES.find((m) => m.mime === mime);
  if (!magic) return true; // Unknown type — skip magic check (permissive)

  const offset = magic.offset ?? 0;
  if (buffer.length < offset + magic.bytes.length) return false;
  return magic.bytes.every((byte, i) => buffer[offset + i] === byte);
}

export function validateDocumentFilename(filename: string): { ok: boolean; error?: string } {
  if (!filename || filename.length > 200) {
    return { ok: false, error: "Fayl adı keçərsizdir" };
  }

  // Block double extensions like file.jpg.exe
  const parts = filename.split(".");
  if (parts.length > 2) {
    const allExts = parts.slice(1).map((p) => `.${p.toLowerCase()}`);
    const dangerous = [".exe", ".bat", ".cmd", ".sh", ".php", ".py", ".js", ".mjs", ".cjs", ".rb", ".pl", ".ps1", ".psm1", ".dll", ".so", ".dylib", ".com", ".vbs", ".hta", ".jar", ".war", ".class"];
    if (allExts.some((ext) => dangerous.includes(ext))) {
      return { ok: false, error: "Bu fayl növü qəbul edilmir" };
    }
  }

  const ext = filename.includes(".")
    ? `.${filename.split(".").pop()!.toLowerCase()}`
    : "";
  const allowed = ALLOWED_DOCUMENT_EXTENSIONS as readonly string[];
  if (!allowed.includes(ext)) {
    return { ok: false, error: `Yalnız icazə verilən fayl növləri: ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}` };
  }

  return { ok: true };
}

/** Parse and validate Zod schema, return typed data or throw formatted error message */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Zod v4: use .issues array
    const issues = (result.error as { issues?: Array<{ message: string }> }).issues;
    const first = issues?.[0];
    throw new ValidationError(first?.message ?? "Giriş məlumatları yanlışdır");
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
