import { NextResponse } from "next/server";
import { finalizeAuctionDeposit } from "@/server/auction-payment-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ depositId: string }> }
) {
  const { depositId } = await context.params;
  const formData = await req.formData().catch(() => null);
  const body = (await req.json().catch(() => ({}))) as { status?: "succeeded" | "failed" | "cancelled" };
  const status = (formData?.get("status")?.toString() ?? body.status ?? "failed") as "succeeded" | "failed" | "cancelled";

  const result = await finalizeAuctionDeposit({
    depositId,
    status,
    paymentReference: status === "succeeded" ? `mock-${depositId}` : undefined
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.redirect(new URL(`/payments/auction-deposit/${depositId}?status=${status}`, req.url));
}
