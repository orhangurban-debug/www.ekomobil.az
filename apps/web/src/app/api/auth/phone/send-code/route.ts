import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createPhoneOtpChallenge, isPhoneAlreadyUsed, normalizePhoneNumber } from "@/server/user-store";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit(`phone-otp:send:ip:${ip}`, 8, 60);
  if (!ipLimit.ok) return rateLimitResponse(120);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  const phoneRaw = typeof body === "object" && body && "phone" in body ? String((body as { phone?: string }).phone ?? "") : "";
  const normalizedPhone = normalizePhoneNumber(phoneRaw);
  if (!normalizedPhone) {
    return NextResponse.json({ ok: false, error: "Telefon nömrəsi düzgün deyil." }, { status: 400 });
  }

  const phoneLimit = await checkRateLimit(`phone-otp:send:phone:${normalizedPhone}`, 5, 60);
  if (!phoneLimit.ok) return rateLimitResponse(180);

  // Keep response generic to avoid account enumeration by phone number.
  if (await isPhoneAlreadyUsed(normalizedPhone)) {
    return NextResponse.json({
      ok: true,
      challengeId: null,
      expiresAt: null
    });
  }

  const challenge = await createPhoneOtpChallenge({ phoneNormalized: normalizedPhone });
  return NextResponse.json({
    ok: true,
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
    // Only exposed when ALLOW_OTP_PLAINTEXT_IN_RESPONSE=true in non-production.
    code: challenge.codeForDev
  });
}
