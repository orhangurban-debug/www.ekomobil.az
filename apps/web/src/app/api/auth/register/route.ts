import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName } from "@/lib/auth";
import { consumePhoneOtpChallenge, createUserAccount, isPhoneAlreadyUsed, normalizePhoneNumber } from "@/server/user-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { registerSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function POST(req: Request) {
  // Rate limit: 3 registrations per hour per IP
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`register:1h:${ip}`, 3, 60);
  if (!limit.ok) {
    return rateLimitResponse(300);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseOrThrow(registerSchema, body);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Giriş məlumatları yanlışdır." },
      { status: 400 }
    );
  }

  try {
    const normalizedPhone = normalizePhoneNumber(parsed.phone);
    if (!normalizedPhone) {
      return NextResponse.json({ ok: false, error: "Telefon nömrəsi düzgün deyil." }, { status: 400 });
    }

    const otpCheck = await consumePhoneOtpChallenge({
      challengeId: parsed.phoneOtpChallengeId,
      phoneNormalized: normalizedPhone,
      otpCode: parsed.phoneOtpCode
    });
    if (!otpCheck.ok) {
      return NextResponse.json({ ok: false, error: otpCheck.error }, { status: 400 });
    }

    if (await isPhoneAlreadyUsed(normalizedPhone)) {
      return NextResponse.json(
        { ok: false, error: "Bu telefon nömrəsi ilə artıq hesab mövcuddur." },
        { status: 409 }
      );
    }

    const user = await createUserAccount({
      email: parsed.email,
      password: parsed.password,
      fullName: parsed.fullName,
      city: parsed.city,
      phone: parsed.phone,
      phoneNormalized: normalizedPhone,
      phoneVerified: true
    });

    const token = createSessionToken({ id: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Hesab yaradıla bilmədi. Email və ya telefon artıq istifadə olunur." },
      { status: 400 }
    );
  }
}
