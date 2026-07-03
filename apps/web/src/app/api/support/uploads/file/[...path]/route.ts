import { getServerSessionUser } from "@/lib/auth";
import { readSupportUploadFile } from "@/server/support-upload-storage";

export const runtime = "nodejs";

// Publik marketinq/media qovluqları — ziyarətçilərə açıqdır (auth tələb olunmur).
// Digər qovluqlar (dəstək/hüquqi sənədlər) həssasdır və auth tələb edir.
const PUBLIC_FOLDERS = new Set([
  "ad-creatives",
  "home-content",
  "listing-images",
  "support-images",
  "support-certificates"
]);

export async function GET(_req: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  if (!parts?.length) {
    return new Response("Not found", { status: 404 });
  }

  const isPublic = PUBLIC_FOLDERS.has(parts[0]);

  if (!isPublic) {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const relative = parts.join("/");
  const file = await readSupportUploadFile(relative);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": isPublic
        ? "public, max-age=3600"
        : // Həssas məzmun — private cache, uzunmüddətli immutable saxlama yoxdur.
          "private, no-store"
    }
  });
}
