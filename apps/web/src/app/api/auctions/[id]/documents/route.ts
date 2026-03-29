import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { listAuctionListingDocuments, uploadAuctionListingDocument } from "@/server/auction-document-store";
import { getAuctionListing } from "@/server/auction-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  validateDocumentFilename,
  validateFileMagicBytes,
} from "@/lib/validate";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const { id: auctionId } = await context.params;
  if (!auctionId || !/^[0-9a-f-]{36}$/.test(auctionId)) {
    return NextResponse.json({ ok: false, error: "Keçərsiz auksion ID" }, { status: 400 });
  }

  const auction = await getAuctionListing(auctionId);
  if (!auction) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }
  if (auction.sellerUserId !== user.id && user.role !== "admin" && user.role !== "support") {
    return NextResponse.json({ ok: false, error: "Giriş icazəsi yoxdur" }, { status: 403 });
  }

  const documents = await listAuctionListingDocuments(auctionId);
  return NextResponse.json({ ok: true, documents });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const { id: auctionId } = await context.params;
  if (!auctionId || !/^[0-9a-f-]{36}$/.test(auctionId)) {
    return NextResponse.json({ ok: false, error: "Keçərsiz auksion ID" }, { status: 400 });
  }

  // Rate limit: 10 uploads per 10 minutes per user
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`doc-upload:${user.id}:${ip}`, 10, 10);
  if (!limit.ok) {
    return rateLimitResponse(120);
  }

  // Verify ownership before parsing the (potentially large) multipart body
  const auction = await getAuctionListing(auctionId);
  if (!auction) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }
  if (auction.sellerUserId !== user.id && user.role !== "admin" && user.role !== "support") {
    return NextResponse.json({ ok: false, error: "Giriş icazəsi yoxdur" }, { status: 403 });
  }

  // Parse multipart form data
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış fayl sorğusu" }, { status: 400 });
  }

  const file = form.get("file");
  const docType = String(form.get("docType") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file tələb olunur" }, { status: 400 });
  }

  // ─── File size check ───────────────────────────────────────────────────────
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "Boş fayl yüklənə bilməz" }, { status: 400 });
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: `Fayl ölçüsü ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB-dan çox ola bilməz` },
      { status: 400 }
    );
  }

  // ─── MIME type check ───────────────────────────────────────────────────────
  const declaredMime = (file.type || "").toLowerCase();
  const allowedMimes: readonly string[] = ALLOWED_DOCUMENT_MIME_TYPES;
  if (!allowedMimes.includes(declaredMime)) {
    return NextResponse.json(
      { ok: false, error: `Bu fayl növü qəbul edilmir. İcazə verilən növlər: PDF, JPEG, PNG, WebP` },
      { status: 400 }
    );
  }

  // ─── Filename check ────────────────────────────────────────────────────────
  const filenameCheck = validateDocumentFilename(file.name || "document");
  if (!filenameCheck.ok) {
    return NextResponse.json({ ok: false, error: filenameCheck.error }, { status: 400 });
  }

  // ─── Magic bytes check (actual file content vs declared MIME) ─────────────
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateFileMagicBytes(buffer, declaredMime)) {
    return NextResponse.json(
      { ok: false, error: "Faylın məzmunu bəyan edilən növə uyğun gəlmir" },
      { status: 400 }
    );
  }

  const result = await uploadAuctionListingDocument({
    auctionId,
    actorUserId: user.id,
    docType,
    originalFilename: file.name || "document",
    mimeType: declaredMime,
    buffer,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, document: result.document });
}
