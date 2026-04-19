import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  validateDocumentFilename,
  validateFileMagicBytes
} from "@/lib/validate";
import { persistSupportUploadFile } from "@/server/support-upload-storage";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`support-upload:${ip}`, 12, 10);
  if (!limit.ok) {
    return rateLimitResponse(120);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış fayl sorğusu" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "misc").trim();
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

  const declaredMime = (file.type || "").toLowerCase();
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(declaredMime)) {
    return NextResponse.json(
      { ok: false, error: "Yalnız PDF, JPEG, PNG, WebP, HEIC faylları qəbul edilir" },
      { status: 400 }
    );
  }

  const filenameCheck = validateDocumentFilename(file.name || "upload");
  if (!filenameCheck.ok) {
    return NextResponse.json({ ok: false, error: filenameCheck.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateFileMagicBytes(buffer, declaredMime)) {
    return NextResponse.json(
      { ok: false, error: "Fayl məzmunu bəyan edilən növə uyğun deyil" },
      { status: 400 }
    );
  }

  const folder = kind === "certificate" ? "support-certificates" : "support-images";
  const stored = await persistSupportUploadFile({
    folder,
    fileId: randomUUID(),
    originalFilename: file.name || "upload",
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
