import { NextResponse } from "next/server";
import { finalizeAuctionServicePayment } from "@/server/auction-payment-store";
import { verifyInternalCallbackSignature } from "@/server/payments/kapital-bank-callback";

export async function POST(
  req: Request,
  context: { params: Promise<{ paymentId: string }> }
) {
  // Block mock endpoint in production entirely
  if (process.env.NODE_ENV === "production" && process.env.KAPITAL_BANK_MODE === "live") {
    return NextResponse.json({ ok: false, error: "Mock endpoint production-da əlçatmazdır" }, { status: 403 });
  }

  const { paymentId } = await context.params;

  let status: "succeeded" | "failed" | "cancelled" = "failed";
  let signature: string | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as {
      status?: "succeeded" | "failed" | "cancelled";
      signature?: string;
    };
    status = body.status ?? "failed";
    signature = body.signature;
  } else {
    const formData = await req.formData().catch(() => null);
    status = (formData?.get("status")?.toString() ?? "failed") as "succeeded" | "failed" | "cancelled";
    signature = formData?.get("signature")?.toString();
  }

  // Verify internal HMAC signature (skipped in dev without AUTH_SECRET set)
  const sigCheck = verifyInternalCallbackSignature({ paymentId, status, signature });
  if (!sigCheck.ok) {
    return NextResponse.json({ ok: false, error: sigCheck.reason }, { status: 403 });
  }

  const result = await finalizeAuctionServicePayment({
    paymentId,
    status,
    paymentReference: status === "succeeded" ? `mock-${paymentId}` : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.redirect(new URL(`/payments/auction-service/${paymentId}?status=${status}`, req.url));
}
