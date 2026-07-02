import { NextResponse } from "next/server";
import { getSessionCookieName, getSessionCookieDomain } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const name = getSessionCookieName();
  const baseClear = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0
  };

  // Host-only cookie-ni təmizlə (email login köhnə sessiyaları üçün).
  res.cookies.set(name, "", baseClear);

  // Domain-scoped cookie-ni də təmizlə (Google OAuth / apex+www ilə daxil olanlar üçün) —
  // əks halda logout-dan sonra istifadəçi daxil qalırdı.
  const domain = getSessionCookieDomain();
  if (domain) {
    res.cookies.set(name, "", { ...baseClear, domain });
  }

  return res;
}
