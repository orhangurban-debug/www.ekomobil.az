import { NextResponse } from "next/server";
import { getKapitalBankConfig } from "@/lib/kapital-bank";
import {
  finalizeBusinessPlanPayment,
  getBusinessPlanPayment
} from "@/server/business-plan-payment-store";

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

  const result = await finalizeBusinessPlanPayment({
    paymentId,
    status,
    providerReference: `mock-${paymentId}`
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const payment = result.payment ?? (await getBusinessPlanPayment(paymentId));
  const nextUrl = new URL(payment ? `/payments/business-plan/${paymentId}` : "/", req.url);
  if (payment && status === "succeeded") {
    nextUrl.pathname = payment.businessType === "dealer" ? "/dealer" : "/parts";
    nextUrl.searchParams.set("subscription", "success");
  } else {
    nextUrl.searchParams.set("status", status);
  }
  return NextResponse.redirect(nextUrl);
}
