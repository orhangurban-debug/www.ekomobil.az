import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { listPendingDefenseReportsForUser } from "@/server/user-report-store";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş tələb olunur." }, { status: 401 });
  }

  const reports = await listPendingDefenseReportsForUser(user.id);
  return NextResponse.json({ ok: true, reports });
}
