import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName } from "@/lib/auth";
import { createUserAccount } from "@/server/user-store";
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
    const user = await createUserAccount({
      email: parsed.email,
      password: parsed.password,
      fullName: parsed.fullName,
      city: parsed.city,
      phone: parsed.phone,
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
    return NextResponse.json({ ok: false, error: "Hesab yaradıla bilmədi. Email artıq istifadə olunur." }, { status: 400 });
  }
}
