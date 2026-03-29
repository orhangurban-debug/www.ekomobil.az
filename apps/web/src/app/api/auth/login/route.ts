import { NextResponse } from "next/server";
import { authenticateUser, createSessionToken, getSessionCookieName } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { loginSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function POST(req: Request) {
  // Rate limit: 5 attempts per minute per IP, 20 per 15 minutes
  const ip = getClientIp(req);
  const [perMinute, per15Min] = await Promise.all([
    checkRateLimit(`login:1m:${ip}`, 5, 1),
    checkRateLimit(`login:15m:${ip}`, 20, 15),
  ]);
  if (!perMinute.ok || !per15Min.ok) {
    return rateLimitResponse(60);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseOrThrow(loginSchema, body);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Giriş məlumatları yanlışdır." },
      { status: 400 }
    );
  }

  const user = await authenticateUser(parsed.email, parsed.password);
  if (!user) {
    // Intentionally vague to prevent user enumeration
    return NextResponse.json({ ok: false, error: "Email və ya şifrə yanlışdır." }, { status: 401 });
  }

  const token = createSessionToken(user);
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return res;
}
