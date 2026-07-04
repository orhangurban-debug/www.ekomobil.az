import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { createBusinessPlanPayment } from "@/server/business-plan-payment-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`pay-business-plan:${user.id}:${ip}`, 10, 1);
  if (!limit.ok) return rateLimitResponse(60);

  const body = (await req.json().catch(() => ({}))) as {
    businessType?: "dealer" | "parts_store";
    planId?: string;
  };
  if (!body.businessType || !body.planId) {
    return NextResponse.json({ ok: false, error: "businessType və planId tələb olunur." }, { status: 400 });
  }
  if (!["dealer", "parts_store"].includes(body.businessType)) {
    return NextResponse.json({ ok: false, error: "Biznes tipi yanlışdır." }, { status: 400 });
  }
  if (body.businessType === "dealer" && !["dealer", "admin"].includes(user.role)) {
    return NextResponse.json({ ok: false, error: "Salon planı yalnız təsdiqlənmiş salon hesabları üçündür." }, { status: 403 });
  }

  try {
    const result = await createBusinessPlanPayment({
      ownerUserId: user.id,
      businessType: body.businessType,
      planId: body.planId
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      paymentId: result.payment.id,
      checkoutUrl: result.payment.checkoutUrl,
      status: result.payment.status,
      isTrial: result.isTrial ?? false,
      expiresAt: result.payment.expiresAt ?? null
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Biznes plan ödənişi yaradıla bilmədi." }, { status: 500 });
  }
}
