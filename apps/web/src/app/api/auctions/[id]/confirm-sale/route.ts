import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { notifyAuctionApiEvent } from "@/server/auction-api-client";
import { confirmAuctionSale } from "@/server/auction-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Əməliyyat üçün daxil olmalısınız" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    actorRole?: "buyer" | "seller";
    outcome?: "confirmed" | "no_show" | "disputed";
    note?: string;
  };

  if (!body.actorRole || !body.outcome) {
    return NextResponse.json({ ok: false, error: "actorRole və outcome tələb olunur" }, { status: 400 });
  }

  const result = await confirmAuctionSale({
    auctionId: id,
    actorUserId: user.id,
    actorRole: body.actorRole,
    outcome: body.outcome,
    note: body.note
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  if (result.auction) {
    await notifyAuctionApiEvent({
      auctionId: result.auction.id,
      type: "auction.updated",
      payload: {
        auction: result.auction,
        outcome: result.outcome,
        actorRole: body.actorRole,
        action: body.outcome
      }
    }).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    auction: result.auction,
    outcome: result.outcome
  });
}
