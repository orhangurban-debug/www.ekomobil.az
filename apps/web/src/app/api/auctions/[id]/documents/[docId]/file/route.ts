import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getAuctionListingDocument } from "@/server/auction-document-store";
import { getAuctionListing } from "@/server/auction-store";
import { readAuctionDocumentFile } from "@/server/auction-document-storage";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const { id: auctionId, docId } = await context.params;
  const doc = await getAuctionListingDocument(docId);
  if (!doc || doc.auctionId !== auctionId) {
    return NextResponse.json({ ok: false, error: "Sənəd tapılmadı" }, { status: 404 });
  }

  const auction = await getAuctionListing(auctionId);
  if (!auction) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }

  const isSeller = auction.sellerUserId === user.id;
  const isOps = user.role === "admin" || user.role === "support";
  if (!isSeller && !isOps) {
    return NextResponse.json({ ok: false, error: "Giriş icazəsi yoxdur" }, { status: 403 });
  }

  try {
    const { stream, contentType } = await readAuctionDocumentFile(doc.storageBackend, doc.storageRef);
    const headers = new Headers();
    headers.set("Content-Type", contentType || doc.mimeType);
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.originalFilename)}"`);
    return new NextResponse(stream, { headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fayl oxunmadı";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
