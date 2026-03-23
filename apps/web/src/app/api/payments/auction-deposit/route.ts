import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { createAuctionDeposit } from "@/server/auction-payment-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Deposit üçün daxil olmalısınız" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { auctionId?: string };
  if (!body.auctionId?.trim()) {
    return NextResponse.json({ ok: false, error: "auctionId tələb olunur" }, { status: 400 });
  }

  const result = await createAuctionDeposit({
    auctionId: body.auctionId,
    bidderUserId: user.id
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, deposit: result.deposit, checkoutUrl: result.deposit.checkoutUrl });
}
