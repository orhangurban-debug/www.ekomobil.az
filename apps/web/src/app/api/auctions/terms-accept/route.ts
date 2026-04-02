import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import {
  recordAuctionTermsAcceptance,
  type AuctionTermsRole
} from "@/server/auction-terms-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı" }, { status: 400 });
  }

  const role = (body as Record<string, unknown>)?.role;
  if (role !== "bidder" && role !== "seller") {
    return NextResponse.json(
      { ok: false, error: "Rol 'bidder' və ya 'seller' olmalıdır" },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") ?? undefined;

  const result = await recordAuctionTermsAcceptance({
    userId: user.id,
    role: role as AuctionTermsRole,
    ipAddress: ip,
    userAgent: ua
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
