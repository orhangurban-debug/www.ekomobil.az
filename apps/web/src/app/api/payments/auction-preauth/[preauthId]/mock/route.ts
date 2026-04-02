import { NextResponse } from "next/server";
import { finalizeAuctionPreauth } from "@/server/auction-preauth-store";
import { verifyInternalCallbackSignature } from "@/server/payments/kapital-bank-callback";

export async function POST(
  req: Request,
  context: { params: Promise<{ preauthId: string }> }
) {
  if (process.env.NODE_ENV === "production" && process.env.KAPITAL_BANK_MODE === "live") {
    return NextResponse.json({ ok: false, error: "Mock endpoint production-da əlçatmazdır" }, { status: 403 });
  }

  const { preauthId } = await context.params;
  let status: "held" | "failed" = "failed";
  let signature: string | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { status?: "held" | "failed"; signature?: string };
    status = body.status ?? "failed";
    signature = body.signature;
  } else {
    const formData = await req.formData().catch(() => null);
    status = (formData?.get("status")?.toString() ?? "failed") as "held" | "failed";
    signature = formData?.get("signature")?.toString();
  }

  const sigCheck = verifyInternalCallbackSignature({
    paymentId: preauthId,
    status,
    signature
  });
  if (!sigCheck.ok) {
    return NextResponse.json({ ok: false, error: sigCheck.reason }, { status: 403 });
  }

  const result = await finalizeAuctionPreauth({
    preauthId,
    status,
    paymentReference: status === "held" ? `mock-${preauthId}` : undefined
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.redirect(new URL(`/payments/auction-preauth/${preauthId}?status=${status}`, req.url));
}
