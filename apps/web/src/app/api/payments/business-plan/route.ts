import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { createBusinessPlanPayment } from "@/server/business-plan-payment-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }
  if (!["dealer", "admin"].includes(user.role)) {
    return NextResponse.json({ ok: false, error: "Bu ödəniş yalnız dealer hesabları üçündür." }, { status: 403 });
  }

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
      status: result.payment.status
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Biznes plan ödənişi yaradıla bilmədi." }, { status: 500 });
  }
}
