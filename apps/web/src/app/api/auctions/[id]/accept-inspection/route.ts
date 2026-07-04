/**
 * POST /api/auctions/[id]/accept-inspection
 * Alıcı 24 saatlıq müayinə müddəti ərzində avtomobili qəbul edir.
 * Status: ended_pending_inspection → ended_pending_confirmation
 */
import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getPgPool } from "@/lib/postgres";
import { getAuctionListing, recordAuctionAuditLog } from "@/server/auction-store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const auction = await getAuctionListing(auctionId);
  if (!auction) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }
  if (auction.status !== "ended_pending_inspection") {
    return NextResponse.json({ ok: false, error: "Bu auksion müayinə mərhələsində deyil" }, { status: 400 });
  }
  if (auction.winnerUserId !== user.id) {
    return NextResponse.json({ ok: false, error: "Yalnız qalib alıcı müayinəni qəbul edə bilər" }, { status: 403 });
  }

  // Müayinə müddəti bitibsə xəbərdarlıq (SLA cron avtomatik keçirəcək)
  const pool = getPgPool();
  await pool.query(
    `UPDATE auction_listings
     SET status = 'ended_pending_confirmation',
         inspection_accepted_at = NOW(),
         updated_at = NOW()
     WHERE id = $1 AND status = 'ended_pending_inspection'`,
    [auctionId]
  );

  await recordAuctionAuditLog({
    auctionId,
    actorUserId: user.id,
    actionType: "inspection_accepted",
    detail: "Alıcı 24 saatlıq müayinə müddəti ərzində avtomobili qəbul etdi"
  });

  return NextResponse.json({ ok: true });
}
