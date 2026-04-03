import { NextResponse } from "next/server";
import { finalizeAuctionServicePayment, getAuctionServicePayment } from "@/server/auction-payment-store";
import { notifyAuctionApiEvent } from "@/server/auction-api-client";
import { resolveKapitalBankPaymentStatus } from "@/server/payments/kapital-bank-callback";
import { getAuctionListing } from "@/server/auction-store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }
  const payment = await getAuctionServicePayment(paymentId);
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Ödəniş tapılmadı" }, { status: 404 });
  }
  let resolved;
  try {
    resolved = await resolveKapitalBankPaymentStatus({
      fallbackStatus: url.searchParams.get("status"),
      providerPayload: payment.providerPayload
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Ödəniş statusu bankdan təsdiqlənmədi" }, { status: 400 });
  }

  const result = await finalizeAuctionServicePayment({
    paymentId,
    status: resolved.status,
    paymentReference: resolved.providerReference ?? url.searchParams.get("reference") ?? undefined
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  if (result.payment) {
    const auction = await getAuctionListing(result.payment.auctionId);
    await notifyAuctionApiEvent({
      auctionId: result.payment.auctionId,
      type: "payment.updated",
      payload: {
        payment: result.payment,
        auction,
        activationLagMs:
          result.payment.eventType === "lot_fee" && result.payment.status === "succeeded"
            ? Date.now() - new Date(result.payment.createdAt).getTime()
            : undefined
      }
    }).catch(() => undefined);
  }

  const redirectUrl = new URL(`/payments/auction-service/${paymentId}`, req.url);
  if (result.payment?.status === "succeeded") {
    redirectUrl.searchParams.set("status", "success");
  }
  return NextResponse.redirect(redirectUrl);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    paymentId?: string;
    status?: string;
    reference?: string;
    signature?: string;
  };
  if (!body.paymentId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }
  const payment = await getAuctionServicePayment(body.paymentId);
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Ödəniş tapılmadı" }, { status: 404 });
  }
  let resolved;
  try {
    resolved = await resolveKapitalBankPaymentStatus({
      fallbackStatus: body.status ?? null,
      providerPayload: payment.providerPayload
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Ödəniş statusu bankdan təsdiqlənmədi" }, { status: 400 });
  }

  const result = await finalizeAuctionServicePayment({
    paymentId: body.paymentId,
    status: resolved.status,
    paymentReference: resolved.providerReference ?? body.reference
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  if (result.payment) {
    const auction = await getAuctionListing(result.payment.auctionId);
    await notifyAuctionApiEvent({
      auctionId: result.payment.auctionId,
      type: "payment.updated",
      payload: {
        payment: result.payment,
        auction,
        activationLagMs:
          result.payment.eventType === "lot_fee" && result.payment.status === "succeeded"
            ? Date.now() - new Date(result.payment.createdAt).getTime()
            : undefined
      }
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, payment: result.payment });
}
