import { NextResponse } from "next/server";
import { finalizeListingPlanPayment } from "@/server/payment-store";

function toInternalStatus(status: string | null): "succeeded" | "failed" | "cancelled" {
  const normalized = status?.toLowerCase();
  if (normalized === "ok" || normalized === "success" || normalized === "succeeded") {
    return "succeeded";
  }
  if (normalized === "cancel" || normalized === "cancelled") {
    return "cancelled";
  }
  return "failed";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }

  const result = await finalizeListingPlanPayment({
    paymentId,
    status: toInternalStatus(url.searchParams.get("status")),
    providerReference: url.searchParams.get("reference") ?? undefined
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
  };
  if (!body.paymentId) {
    return NextResponse.json({ ok: false, error: "paymentId tələb olunur" }, { status: 400 });
  }

  const result = await finalizeListingPlanPayment({
    paymentId: body.paymentId,
    status: toInternalStatus(body.status ?? null),
    providerReference: body.reference
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, payment: result.payment });
}
