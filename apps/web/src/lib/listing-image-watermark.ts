import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WATERMARK_LOGO_CANDIDATES = [
  path.join(process.cwd(), "public", "brand", "ekomobil-mark.png"),
  path.join(process.cwd(), "apps", "web", "public", "brand", "ekomobil-mark.png")
];

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

export interface WatermarkedImageResult {
  buffer: Buffer;
  mimeType: string;
  watermarked: boolean;
}

/**
 * Elan şəkillərinə EkoMobil loqo nişanı vurur (sağ alt künc, şəffaf PNG).
 * Turbo.az istifadəçi yükləmələrində loqo qadağan edir; biz isə saytda göstərilən
 * şəkilləri brendləyirik — oxşar platformalarda (bina.az, tap.az) bu server tərəfində edilir.
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
    const logoSize = Math.max(44, Math.round(shortSide * 0.13));
    const margin = Math.max(10, Math.round(shortSide * 0.022));

    const logo = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .png()
      .toBuffer();

    const logoMeta = await sharp(logo).metadata();
    const logoWidth = logoMeta.width ?? logoSize;
    const logoHeight = logoMeta.height ?? logoSize;

    const left = Math.max(0, meta.width - logoWidth - margin);
    const top = Math.max(0, meta.height - logoHeight - margin);

    const output = await base
      .composite([{ input: logo, left, top, blend: "over" }])
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    return { buffer: output, mimeType: "image/jpeg", watermarked: true };
  } catch {
    return { buffer: inputBuffer, mimeType, watermarked: false };
  }
}
