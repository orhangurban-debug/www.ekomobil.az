import { NextResponse } from "next/server";
import {
  finalizeAuctionDeposit,
  getAuctionDeposit,
  getAuctionDepositByRemoteOrderId
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
  const incomingId = url.searchParams.get("depositId") ?? url.searchParams.get("ID");
  if (!incomingId) {
    return NextResponse.json({ ok: false, error: "depositId tələb olunur" }, { status: 400 });
  }
  const deposit = (await getAuctionDeposit(incomingId))
    ?? (await getAuctionDepositByRemoteOrderId(incomingId));
  if (!deposit) {
    return NextResponse.json({ ok: false, error: "Deposit tapılmadı" }, { status: 404 });
  }
  const callbackStatus = url.searchParams.get("status") ?? url.searchParams.get("STATUS");
  if (!deposit.providerPayload?.remoteOrderId) {
    const verify = verifyInternalCallbackSignature({
      paymentId: deposit.id,
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
      providerPayload: deposit.providerPayload
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Ödəniş statusu bankdan təsdiqlənmədi" }, { status: 400 });
  }

  const result = await finalizeAuctionDeposit({
    depositId: deposit.id,
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

  const redirectUrl = new URL(`/payments/auction-deposit/${deposit.id}`, req.url);
  if (result.deposit?.status === "held") {
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
    depositId?: string;
    status?: string;
    reference?: string;
    signature?: string;
    id?: string;
    payload?: { id?: string; status?: string };
  };
  const incomingId = body.depositId ?? body.id ?? body.payload?.id ?? null;
  if (!incomingId) {
    return NextResponse.json({ ok: false, error: "depositId tələb olunur" }, { status: 400 });
  }
  const deposit = (await getAuctionDeposit(incomingId))
    ?? (await getAuctionDepositByRemoteOrderId(incomingId));
  if (!deposit) {
    return NextResponse.json({ ok: false, error: "Deposit tapılmadı" }, { status: 404 });
  }
  const verify = verifyKapitalBankWebhookSignature({
    rawBody: raw,
    signature: req.headers.get("x-signature") ?? body.signature,
    providerPayload: deposit.providerPayload
  });
  if (!verify.ok) {
    return NextResponse.json({ ok: false, error: verify.reason ?? "Webhook imzası keçərsizdir" }, { status: 401 });
  }
  let resolved;
  try {
    resolved = await resolveKapitalBankPaymentStatus({
      fallbackStatus: body.status ?? body.payload?.status ?? null,
      providerPayload: deposit.providerPayload
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Ödəniş statusu bankdan təsdiqlənmədi" }, { status: 400 });
  }

  const result = await finalizeAuctionDeposit({
    depositId: deposit.id,
    status: resolved.status,
    paymentReference: resolved.providerReference ?? body.reference ?? body.payload?.id
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
