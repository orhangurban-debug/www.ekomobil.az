import { NextResponse } from "next/server";
import { finalizeAuctionDeposit, getAuctionDeposit } from "@/server/auction-payment-store";
import { notifyAuctionApiEvent } from "@/server/auction-api-client";
import { resolveKapitalBankPaymentStatus, verifyKapitalBankCallbackPlaceholder } from "@/server/payments/kapital-bank-callback";
import { getAuctionListing } from "@/server/auction-store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  verifyKapitalBankCallbackPlaceholder({
    signature: url.searchParams.get("signature")
  });
  const depositId = url.searchParams.get("depositId");
  if (!depositId) {
    return NextResponse.json({ ok: false, error: "depositId tələb olunur" }, { status: 400 });
  }
  const deposit = await getAuctionDeposit(depositId);
  if (!deposit) {
    return NextResponse.json({ ok: false, error: "Deposit tapılmadı" }, { status: 404 });
  }
  const resolved = await resolveKapitalBankPaymentStatus({
    fallbackStatus: url.searchParams.get("status"),
    providerPayload: deposit.providerPayload
  });

  const result = await finalizeAuctionDeposit({
    depositId,
    status: resolved.status,
    paymentReference: resolved.providerReference ?? url.searchParams.get("reference") ?? undefined
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  if (result.deposit) {
    const auction = await getAuctionListing(result.deposit.auctionId);
    await notifyAuctionApiEvent({
      auctionId: result.deposit.auctionId,
      type: "payment.updated",
      payload: {
        deposit: result.deposit,
        auction
      }
    }).catch(() => undefined);
  }

  const redirectUrl = new URL(`/payments/auction-deposit/${depositId}`, req.url);
  if (result.deposit?.status === "held") {
    redirectUrl.searchParams.set("status", "success");
  }
  return NextResponse.redirect(redirectUrl);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    depositId?: string;
    status?: string;
    reference?: string;
    signature?: string;
  };
  verifyKapitalBankCallbackPlaceholder({
    body,
    signature: body.signature ?? null
  });
  if (!body.depositId) {
    return NextResponse.json({ ok: false, error: "depositId tələb olunur" }, { status: 400 });
  }
  const deposit = await getAuctionDeposit(body.depositId);
  if (!deposit) {
    return NextResponse.json({ ok: false, error: "Deposit tapılmadı" }, { status: 404 });
  }
  const resolved = await resolveKapitalBankPaymentStatus({
    fallbackStatus: body.status ?? null,
    providerPayload: deposit.providerPayload
  });

  const result = await finalizeAuctionDeposit({
    depositId: body.depositId,
    status: resolved.status,
    paymentReference: resolved.providerReference ?? body.reference
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  if (result.deposit) {
    const auction = await getAuctionListing(result.deposit.auctionId);
    await notifyAuctionApiEvent({
      auctionId: result.deposit.auctionId,
      type: "payment.updated",
      payload: {
        deposit: result.deposit,
        auction
      }
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, deposit: result.deposit });
}
