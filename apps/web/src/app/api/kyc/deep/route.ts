import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { deepKycSubmitSchema, parseOrThrow, ValidationError } from "@/lib/validate";
import { getUserKycProfile, submitDeepKyc } from "@/server/user-kyc-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });

  const profile = await getUserKycProfile(user.id);
  return NextResponse.json({ ok: true, profile });
}

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`deep-kyc-submit:${user.id}:${ip}`, 5, 60);
  if (!limit.ok) return rateLimitResponse(300);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseOrThrow(deepKycSubmitSchema, body);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Yanlış məlumat." },
      { status: 400 }
    );
  }

  const profile = await submitDeepKyc({
    userId: user.id,
    legalName: parsed.legalName,
    nationalIdLast4: parsed.nationalIdLast4,
    documentRef: parsed.documentRef
  });

  return NextResponse.json({ ok: true, profile });
}
