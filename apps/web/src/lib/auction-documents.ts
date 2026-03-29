export const AUCTION_DOCUMENT_TYPES = [
  "ownership_proof",
  "identity",
  "power_of_attorney",
  "other",
  "dispute_evidence",
] as const;
export type AuctionDocumentType = (typeof AUCTION_DOCUMENT_TYPES)[number];

/** Role of the uploader in the context of a dispute */
export type DisputeUploaderRole = "buyer" | "seller";

export type AuctionDocumentStatus = "pending_review" | "approved" | "rejected";

export type AuctionDocumentStorageBackend = "local" | "vercel_blob";

export interface AuctionListingDocumentRecord {
  id: string;
  auctionId: string;
  uploadedByUserId: string;
  uploaderRole?: DisputeUploaderRole;
  docType: AuctionDocumentType;
  status: AuctionDocumentStatus;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  storageBackend: AuctionDocumentStorageBackend;
  storageRef: string;
  opsNote?: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export const AUCTION_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const AUCTION_DOCUMENT_MAX_PER_LOT = 15;

export const AUCTION_DOCUMENT_TYPE_LABELS: Record<AuctionDocumentType, string> = {
  ownership_proof: "Mülkiyyət / çıxarış",
  identity: "Şəxsiyyət və ya təmsilçilik",
  power_of_attorney: "Etibarnamə",
  other: "Digər",
  dispute_evidence: "Mübahisə sübutu",
};

export const AUCTION_DOCUMENT_STATUS_LABELS: Record<AuctionDocumentStatus, string> = {
  pending_review: "Yoxlamada",
  approved: "Təsdiqlənib",
  rejected: "Rədd edilib"
};

export const AUCTION_DOCUMENT_ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);
