import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getBoostPackageById } from "@/server/listing-boost-store";
import { createListingBoostPayment } from "@/server/listing-boost-payment-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`pay-listing-boost:${user.id}:${ip}`, 10, 1);
  if (!limit.ok) return rateLimitResponse(60);

  let body: {
    listingId?: string;
    packageId?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  if (!body.listingId?.trim()) {
    return NextResponse.json({ ok: false, error: "Listing ID tələb olunur" }, { status: 400 });
  }
  if (!body.packageId?.trim()) {
    return NextResponse.json({ ok: false, error: "İrəlilətmə paketi tələb olunur" }, { status: 400 });
  }
  if (!getBoostPackageById(body.packageId)) {
    return NextResponse.json({ ok: false, error: "İrəlilətmə paketi tapılmadı" }, { status: 400 });
  }

  try {
    const result = await createListingBoostPayment({
      listingId: body.listingId.trim(),
      ownerUserId: user.id,
      packageId: body.packageId.trim()
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
    console.error("create listing-boost payment error:", error);
    return NextResponse.json({ ok: false, error: "Ödəniş sessiyası yaradıla bilmədi." }, { status: 500 });
  }
}
