import { mkdirSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { AuctionDocumentStorageBackend } from "@/lib/auction-documents";

function resolveStorageMode(): "local" | "vercel_blob" {
  const explicit = process.env.AUCTION_DOCUMENT_STORAGE;
  if (explicit === "local") return "local";
  if (explicit === "blob" || explicit === "vercel_blob") return "vercel_blob";
  if (process.env.NODE_ENV === "production") return "vercel_blob";
  return "local";
}

export function getAuctionDocumentStorageMode(): "local" | "vercel_blob" {
  return resolveStorageMode();
}

function localRoot(): string {
  return process.env.AUCTION_DOCUMENTS_DIR || path.join(process.cwd(), ".auction-documents");
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 120);
  return base || "file";
}

export async function persistAuctionDocumentFile(input: {
  auctionId: string;
  documentId: string;
  originalFilename: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{ storageBackend: AuctionDocumentStorageBackend; storageRef: string }> {
  const mode = resolveStorageMode();
  const safeName = sanitizeFilename(input.originalFilename);

  if (mode === "vercel_blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN təyin olunmayıb — production üçün Vercel Blob token lazımdır.");
    }
    const { put } = await import("@vercel/blob");
    const pathname = `auction-listing-docs/${input.auctionId}/${input.documentId}-${safeName}`;
    const result = await put(pathname, input.buffer, {
      access: "private",
      token,
      contentType: input.mimeType,
      addRandomSuffix: false
    });
    return { storageBackend: "vercel_blob", storageRef: result.url };
  }

  const root = localRoot();
  const dir = path.join(root, input.auctionId);
  mkdirSync(dir, { recursive: true });
  const relative = `${input.auctionId}/${input.documentId}-${safeName}`;
  const full = path.join(root, relative);
  await writeFile(full, input.buffer);
  return { storageBackend: "local", storageRef: relative };
}

export async function readAuctionDocumentFile(
  storageBackend: AuctionDocumentStorageBackend,
  storageRef: string
): Promise<{ stream: ReadableStream<Uint8Array>; contentType?: string }> {
  if (storageBackend === "vercel_blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("BLOB_READ_WRITE_TOKEN yoxdur");
    const { get } = await import("@vercel/blob");
    const result = await get(storageRef, { access: "private", token });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Blob tapılmadı və ya oxuna bilmədi");
    }
    return { stream: result.stream, contentType: result.blob.contentType };
  }

  const { createReadStream } = await import("node:fs");
  const full = path.join(localRoot(), storageRef);
  const nodeStream = createReadStream(full);
  const stream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
  return { stream };
}

export async function removeAuctionDocumentFile(
  storageBackend: AuctionDocumentStorageBackend,
  storageRef: string
): Promise<void> {
  if (storageBackend === "vercel_blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return;
    const { del } = await import("@vercel/blob");
    await del(storageRef, { token }).catch(() => undefined);
    return;
  }
  const full = path.join(localRoot(), storageRef);
  await unlink(full).catch(() => undefined);
}
