import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getBoostPackageById } from "@/server/listing-boost-store";
import { createListingBoostPayment } from "@/server/listing-boost-payment-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }

  const body = (await req.json()) as {
    listingId?: string;
    packageId?: string;
  };

  if (!body.listingId?.trim()) {
    return NextResponse.json({ ok: false, error: "Listing ID tələb olunur" }, { status: 400 });
  }
  if (!body.packageId?.trim()) {
    return NextResponse.json({ ok: false, error: "Boost paketi tələb olunur" }, { status: 400 });
  }
  if (!getBoostPackageById(body.packageId)) {
    return NextResponse.json({ ok: false, error: "Boost paketi tapılmadı" }, { status: 400 });
  }

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
}
