import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { LISTING_WATERMARK } from "@/lib/listing-watermark";

const WATERMARK_LOGO_CANDIDATES = LISTING_WATERMARK.fileNames.flatMap((fileName) => [
  path.join(process.cwd(), "public", "brand", fileName),
  path.join(process.cwd(), "apps", "web", "public", "brand", fileName)
]);

let cachedLogoPath: string | null | undefined;

async function resolveWatermarkLogoPath(): Promise<string | null> {
  if (cachedLogoPath !== undefined) return cachedLogoPath;
  for (const candidate of WATERMARK_LOGO_CANDIDATES) {
    try {
      await access(candidate);
      cachedLogoPath = candidate;
      return candidate;
    } catch {
      // try next
    }
  }
  cachedLogoPath = null;
  return null;
}

async function applyLogoOpacity(logoBuffer: Buffer, opacity: number): Promise<Buffer> {
  const { data, info } = await sharp(logoBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * opacity);
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .png()
    .toBuffer();
}

function roundedBackdropSvg(width: number, height: number, opacity: number): Buffer {
  const radius = Math.max(6, Math.round(Math.min(width, height) * 0.18));
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="${radius}" fill="rgba(8,15,30,${opacity})"/>
    </svg>`
  );
}

export interface WatermarkedImageResult {
  buffer: Buffer;
  mimeType: string;
  watermarked: boolean;
}

/**
 * Elan şəkillərinə EkoMobil wordmark loqosu vurur (sağ alt, şəffaf).
 * Yükləmə zamanı server tərəfində tətbiq olunur — paylaşılan URL-lərdə də görünür.
 */
export async function applyListingImageWatermark(
  inputBuffer: Buffer,
  mimeType = "image/jpeg"
): Promise<WatermarkedImageResult> {
  const logoPath = await resolveWatermarkLogoPath();
  if (!logoPath) {
    return { buffer: inputBuffer, mimeType, watermarked: false };
  }

  try {
    const base = sharp(inputBuffer, { failOn: "none" }).rotate();
    const meta = await base.metadata();
    if (!meta.width || !meta.height) {
      return { buffer: inputBuffer, mimeType, watermarked: false };
    }

    const shortSide = Math.min(meta.width, meta.height);
    const margin = Math.max(
      LISTING_WATERMARK.minMarginPx,
      Math.round(shortSide * LISTING_WATERMARK.marginRatio)
    );
    const targetLogoWidth = Math.min(
      LISTING_WATERMARK.maxWidthPx,
      Math.max(LISTING_WATERMARK.minWidthPx, Math.round(meta.width * LISTING_WATERMARK.widthRatio))
    );

    const logoRaw = await sharp(logoPath)
      .resize({ width: targetLogoWidth, withoutEnlargement: true })
      .ensureAlpha()
      .png()
      .toBuffer();

    const logo = await applyLogoOpacity(logoRaw, LISTING_WATERMARK.opacity);
    const logoMeta = await sharp(logo).metadata();
    const logoWidth = logoMeta.width ?? targetLogoWidth;
    const logoHeight = logoMeta.height ?? Math.round(targetLogoWidth * 0.32);

    const padX = Math.max(8, Math.round(logoWidth * LISTING_WATERMARK.backdropPaddingRatio));
    const padY = Math.max(6, Math.round(logoHeight * LISTING_WATERMARK.backdropPaddingRatio));
    const backdropWidth = logoWidth + padX * 2;
    const backdropHeight = logoHeight + padY * 2;

    const backdrop = await sharp(roundedBackdropSvg(backdropWidth, backdropHeight, LISTING_WATERMARK.backdropOpacity))
      .png()
      .toBuffer();

    const backdropLeft = Math.max(0, meta.width - backdropWidth - margin);
    const backdropTop = Math.max(0, meta.height - backdropHeight - margin);
    const logoLeft = backdropLeft + padX;
    const logoTop = backdropTop + padY;

    const output = await base
      .composite([
        { input: backdrop, left: backdropLeft, top: backdropTop, blend: "over" },
        { input: logo, left: logoLeft, top: logoTop, blend: "over" }
      ])
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();

    return { buffer: output, mimeType: "image/jpeg", watermarked: true };
  } catch {
    return { buffer: inputBuffer, mimeType, watermarked: false };
  }
}
