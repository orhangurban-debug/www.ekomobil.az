import { NextResponse } from "next/server";
import { escalateReportsWithoutDefense } from "@/server/user-report-store";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const escalated = await escalateReportsWithoutDefense();
  return NextResponse.json({ ok: true, escalated });
}
