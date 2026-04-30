import { NextResponse } from "next/server";
import {
  finalizeAuctionServicePayment,
  getAuctionServicePayment,
  getAuctionServicePaymentByRemoteOrderId
} from "@/server/auction-payment-store";
import { notifyAuctionApiEvent } from "@/server/auction-api-client";
import {
  resolveKapitalBankPaymentStatus,
  verifyInternalCallbackSignature,
  verifyKapitalBankWebhookSignature
} from "@/server/payments/kapital-bank-callback";
import { getAuctionListing } from "@/server/auction-store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const incomingId = url.searchParams.get("paymentId") ?? url.searchParams.get("ID");
  if (!incomingId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }
  const payment = (await getAuctionServicePayment(incomingId))
    ?? (await getAuctionServicePaymentByRemoteOrderId(incomingId));
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Ödəniş tapılmadı" }, { status: 404 });
  }
  const callbackStatus = url.searchParams.get("status") ?? url.searchParams.get("STATUS");
  if (!payment.providerPayload?.remoteOrderId) {
    const verify = verifyInternalCallbackSignature({
      paymentId: payment.id,
      status: callbackStatus ?? "",
      signature:
        url.searchParams.get("signature")
        ?? url.searchParams.get("sig")
        ?? req.headers.get("x-signature")
    });
    if (!verify.ok) {
      return NextResponse.json({ ok: false, error: verify.reason ?? "İmza tələb olunur" }, { status: 401 });
    }
  }
  let resolved;
  try {
    resolved = await resolveKapitalBankPaymentStatus({
      fallbackStatus: callbackStatus,
      providerPayload: payment.providerPayload
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Ödəniş statusu bankdan təsdiqlənmədi" }, { status: 400 });
  }

  const result = await finalizeAuctionServicePayment({
    paymentId: payment.id,
    status: resolved.status,
    paymentReference:
      resolved.providerReference ??
      url.searchParams.get("reference") ??
      url.searchParams.get("ID") ??
      undefined
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

  const redirectUrl = new URL(`/payments/auction-service/${payment.id}`, req.url);
  if (result.payment?.status === "succeeded") {
    redirectUrl.searchParams.set("status", "success");
  }
  return NextResponse.redirect(redirectUrl);
}

export async function POST(req: Request) {
  const raw = await req.text();
  let parsed: unknown = {};
  if (raw.trim().length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }
  const body = parsed as {
    paymentId?: string;
    status?: string;
    reference?: string;
    signature?: string;
    id?: string;
    payload?: { id?: string; status?: string };
  };
  const incomingId = body.paymentId ?? body.id ?? body.payload?.id ?? null;
  if (!incomingId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }
  const payment = (await getAuctionServicePayment(incomingId))
    ?? (await getAuctionServicePaymentByRemoteOrderId(incomingId));
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Ödəniş tapılmadı" }, { status: 404 });
  }
  const verify = verifyKapitalBankWebhookSignature({
    rawBody: raw,
    signature: req.headers.get("x-signature") ?? body.signature,
    providerPayload: payment.providerPayload
  });
  if (!verify.ok) {
    return NextResponse.json({ ok: false, error: verify.reason ?? "Webhook imzası keçərsizdir" }, { status: 401 });
  }
  let resolved;
  try {
    resolved = await resolveKapitalBankPaymentStatus({
      fallbackStatus: body.status ?? body.payload?.status ?? null,
      providerPayload: payment.providerPayload
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Ödəniş statusu bankdan təsdiqlənmədi" }, { status: 400 });
  }

  const result = await finalizeAuctionServicePayment({
    paymentId: payment.id,
    status: resolved.status,
    paymentReference: resolved.providerReference ?? body.reference ?? body.payload?.id
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
