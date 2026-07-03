import { getServerSessionUser } from "@/lib/auth";
import { readSupportUploadStream } from "@/server/support-upload-storage";

export const runtime = "nodejs";

// Ziyarətçilərə açıq olan media qovluqları (auth tələb olunmur).
// Digər qovluqlar daxil olmuş istifadəçi tələb edir.
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

  const folder = parts[0];
  const isPublic = PUBLIC_FOLDERS.has(folder);

  if (!isPublic) {
    const sessionUser = await getServerSessionUser();
    if (!sessionUser) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const file = await readSupportUploadStream(parts);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(file.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": file.contentType,
      // Public assets are safe to cache at the CDN edge.
      // Private/sensitive documents must not be cached publicly.
      "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store"
    }
  });
}
