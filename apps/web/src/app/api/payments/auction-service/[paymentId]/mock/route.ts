import { NextResponse } from "next/server";
import { finalizeAuctionServicePayment } from "@/server/auction-payment-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await context.params;
  const formData = await req.formData().catch(() => null);
  const body = (await req.json().catch(() => ({}))) as { status?: "succeeded" | "failed" | "cancelled" };
  const status = (formData?.get("status")?.toString() ?? body.status ?? "failed") as "succeeded" | "failed" | "cancelled";

  const result = await finalizeAuctionServicePayment({
    paymentId,
    status,
    paymentReference: status === "succeeded" ? `mock-${paymentId}` : undefined
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.redirect(new URL(`/payments/auction-service/${paymentId}?status=${status}`, req.url));
}
