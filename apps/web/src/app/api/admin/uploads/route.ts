import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  validateDocumentFilename,
  validateFileMagicBytes
} from "@/lib/validate";
import {
  getUploadStorageReadiness,
  persistSupportUploadFile,
  UploadStorageError
} from "@/server/support-upload-storage";

/** Admin marketinq media qovluqları — bunlar publik göstərilir (reklam/ana səhifə). */
const ALLOWED_FOLDERS = new Set(["ad-creatives", "home-content"]);

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;
  const readiness = getUploadStorageReadiness();
  return NextResponse.json({ ok: readiness.ready, ...readiness });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const readiness = getUploadStorageReadiness();
  if (!readiness.ready) {
    return NextResponse.json(
      { ok: false, error: readiness.message ?? "Şəkil saxlama konfiqurasiyası hazır deyil." },
      { status: 503 }
    );
  }

  const limit = await checkRateLimit(`admin-media-upload:${auth.user.id}`, 60, 60);
  if (!limit.ok) {
    return rateLimitResponse(limit.retryAfterSeconds ?? 60);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış fayl sorğusu" }, { status: 400 });
  }

  const folderRaw = String(form.get("folder") ?? "");
  const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : "";
  if (!folder) {
    return NextResponse.json({ ok: false, error: "Yanlış qovluq" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Fayl tələb olunur" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "Boş fayl yüklənə bilməz" }, { status: 400 });
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: `Fayl ölçüsü ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB-dan çox ola bilməz` },
      { status: 400 }
    );
  }

  const declaredMime = (file.type || "image/jpeg").toLowerCase();
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(declaredMime) || declaredMime === "application/pdf") {
    return NextResponse.json({ ok: false, error: "Yalnız JPEG, PNG, WebP, HEIC şəkilləri qəbul edilir" }, { status: 400 });
  }

  const filenameCheck = validateDocumentFilename(file.name || "ad.jpg");
  if (!filenameCheck.ok) {
    return NextResponse.json({ ok: false, error: filenameCheck.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateFileMagicBytes(buffer, declaredMime)) {
    return NextResponse.json({ ok: false, error: "Fayl məzmunu bəyan edilən növə uyğun deyil" }, { status: 400 });
  }

  try {
    const stored = await persistSupportUploadFile({
      folder,
      fileId: randomUUID(),
      originalFilename: file.name || "ad.jpg",
      buffer,
      mimeType: declaredMime
    });
    return NextResponse.json({ ok: true, url: stored.url });
  } catch (err) {
    const message =
      err instanceof UploadStorageError
        ? err.message
        : "Şəkil yüklənmədi. Server konfiqurasiyasını yoxlayın.";
    console.error("[admin/uploads]", err);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
