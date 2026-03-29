import { randomUUID } from "node:crypto";
import {
  AUCTION_DOCUMENT_ALLOWED_MIMES,
  AUCTION_DOCUMENT_MAX_BYTES,
  AUCTION_DOCUMENT_MAX_PER_LOT,
  AUCTION_DOCUMENT_TYPES,
  type AuctionDocumentType,
  type AuctionListingDocumentRecord
} from "@/lib/auction-documents";
import { getPgPool } from "@/lib/postgres";
import {
  persistAuctionDocumentFile,
  removeAuctionDocumentFile
} from "@/server/auction-document-storage";
import { getAuctionListing, recordAuctionAuditLog } from "@/server/auction-store";

interface DocumentRow {
  id: string;
  auction_id: string;
  uploaded_by_user_id: string;
  doc_type: string;
  status: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  storage_backend: string;
  storage_ref: string;
  ops_note: string | null;
  reviewed_at: Date | null;
  reviewed_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: DocumentRow): AuctionListingDocumentRecord {
  return {
    id: row.id,
    auctionId: row.auction_id,
    uploadedByUserId: row.uploaded_by_user_id,
    docType: row.doc_type as AuctionDocumentType,
    status: row.status as AuctionListingDocumentRecord["status"],
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    storageBackend: row.storage_backend as AuctionListingDocumentRecord["storageBackend"],
    storageRef: row.storage_ref,
    opsNote: row.ops_note ?? undefined,
    reviewedAt: row.reviewed_at?.toISOString(),
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function isValidDocType(value: string): value is AuctionDocumentType {
  return (AUCTION_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export async function countAuctionDocuments(auctionId: string): Promise<number> {
  const pool = getPgPool();
  const result = await pool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM auction_listing_documents WHERE auction_id = $1`,
    [auctionId]
  );
  return Number(result.rows[0]?.n ?? 0);
}

export async function listAuctionListingDocuments(auctionId: string): Promise<AuctionListingDocumentRecord[]> {
  const pool = getPgPool();
  const result = await pool.query<DocumentRow>(
    `SELECT * FROM auction_listing_documents WHERE auction_id = $1 ORDER BY created_at DESC`,
    [auctionId]
  );
  return result.rows.map(mapRow);
}

export async function getAuctionListingDocument(docId: string): Promise<AuctionListingDocumentRecord | null> {
  const pool = getPgPool();
  const result = await pool.query<DocumentRow>(`SELECT * FROM auction_listing_documents WHERE id = $1 LIMIT 1`, [docId]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function uploadAuctionListingDocument(input: {
  auctionId: string;
  actorUserId: string;
  docType: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ ok: true; document: AuctionListingDocumentRecord } | { ok: false; error: string }> {
  if (!isValidDocType(input.docType)) {
    return { ok: false, error: "Naməlum sənəd növü" };
  }
  if (!AUCTION_DOCUMENT_ALLOWED_MIMES.has(input.mimeType)) {
    return { ok: false, error: "Yalnız PDF, JPEG, PNG və WebP qəbul olunur" };
  }
  if (input.buffer.length > AUCTION_DOCUMENT_MAX_BYTES) {
    return { ok: false, error: `Fayl çox böyükdür (maks. ${AUCTION_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB)` };
  }

  const auction = await getAuctionListing(input.auctionId);
  if (!auction) return { ok: false, error: "Auksion tapılmadı" };
  if (auction.sellerUserId !== input.actorUserId) {
    return { ok: false, error: "Yalnız lot satıcısı sənəd yükləyə bilər" };
  }

  const count = await countAuctionDocuments(input.auctionId);
  if (count >= AUCTION_DOCUMENT_MAX_PER_LOT) {
    return { ok: false, error: `Lot başına ən çox ${AUCTION_DOCUMENT_MAX_PER_LOT} fayl` };
  }

  const id = randomUUID();
  let persisted: { storageBackend: AuctionListingDocumentRecord["storageBackend"]; storageRef: string };
  try {
    persisted = await persistAuctionDocumentFile({
      auctionId: input.auctionId,
      documentId: id,
      originalFilename: input.originalFilename,
      buffer: input.buffer,
      mimeType: input.mimeType
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fayl saxlanılmadı";
    return { ok: false, error: msg };
  }

  const pool = getPgPool();
  const result = await pool.query<DocumentRow>(
    `INSERT INTO auction_listing_documents (
       id, auction_id, uploaded_by_user_id, doc_type, status, original_filename, mime_type, byte_size,
       storage_backend, storage_ref
     )
     VALUES ($1, $2, $3, $4, 'pending_review', $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      input.auctionId,
      input.actorUserId,
      input.docType,
      input.originalFilename,
      input.mimeType,
      input.buffer.length,
      persisted.storageBackend,
      persisted.storageRef
    ]
  );

  const inserted = result.rows[0];
  if (!inserted) return { ok: false, error: "Sənəd qeydə alınmadı" };
  const document = mapRow(inserted);
  await recordAuctionAuditLog({
    auctionId: input.auctionId,
    actorUserId: input.actorUserId,
    actionType: "auction_document_uploaded",
    detail: `${input.docType}: ${input.originalFilename}`
  });

  return { ok: true, document };
}

export async function deleteAuctionListingDocument(input: {
  docId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const doc = await getAuctionListingDocument(input.docId);
  if (!doc) return { ok: false, error: "Sənəd tapılmadı" };

  const auction = await getAuctionListing(doc.auctionId);
  if (!auction) return { ok: false, error: "Auksion tapılmadı" };
  if (auction.sellerUserId !== input.actorUserId) {
    return { ok: false, error: "Yalnız satıcı silə bilər" };
  }
  if (doc.status !== "pending_review") {
    return { ok: false, error: "Yalnız yoxlamada olan sənəd silinə bilər" };
  }

  await removeAuctionDocumentFile(doc.storageBackend, doc.storageRef);

  const pool = getPgPool();
  await pool.query(`DELETE FROM auction_listing_documents WHERE id = $1`, [input.docId]);

  await recordAuctionAuditLog({
    auctionId: doc.auctionId,
    actorUserId: input.actorUserId,
    actionType: "auction_document_deleted",
    detail: doc.originalFilename
  });

  return { ok: true };
}

export async function reviewAuctionListingDocument(input: {
  docId: string;
  reviewerUserId: string;
  status: "approved" | "rejected";
  note?: string;
}): Promise<{ ok: true; document: AuctionListingDocumentRecord } | { ok: false; error: string }> {
  const doc = await getAuctionListingDocument(input.docId);
  if (!doc) return { ok: false, error: "Sənəd tapılmadı" };
  if (doc.status !== "pending_review") {
    return { ok: false, error: "Sənəd artıq emal olunub" };
  }

  const pool = getPgPool();
  const result = await pool.query<DocumentRow>(
    `UPDATE auction_listing_documents
     SET status = $2,
         ops_note = COALESCE($3, ops_note),
         reviewed_at = NOW(),
         reviewed_by_user_id = $4,
         updated_at = NOW()
     WHERE id = $1 AND status = 'pending_review'
     RETURNING *`,
    [input.docId, input.status, input.note ?? null, input.reviewerUserId]
  );
  if (!result.rows[0]) return { ok: false, error: "Yeniləmə alınmadı" };

  const updated = mapRow(result.rows[0]);
  await recordAuctionAuditLog({
    auctionId: doc.auctionId,
    actorUserId: input.reviewerUserId,
    actionType: `auction_document_${input.status}`,
    detail: `${doc.originalFilename}${input.note ? `: ${input.note}` : ""}`
  });

  return { ok: true, document: updated };
}

export type PendingAuctionDocumentRow = AuctionListingDocumentRecord & { titleSnapshot: string };

export async function listPendingAuctionDocuments(limit = 40): Promise<PendingAuctionDocumentRow[]> {
  const pool = getPgPool();
  const result = await pool.query<DocumentRow & { title_snapshot: string }>(
    `SELECT d.*, al.title_snapshot
     FROM auction_listing_documents d
     JOIN auction_listings al ON al.id = d.auction_id
     WHERE d.status = 'pending_review'
     ORDER BY d.created_at ASC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => {
    const { title_snapshot, ...docRow } = row;
    return { ...mapRow(docRow as DocumentRow), titleSnapshot: title_snapshot };
  });
}
