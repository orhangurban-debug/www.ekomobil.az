import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { hasActiveBusinessSubscription, upsertBusinessPlanSubscription } from "@/server/business-plan-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/business/store-setup
 *
 * Tap.az modeli: istifadəçi admin gözləmədən dərhal mağazasını aktivləşdirir.
 * 30 günlük pulsuz sınaq → sonra "baza" planı üçün ödəniş tələb olunur.
 *
 * Şərtlər:
 * - İstifadəçi daxil olmuş olmalıdır
 * - Artıq aktiv parts_store abunəliyi olmamalıdır
 * - Eyni hesabda bir dəfə sınaq hüququ var
 */
export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Mağaza açmaq üçün hesabınıza daxil olun." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`store-setup:${user.id}:${ip}`, 5, 60);
  if (!limit.ok) return rateLimitResponse(300);

  // Artıq aktiv abunəlik varsa rədd et
  const alreadyActive = await hasActiveBusinessSubscription(user.id, "parts_store");
  if (alreadyActive) {
    return NextResponse.json({
      ok: false,
      error: "Artıq aktiv mağaza abunəliyiniz var."
    }, { status: 409 });
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const sub = await upsertBusinessPlanSubscription({
      ownerUserId: user.id,
      businessType: "parts_store",
      planId: "baza",
      status: "active",
      startsAt: now.toISOString(),
      expiresAt: trialEnd.toISOString(),
      trialGrantedAt: now.toISOString()
    });

    return NextResponse.json({
      ok: true,
      trialEndsAt: sub.expiresAt,
      message: "Mağazanız aktivləşdirildi. 30 günlük pulsuz sınaq başladı."
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Mağaza aktivləşdirilə bilmədi. Yenidən cəhd edin." }, { status: 500 });
  }
}
