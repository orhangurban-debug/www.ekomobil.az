import path from "node:path";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { Readable } from "node:stream";

function localRoot(): string {
  return process.env.SUPPORT_UPLOADS_DIR || path.join(process.cwd(), ".support-uploads");
}

function inferContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".heic") return "image/heic";
  if (ext === ".heif") return "image/heif";
  return "image/jpeg";
}

export async function GET(_req: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  if (!parts?.length) {
    return new Response("Not found", { status: 404 });
  }
  const relative = parts.join("/");
  const full = path.join(localRoot(), relative);
  if (!full.startsWith(localRoot())) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    await access(full);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream<Uint8Array>;
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": inferContentType(full),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
