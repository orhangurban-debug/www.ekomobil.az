/**
 * EkoMobil — Browser-Side Şəkil Emalı (Canvas API)
 *
 * Dəstəklənən giriş formatları: JPEG, PNG, WebP, GIF, BMP, AVIF, HEIC*
 *   (*HEIC: Chrome 120+ / Safari natively handles it before canvas)
 *
 * Çıxış: JPEG, 85% keyfiyyət, max 1280 px (uzun tərəf)
 *
 * Bu modul yalnız client-side-da işləyir ("use client" olan komponentlərdən
 * import edilməlidir). Server-side import etməyin.
 */

/** Sıxılma parametrləri */
export const IMAGE_COMPRESS_CONFIG = {
  /** Çıxış formatı */
  outputMimeType: "image/jpeg" as const,
  /** JPEG sıxılma keyfiyyəti (0-1) */
  quality: 0.85,
  /** Şəklin uzun tərəfinin maksimum piksel ölçüsü */
  maxDimensionPx: 1280,
  /** Kiçik şəkillər yenidən ölçüləndirilib böyüdülmür */
  upscale: false
} as const;

export interface ProcessedImage {
  /** Emal edilmiş fayl (JPEG) */
  file: File;
  /** Orijinal fayl ölçüsü (bytes) */
  originalSizeBytes: number;
  /** Sıxılmadan sonra fayl ölçüsü (bytes) */
  compressedSizeBytes: number;
  /** Sıxılma nisbəti (0-1, aşağı = daha yaxşı sıxılma) */
  compressionRatio: number;
  /** Çıxış genişliyi (px) */
  width: number;
  /** Çıxış hündürlüyü (px) */
  height: number;
  /** Orijinal format (mime type) */
  originalMimeType: string;
  /** Şəkil yenidən ölçüləndirilibsə true */
  wasResized: boolean;
  /** 64-bit perceptual difference hash (hex) */
  perceptualHash: string;
}

export interface ProcessImageError {
  ok: false;
  error: string;
}

export type ProcessImageResult =
  | ({ ok: true } & ProcessedImage)
  | ProcessImageError;

/**
 * Şəkil faylını canvas üzərindən emal edir:
 * 1. Formatı JPEG-ə çevirir
 * 2. Max 1280px-ə ölçüsünü azaldır
 * 3. 85% keyfiyyətlə sıxır
 *
 * @param file - İstifadəçinin seçdiyi fayl (istənilən format)
 * @returns ProcessImageResult
 */
export async function processImageForUpload(
  file: File
): Promise<ProcessImageResult> {
  const cfg = IMAGE_COMPRESS_CONFIG;

  // Fayl tipi yoxlaması
  if (!file.type.startsWith("image/") && !isHEIC(file)) {
    return { ok: false, error: `Dəstəklənməyən fayl tipi: ${file.type || file.name.split(".").pop()}` };
  }

  try {
    const img = await loadImage(file);
    const { width: outW, height: outH, wasResized } = computeOutputDimensions(
      img.naturalWidth,
      img.naturalHeight,
      cfg.maxDimensionPx,
      cfg.upscale
    );

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, error: "Canvas konteksti yaradıla bilmədi" };

    // Ağ fon (şəffaf PNG-lər üçün)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, 0, 0, outW, outH);
    const perceptualHash = computeDHashHex(canvas);

    const blob = await canvasToBlob(canvas, cfg.outputMimeType, cfg.quality);
    if (!blob) return { ok: false, error: "Şəkil çevrilə bilmədi" };

    const outputFilename = toJpegFilename(file.name);
    const processedFile = new File([blob], outputFilename, {
      type: cfg.outputMimeType,
      lastModified: Date.now()
    });

    return {
      ok: true,
      file: processedFile,
      originalSizeBytes: file.size,
      compressedSizeBytes: processedFile.size,
      compressionRatio: processedFile.size / file.size,
      width: outW,
      height: outH,
      originalMimeType: file.type || "image/heic",
      wasResized,
      perceptualHash
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Şəkil emalı zamanı xəta"
    };
  }
}

/**
 * Birdən çox faylı ardıcıl emal edir.
 * Uğurlu nəticələri qaytarır, xətalıları `errors` array-ında bildirir.
 */
export async function processImagesForUpload(
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<{
  results: ProcessedImage[];
  errors: Array<{ filename: string; error: string }>;
}> {
  const results: ProcessedImage[] = [];
  const errors: Array<{ filename: string; error: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const result = await processImageForUpload(files[i]);
    if (result.ok) {
      results.push(result);
    } else {
      errors.push({ filename: files[i].name, error: result.error });
    }
    onProgress?.(i + 1, files.length);
  }

  return { results, errors };
}

/**
 * Fayl ölçüsünü oxunaqlı formata çevirir
 * 1024 → "1.0 KB", 2097152 → "2.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Daxili köməkçi funksiyalar ────────────────────────────────────────────

function isHEIC(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Şəkil yüklənə bilmədi: ${file.name}`));
    };
    img.src = url;
  });
}

function computeOutputDimensions(
  srcW: number,
  srcH: number,
  maxDim: number,
  upscale: boolean
): { width: number; height: number; wasResized: boolean } {
  const longer = Math.max(srcW, srcH);

  if (longer <= maxDim && !upscale) {
    return { width: srcW, height: srcH, wasResized: false };
  }

  if (longer > maxDim) {
    const scale = maxDim / longer;
    return {
      width: Math.round(srcW * scale),
      height: Math.round(srcH * scale),
      wasResized: true
    };
  }

  return { width: srcW, height: srcH, wasResized: false };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

function toJpegFilename(originalName: string): string {
  const base = originalName.replace(/\.[^/.]+$/, "");
  return `${base}.jpg`;
}

function computeDHashHex(sourceCanvas: HTMLCanvasElement): string {
  const w = 9;
  const h = 8;
  const tiny = document.createElement("canvas");
  tiny.width = w;
  tiny.height = h;
  const tinyCtx = tiny.getContext("2d");
  if (!tinyCtx) return "0".repeat(16);
  tinyCtx.drawImage(sourceCanvas, 0, 0, w, h);
  const data = tinyCtx.getImageData(0, 0, w, h).data;
  const bits: number[] = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w - 1; x += 1) {
      const idxA = (y * w + x) * 4;
      const idxB = (y * w + x + 1) * 4;
      const lumA = data[idxA] * 0.299 + data[idxA + 1] * 0.587 + data[idxA + 2] * 0.114;
      const lumB = data[idxB] * 0.299 + data[idxB + 1] * 0.587 + data[idxB + 2] * 0.114;
      bits.push(lumA > lumB ? 1 : 0);
    }
  }
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }
  return hex.padStart(16, "0").slice(0, 16);
}
