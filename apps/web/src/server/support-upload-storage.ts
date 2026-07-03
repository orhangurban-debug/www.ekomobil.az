import { mkdirSync, createReadStream } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
  return (name.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120)) || "file";
}

/** Traversal guard for local filesystem paths. */
function isInsideRoot(root: string, full: string): boolean {
  const rel = path.relative(root, full);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

// ---------------------------------------------------------------------------
// Encoding helpers — the proxy embeds the blob URL in a URL-safe base64 segment
// so we never have to reconstruct it from a pathname.
// ---------------------------------------------------------------------------

const PROXY_ORIGIN_PREFIX = "/api/support/uploads/file/";

/**
 * Encodes a Vercel Blob URL as a proxy-safe path:
 *   /api/support/uploads/file/<folder>/<base64url-encoded-full-blob-url>
 *
 * Keeping the folder as the first segment lets the proxy route decide
 * auth requirements (PUBLIC_FOLDERS) without decoding.
 */
function encodeProxyUrl(folder: string, blobUrl: string): string {
  const encoded = Buffer.from(blobUrl, "utf8").toString("base64url");
  return `${PROXY_ORIGIN_PREFIX}${folder}/${encoded}`;
}

/**
 * Decodes a proxy path produced by encodeProxyUrl.
 * Returns { folder, blobUrl } or null if the segment is not base64url-encoded
 * (older entries or local-mode paths).
 */
export function decodeProxyPath(
  parts: string[]
): { folder: string; blobUrl: string | null; localRelative: string } {
  const folder = parts[0] ?? "";
  const localRelative = parts.join("/");

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    // base64url alphabet: A-Z a-z 0-9 - _  (no . or /)
    // A typical uuid-based filename like "uuid-file.jpg" contains a "." and is NOT base64url.
    // An encoded blob URL never contains "." in the segment (dots exist inside the URL but are
    // encoded away by base64url). We use this to distinguish old from new entries.
    if (/^[A-Za-z0-9_-]{40,}$/.test(last)) {
      try {
        const decoded = Buffer.from(last, "base64url").toString("utf8");
        if (decoded.startsWith("https://")) {
          return { folder, blobUrl: decoded, localRelative };
        }
      } catch {
        // fall through
      }
    }
  }

  return { folder, blobUrl: null, localRelative };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class UploadStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadStorageError";
  }
}

/** Reports whether the upload backend is ready. */
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
        "BLOB_READ_WRITE_TOKEN Vercel-də təyin olunmayıb. " +
        "Project Settings → Storage → Blob mağazasını layihəyə qoşun (read-write token seçimi ilə)."
    };
  }
  return { mode, ready: true };
}

/**
 * Persists a support/marketing file and returns a proxy URL that can be
 * stored in the database and resolved by the file-serving route.
 *
 * In Vercel Blob mode the file is stored with `access: "private"` so it
 * works on both private and public stores.  The full Vercel Blob URL is
 * embedded (base64url-encoded) in the proxy URL so the serving route can
 * always call `get(fullUrl, ...)` — no pathname reconstruction needed.
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
      const result = await put(pathname, input.buffer, {
        access: "private",
        token,
        contentType: input.mimeType,
        addRandomSuffix: false
      });
      // Embed the real blob URL so the proxy never has to guess it.
      return {
        storageBackend: "vercel_blob",
        url: encodeProxyUrl(input.folder, result.url)
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Vercel Blob yükləməsi uğursuz oldu.";
      throw new UploadStorageError(msg);
    }
  }

  // Local filesystem
  try {
    const root = localRoot();
    const dir = path.join(root, input.folder);
    mkdirSync(dir, { recursive: true });
    const full = path.join(root, pathname);
    await writeFile(full, input.buffer);
    return { storageBackend: "local", url: `${PROXY_ORIGIN_PREFIX}${pathname}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lokal fayl yazıla bilmədi.";
    throw new UploadStorageError(msg);
  }
}

/** Alias used by the admin marketing upload route. */
export const persistPublicMarketingFile = persistSupportUploadFile;

// ---------------------------------------------------------------------------
// Serving helper used by the proxy route
// ---------------------------------------------------------------------------

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
 * Reads a stored upload and returns a streamable response payload.
 * Returns `null` when the file is not found or an error occurs.
 *
 * `parts` is the `[...path]` segment array from the Next.js route, e.g.
 *   ["home-content", "<base64url-blob-url>"]
 *   ["listing-images", "uuid-file.jpg"]   ← legacy local-mode path
 */
export async function readSupportUploadStream(
  parts: string[]
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  const { folder, blobUrl, localRelative } = decodeProxyPath(parts);
  const mode = resolveStorageMode();

  if (mode === "vercel_blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error("[upload-proxy] BLOB_READ_WRITE_TOKEN not set");
      return null;
    }
    try {
      const { get } = await import("@vercel/blob");
      // Prefer the full blob URL embedded in the proxy path; fall back to
      // pathname reconstruction (handles legacy rows in the database).
      const urlOrPathname = blobUrl ?? localRelative;
      const result = await get(urlOrPathname, { access: "private", token });
      if (!result || result.statusCode !== 200 || !result.stream) {
        console.error(`[upload-proxy] blob not found or non-200: ${urlOrPathname}`);
        return null;
      }
      return {
        stream: result.stream,
        contentType: result.blob.contentType || inferContentType(folder)
      };
    } catch (err) {
      console.error(`[upload-proxy] get() failed for folder=${folder}:`, err);
      return null;
    }
  }

  // Local filesystem
  const root = localRoot();
  const full = path.resolve(root, localRelative);
  if (!isInsideRoot(root, full)) {
    console.error(`[upload-proxy] path traversal attempt: ${localRelative}`);
    return null;
  }
  try {
    await access(full);
  } catch {
    return null;
  }
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream<Uint8Array>;
  return { stream, contentType: inferContentType(full) };
}
