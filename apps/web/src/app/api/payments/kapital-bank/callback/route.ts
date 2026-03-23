import { NextResponse } from "next/server";
import { finalizeListingPlanPayment, getListingPlanPayment } from "@/server/payment-store";
import { resolveKapitalBankPaymentStatus, verifyKapitalBankCallbackPlaceholder } from "@/server/payments/kapital-bank-callback";

export async function GET(req: Request) {
  const url = new URL(req.url);
  verifyKapitalBankCallbackPlaceholder({
    signature: url.searchParams.get("signature")
  });
  const paymentId = url.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }
  const payment = await getListingPlanPayment(paymentId);
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Ödəniş tapılmadı" }, { status: 404 });
  }
  const resolved = await resolveKapitalBankPaymentStatus({
    fallbackStatus: url.searchParams.get("status"),
    providerPayload: payment.providerPayload
  });

  const result = await finalizeListingPlanPayment({
    paymentId,
    status: resolved.status,
    providerReference: resolved.providerReference ?? url.searchParams.get("reference") ?? undefined
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const redirectUrl = new URL(`/payments/listing-plan/${paymentId}`, req.url);
  if (result.payment?.status === "succeeded") {
    redirectUrl.pathname = `/listings/${result.payment.listingId}`;
    redirectUrl.searchParams.set("payment", "success");
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
  verifyKapitalBankCallbackPlaceholder({
    body,
    signature: body.signature ?? null
  });
  if (!body.paymentId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }
  const payment = await getListingPlanPayment(body.paymentId);
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Ödəniş tapılmadı" }, { status: 404 });
  }
  const resolved = await resolveKapitalBankPaymentStatus({
    fallbackStatus: body.status ?? null,
    providerPayload: payment.providerPayload
  });

  const result = await finalizeListingPlanPayment({
    paymentId: body.paymentId,
    status: resolved.status,
    providerReference: resolved.providerReference ?? body.reference
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, payment: result.payment });
}
