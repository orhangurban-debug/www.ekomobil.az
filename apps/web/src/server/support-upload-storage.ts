import { mkdirSync, createReadStream } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

function resolveStorageMode(): "local" | "vercel_blob" {
  const explicit = process.env.SUPPORT_UPLOAD_STORAGE;
  if (explicit === "local") return "local";
  if (explicit === "blob" || explicit === "vercel_blob") return "vercel_blob";
  if (process.env.NODE_ENV === "production") return "vercel_blob";
  return "local";
}

function localRoot(): string {
  return process.env.SUPPORT_UPLOADS_DIR || path.join(process.cwd(), ".support-uploads");
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120);
  return base || "file";
}

/** `full` yolunun həqiqətən `root` qovluğunun içində olduğunu təsdiqləyir (traversal qoruması). */
function isInsideRoot(root: string, full: string): boolean {
  const relative = path.relative(root, full);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

/** Blob pathname təhlükəsizdirmi (traversal yoxdur). */
function isSafeRelativePath(relative: string): boolean {
  if (!relative || relative.includes("..") || relative.startsWith("/")) return false;
  return true;
}

export class UploadStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadStorageError";
  }
}

/** Admin panel / upload UI üçün — saxlama hazırdırmı? */
export function getUploadStorageReadiness(): {
  mode: "local" | "vercel_blob";
  ready: boolean;
  message?: string;
} {
  const mode = resolveStorageMode();
  if (mode === "vercel_blob" && !process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      mode,
      ready: false,
      message:
        "BLOB_READ_WRITE_TOKEN Vercel-də təyin olunmayıb. Project Settings → Storage → Blob → token əlavə edin və redeploy edin."
    };
  }
  return { mode, ready: true };
}

/**
 * Faylı saxlayır. Vercel Blob rejimində fayl **private** yüklənir və daxili
 * proxy route (`/api/support/uploads/file/...`) vasitəsilə token ilə oxunur.
 * Bu, private store ilə də işləyir — ayrıca public store tələb olunmur.
 */
export async function persistSupportUploadFile(input: {
  folder: string;
  fileId: string;
  originalFilename: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ storageBackend: "local" | "vercel_blob"; url: string }> {
  const mode = resolveStorageMode();
  const safeName = sanitizeFilename(input.originalFilename);
  const pathname = `${input.folder}/${input.fileId}-${safeName}`;

  if (mode === "vercel_blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new UploadStorageError(
        "BLOB_READ_WRITE_TOKEN təyin olunmayıb. Vercel → Storage → Blob token əlavə edin."
      );
    }
    try {
      const { put } = await import("@vercel/blob");
      await put(pathname, input.buffer, {
        access: "private",
        token,
        contentType: input.mimeType,
        addRandomSuffix: false
      });
      return { storageBackend: "vercel_blob", url: `/api/support/uploads/file/${pathname}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Vercel Blob yükləməsi uğursuz oldu.";
      throw new UploadStorageError(msg);
    }
  }

  try {
    const root = localRoot();
    const dir = path.join(root, input.folder);
    mkdirSync(dir, { recursive: true });
    const full = path.join(root, pathname);
    await writeFile(full, input.buffer);
    return { storageBackend: "local", url: `/api/support/uploads/file/${pathname}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lokal fayl yazıla bilmədi.";
    throw new UploadStorageError(msg);
  }
}

/**
 * Reklam kreativləri / ana səhifə şəkilləri üçün alias.
 * Fayllar private saxlanır və proxy route üzərindən publik göstərilir.
 */
export const persistPublicMarketingFile = persistSupportUploadFile;

function inferContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".heic") return "image/heic";
  if (ext === ".heif") return "image/heif";
  if (ext === ".svg") return "image/svg+xml";
  return "image/jpeg";
}

/**
 * Saxlanmış faylı oxuyur (proxy serving route üçün).
 * Blob rejimində private blob token ilə oxunur; lokal rejimdə diskdən.
 * Fayl tapılmasa `null` qaytarır.
 */
export async function readSupportUploadFile(
  relativePath: string
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!isSafeRelativePath(relativePath)) return null;
  const mode = resolveStorageMode();

  if (mode === "vercel_blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return null;
    try {
      const { get } = await import("@vercel/blob");
      const result = await get(relativePath, { access: "private", token });
      if (!result || result.statusCode !== 200 || !result.stream) return null;
      return {
        stream: result.stream,
        contentType: result.blob.contentType || inferContentType(relativePath)
      };
    } catch {
      return null;
    }
  }

  const root = localRoot();
  const full = path.resolve(root, relativePath);
  if (!isInsideRoot(root, full)) return null;
  try {
    await access(full);
  } catch {
    return null;
  }
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream<Uint8Array>;
  return { stream, contentType: inferContentType(full) };
}
