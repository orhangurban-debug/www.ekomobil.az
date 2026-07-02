import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  validateDocumentFilename,
  validateFileMagicBytes
} from "@/lib/validate";
import { persistSupportUploadFile } from "@/server/support-upload-storage";

export async function POST(req: Request) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { ok: false, error: "Şəkil yükləmək üçün hesabınıza daxil olun." },
      { status: 401 }
    );
  }
  const limit = await checkRateLimit(`listing-image-upload:${sessionUser.id}`, 40, 60);
  if (!limit.ok) {
    return rateLimitResponse(limit.retryAfterSeconds ?? 60);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış fayl sorğusu" }, { status: 400 });
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

  const filenameCheck = validateDocumentFilename(file.name || "listing.jpg");
  if (!filenameCheck.ok) {
    return NextResponse.json({ ok: false, error: filenameCheck.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateFileMagicBytes(buffer, declaredMime)) {
    return NextResponse.json({ ok: false, error: "Fayl məzmunu bəyan edilən növə uyğun deyil" }, { status: 400 });
  }

  const stored = await persistSupportUploadFile({
    folder: "listing-images",
    fileId: randomUUID(),
    originalFilename: file.name || "listing.jpg",
    buffer,
    mimeType: declaredMime
  });

  return NextResponse.json({
    ok: true,
    file: {
      name: file.name,
      url: stored.url,
      mimeType: declaredMime,
      size: file.size
    }
  });
}
