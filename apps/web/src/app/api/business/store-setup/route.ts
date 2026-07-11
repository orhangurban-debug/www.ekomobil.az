import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";

/**
 * POST /api/business/store-setup
 *
 * @deprecated Mağaza yalnız admin təsdiqi ilə /parts/apply axınından aktivləşir.
 */
export async function POST() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Mağaza açmaq üçün hesabınıza daxil olun." }, { status: 401 });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "Mağaza qeydiyyatı admin təsdiqi tələb edir. /parts/apply səhifəsindən müraciət göndərin.",
      redirectTo: "/parts/apply",
    },
    { status: 410 }
  );
}
