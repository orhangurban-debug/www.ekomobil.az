import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { isPaidPlan, type PlanType } from "@/lib/listing-plans";
import { type ListingPlanPaymentRecord } from "@/lib/payments";
import { createListingPlanPayment } from "@/server/payment-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }

  const body = (await req.json()) as {
    listingId?: string;
    planType?: PlanType;
    source?: "publish" | "boost";
  };

  if (!body.listingId?.trim()) {
    return NextResponse.json({ ok: false, error: "Listing ID tələb olunur" }, { status: 400 });
  }

  if (!body.planType || !isPaidPlan(body.planType)) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün paid plan seçin" }, { status: 400 });
  }

  const result = await createListingPlanPayment({
    listingId: body.listingId,
    ownerUserId: user.id,
    planType: body.planType as ListingPlanPaymentRecord["planType"],
    source: body.source ?? "boost"
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    paymentId: result.payment.id,
    checkoutUrl: result.payment.checkoutUrl,
    status: result.payment.status
  });
}
