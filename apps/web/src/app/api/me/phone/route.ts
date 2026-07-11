import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import {
  consumePhoneOtpChallenge,
  isPhoneAlreadyUsed,
  normalizePhoneNumber,
  setVerifiedPhoneForUser
} from "@/server/user-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olun." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`phone-verify:me:${user.id}`, 8, 15);
  if (!limit.ok) return rateLimitResponse(60);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  const payload = body as { phone?: string; phoneOtpChallengeId?: string; phoneOtpCode?: string };
  const phoneRaw = String(payload.phone ?? "").trim();
  const challengeId = String(payload.phoneOtpChallengeId ?? "").trim();
  const otpCode = String(payload.phoneOtpCode ?? "").trim();

  const normalizedPhone = normalizePhoneNumber(phoneRaw);
  if (!normalizedPhone) {
    return NextResponse.json({ ok: false, error: "Telefon nömrəsi düzgün deyil." }, { status: 400 });
  }
  if (!challengeId || !otpCode) {
    return NextResponse.json({ ok: false, error: "Təsdiq kodu tələb olunur." }, { status: 400 });
  }

  if (await isPhoneAlreadyUsed(normalizedPhone, user.id)) {
    return NextResponse.json({ ok: false, error: "Bu telefon nömrəsi artıq başqa hesabda istifadə olunur." }, { status: 409 });
  }

  const otpCheck = await consumePhoneOtpChallenge({
    challengeId,
    phoneNormalized: normalizedPhone,
    otpCode
  });
  if (!otpCheck.ok) {
    return NextResponse.json({ ok: false, error: otpCheck.error }, { status: 400 });
  }

  await setVerifiedPhoneForUser({
    userId: user.id,
    phone: phoneRaw,
    phoneNormalized: normalizedPhone
  });

  return NextResponse.json({ ok: true, phone: phoneRaw });
}
