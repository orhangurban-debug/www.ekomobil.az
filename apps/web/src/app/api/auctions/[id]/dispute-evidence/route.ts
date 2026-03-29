import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getAuctionListing } from "@/server/auction-store";
import {
  listDisputeEvidence,
  uploadDisputeEvidence,
} from "@/server/auction-document-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import {
  MAX_DOCUMENT_SIZE_BYTES,
  validateDocumentFilename,
  validateFileMagicBytes,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from "@/lib/validate";
import type { DisputeUploaderRole } from "@/lib/auction-documents";

/** GET: list all dispute evidence (seller, buyer, ops) */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const winnerUserId = auction.winnerUserId ?? auction.currentBidderUserId;
  const canView =
    user.id === auction.sellerUserId ||
    (winnerUserId && user.id === winnerUserId) ||
    user.role === "admin" ||
    user.role === "support";

  if (!canView) {
    return NextResponse.json({ ok: false, error: "Giriş icazəsi yoxdur" }, { status: 403 });
  }

  const documents = await listDisputeEvidence(auctionId);
  return NextResponse.json({ ok: true, documents });
}

/** POST: upload dispute evidence (seller or buyer when disputed) */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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
  const limit = await checkRateLimit(`dispute-upload:${user.id}:${ip}`, 10, 10);
  if (!limit.ok) return rateLimitResponse(120);

  // Verify dispute status before parsing body
  const auction = await getAuctionListing(auctionId);
  if (!auction) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }
  if (auction.status !== "disputed") {
    return NextResponse.json(
      { ok: false, error: "Sübut yalnız mübahisə (`disputed`) statusunda yüklənə bilər" },
      { status: 400 }
    );
  }

  // Determine uploader role
  const winnerUserId = auction.winnerUserId ?? auction.currentBidderUserId;
  let uploaderRole: DisputeUploaderRole | null = null;
  if (user.id === auction.sellerUserId) uploaderRole = "seller";
  else if (winnerUserId && user.id === winnerUserId) uploaderRole = "buyer";

  if (!uploaderRole) {
    return NextResponse.json({ ok: false, error: "Yalnız satıcı və ya qalib alıcı sübut yükləyə bilər" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış fayl sorğusu" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file tələb olunur" }, { status: 400 });
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
  const allowedMimes: readonly string[] = ALLOWED_DOCUMENT_MIME_TYPES;
  if (!allowedMimes.includes(declaredMime)) {
    return NextResponse.json(
      { ok: false, error: "Yalnız PDF, JPEG, PNG, WebP faylları qəbul edilir" },
      { status: 400 }
    );
  }

  const filenameCheck = validateDocumentFilename(file.name || "evidence");
  if (!filenameCheck.ok) {
    return NextResponse.json({ ok: false, error: filenameCheck.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateFileMagicBytes(buffer, declaredMime)) {
    return NextResponse.json(
      { ok: false, error: "Faylın məzmunu bəyan edilən növə uyğun gəlmir" },
      { status: 400 }
    );
  }

  const result = await uploadDisputeEvidence({
    auctionId,
    actorUserId: user.id,
    uploaderRole,
    originalFilename: file.name || "evidence",
    mimeType: declaredMime,
    buffer,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, document: result.document });
}
