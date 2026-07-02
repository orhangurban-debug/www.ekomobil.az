import path from "node:path";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { Readable } from "node:stream";
import { getServerSessionUser } from "@/lib/auth";

function localRoot(): string {
  return process.env.SUPPORT_UPLOADS_DIR || path.join(process.cwd(), ".support-uploads");
}

/** `full` yolunun həqiqətən `root` qovluğunun içində olduğunu təsdiqləyir (traversal qoruması). */
function isInsideRoot(root: string, full: string): boolean {
  const relative = path.relative(root, full);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
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
  // Dəstək/hüquqi/partnyor sənədləri həssasdır — yalnız daxil olmuş istifadəçilərə verilir.
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path: parts } = await context.params;
  if (!parts?.length) {
    return new Response("Not found", { status: 404 });
  }
  const root = localRoot();
  const relative = parts.join("/");
  const full = path.resolve(root, relative);
  if (!isInsideRoot(root, full)) {
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
      // Həssas məzmun — private cache, uzunmüddətli immutable saxlama yoxdur.
      "Cache-Control": "private, no-store"
    }
  });
}
