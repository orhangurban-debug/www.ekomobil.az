import { NextResponse } from "next/server";
import {
  finalizeAuctionPreauth,
  getAuctionPreauth,
  getAuctionPreauthByRemoteOrderId
} from "@/server/auction-preauth-store";
import {
  resolveKapitalBankPaymentStatus,
  verifyKapitalBankWebhookSignature
} from "@/server/payments/kapital-bank-callback";

async function handle(preauthId: string, status: string | null, reference?: string | null) {
  const preauth = (await getAuctionPreauth(preauthId))
    ?? (await getAuctionPreauthByRemoteOrderId(preauthId));
  if (!preauth) {
    return { ok: false as const, statusCode: 404, body: { ok: false, error: "Pre-auth tapılmadı" } };
  }

  let resolved;
  try {
    resolved = await resolveKapitalBankPaymentStatus({
      fallbackStatus: status,
      providerPayload: preauth.providerPayload
    });
  } catch {
    return { ok: false as const, statusCode: 400, body: { ok: false, error: "Ödəniş statusu bankdan təsdiqlənmədi" } };
  }

  const finalStatus = resolved.status === "succeeded" ? "held" : "failed";
  const result = await finalizeAuctionPreauth({
    preauthId,
    status: finalStatus,
    paymentReference: resolved.providerReference ?? reference ?? undefined
  });

  if (!result.ok) {
    return { ok: false as const, statusCode: 400, body: { ok: false, error: result.error } };
  }

  return { ok: true as const, preauth: result.preauth };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const preauthId = url.searchParams.get("preauthId");
  if (!preauthId) {
    return NextResponse.json({ ok: false, error: "preauthId tələb olunur" }, { status: 400 });
  }

  const result = await handle(preauthId, url.searchParams.get("status"), url.searchParams.get("reference"));
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.statusCode });
  }

  const redirectUrl = new URL(`/payments/auction-preauth/${preauthId}`, req.url);
  redirectUrl.searchParams.set("status", result.preauth?.status === "held" ? "success" : "failed");
  return NextResponse.redirect(redirectUrl);
}

export async function POST(req: Request) {
  const raw = await req.text();
  let parsed: unknown = {};
  if (raw.trim().length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }
  const body = parsed as {
    preauthId?: string;
    status?: string;
    reference?: string;
    signature?: string;
    id?: string;
    payload?: { id?: string; status?: string };
  };
  const incomingId = body.preauthId ?? body.id ?? body.payload?.id ?? null;
  if (!incomingId) {
    return NextResponse.json({ ok: false, error: "preauthId tələb olunur" }, { status: 400 });
  }
  const preauth = (await getAuctionPreauth(incomingId))
    ?? (await getAuctionPreauthByRemoteOrderId(incomingId));
  if (!preauth) {
    return NextResponse.json({ ok: false, error: "Pre-auth tapılmadı" }, { status: 404 });
  }
  const verify = verifyKapitalBankWebhookSignature({
    rawBody: raw,
    signature: req.headers.get("x-signature") ?? body.signature,
    providerPayload: preauth.providerPayload
  });
  if (!verify.ok) {
    return NextResponse.json({ ok: false, error: verify.reason ?? "Webhook imzası keçərsizdir" }, { status: 401 });
  }

  const result = await handle(preauth.id, body.status ?? body.payload?.status ?? null, body.reference ?? body.payload?.id);
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.statusCode });
  }

  return NextResponse.json({ ok: true, preauth: result.preauth });
}
