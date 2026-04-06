import { NextResponse } from "next/server";
import {
  finalizeBusinessPlanPayment,
  getBusinessPlanPayment,
  getBusinessPlanPaymentByRemoteOrderId
} from "@/server/business-plan-payment-store";
import {
  resolveKapitalBankPaymentStatus,
  verifyKapitalBankWebhookSignature
} from "@/server/payments/kapital-bank-callback";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const incomingId = url.searchParams.get("paymentId");
  if (!incomingId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }

  const payment = (await getBusinessPlanPayment(incomingId))
    ?? (await getBusinessPlanPaymentByRemoteOrderId(incomingId));
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

  const result = await finalizeBusinessPlanPayment({
    paymentId: payment.id,
    status: resolved.status,
    providerReference: resolved.providerReference ?? url.searchParams.get("reference") ?? undefined
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const redirectUrl = new URL(`/payments/business-plan/${payment.id}`, req.url);
  if (result.payment?.status === "succeeded") {
    redirectUrl.pathname = payment.businessType === "dealer" ? "/dealer" : "/parts";
    redirectUrl.searchParams.set("subscription", "success");
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

  const payment = (await getBusinessPlanPayment(incomingId))
    ?? (await getBusinessPlanPaymentByRemoteOrderId(incomingId));
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Ödəniş tapılmadı" }, { status: 404 });
  }

  const verify = verifyKapitalBankWebhookSignature({
    rawBody: raw,
    signature: req.headers.get("x-signature") ?? req.headers.get("x-callback-signature") ?? body.signature,
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

  const result = await finalizeBusinessPlanPayment({
    paymentId: payment.id,
    status: resolved.status,
    providerReference: resolved.providerReference ?? body.reference ?? body.payload?.id
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, payment: result.payment });
}
