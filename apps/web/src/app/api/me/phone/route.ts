import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { isPhoneAlreadyUsed, normalizePhoneNumber, setPhoneForUser } from "@/server/user-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olun." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`phone-save:me:${user.id}`, 10, 15);
  if (!limit.ok) return rateLimitResponse(60);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  const phoneRaw = String((body as { phone?: string }).phone ?? "").trim();
  const normalizedPhone = normalizePhoneNumber(phoneRaw);
  if (!normalizedPhone) {
    return NextResponse.json({ ok: false, error: "Telefon nömrəsi düzgün deyil." }, { status: 400 });
  }

  if (await isPhoneAlreadyUsed(normalizedPhone, user.id)) {
    return NextResponse.json({ ok: false, error: "Bu telefon nömrəsi artıq başqa hesabda istifadə olunur." }, { status: 409 });
  }

  await setPhoneForUser({
    userId: user.id,
    phone: phoneRaw,
    phoneNormalized: normalizedPhone,
    verified: false
  });

  return NextResponse.json({ ok: true, phone: phoneRaw });
}
