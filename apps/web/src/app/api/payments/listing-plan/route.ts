import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { isPaidPlan, type PlanType } from "@/lib/listing-plans";
import { type ListingPlanPaymentRecord } from "@/lib/payments";
import { createListingPlanPayment } from "@/server/payment-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`pay-listing-plan:${user.id}:${ip}`, 10, 1);
  if (!limit.ok) return rateLimitResponse(60);

  let body: {
    listingId?: string;
    planType?: PlanType;
    source?: "publish" | "boost";
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  if (!body.listingId?.trim()) {
    return NextResponse.json({ ok: false, error: "Listing ID tələb olunur" }, { status: 400 });
  }

  if (!body.planType || !isPaidPlan(body.planType)) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün paid plan seçin" }, { status: 400 });
  }

  try {
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
  } catch (error) {
    console.error("create listing-plan payment error:", error);
    return NextResponse.json({ ok: false, error: "Ödəniş sessiyası yaradıla bilmədi." }, { status: 500 });
  }
}
