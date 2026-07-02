import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

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

export async function persistSupportUploadFile(input: {
  folder: string;
  fileId: string;
  originalFilename: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ storageBackend: "local" | "vercel_blob"; url: string }> {
  const mode = resolveStorageMode();
  const safeName = sanitizeFilename(input.originalFilename);

  if (mode === "vercel_blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new UploadStorageError(
        "BLOB_READ_WRITE_TOKEN təyin olunmayıb. Vercel → Storage → Blob token əlavə edin."
      );
    }
    try {
      const { put } = await import("@vercel/blob");
      const pathname = `${input.folder}/${input.fileId}-${safeName}`;
      const result = await put(pathname, input.buffer, {
        access: "public",
        token,
        contentType: input.mimeType,
        addRandomSuffix: false
      });
      return { storageBackend: "vercel_blob", url: result.url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Vercel Blob yükləməsi uğursuz oldu.";
      throw new UploadStorageError(msg);
    }
  }

  try {
    const root = localRoot();
    const dir = path.join(root, input.folder);
    mkdirSync(dir, { recursive: true });
    const relative = `${input.folder}/${input.fileId}-${safeName}`;
    const full = path.join(root, relative);
    await writeFile(full, input.buffer);
    return { storageBackend: "local", url: `/api/support/uploads/file/${relative}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lokal fayl yazıla bilmədi.";
    throw new UploadStorageError(msg);
  }
}
