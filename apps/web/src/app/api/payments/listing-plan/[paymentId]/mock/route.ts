import { NextResponse } from "next/server";
import { getKapitalBankConfig } from "@/lib/kapital-bank";
import { finalizeListingPlanPayment, getListingPlanPayment } from "@/server/payment-store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const config = getKapitalBankConfig();
  if (config.mode !== "mock") {
    return NextResponse.json({ ok: false, error: "Mock payment mode aktiv deyil" }, { status: 403 });
  }

  const { paymentId } = await params;
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? ((await req.json().catch(() => ({}))) as { status?: "succeeded" | "failed" | "cancelled" })
    : { status: (await req.formData().catch(() => null))?.get("status")?.toString() as "succeeded" | "failed" | "cancelled" | undefined };
  const status = body.status ?? "failed";

  const result = await finalizeListingPlanPayment({ paymentId, status, providerReference: `mock-${paymentId}` });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const payment = result.payment ?? (await getListingPlanPayment(paymentId));
  const nextUrl = new URL(payment ? `/payments/listing-plan/${paymentId}` : "/", req.url);
  if (payment && status === "succeeded") {
    nextUrl.pathname = `/listings/${payment.listingId}`;
    nextUrl.searchParams.set("payment", "success");
  } else {
    nextUrl.searchParams.set("status", status);
  }

  return NextResponse.redirect(nextUrl);
}
