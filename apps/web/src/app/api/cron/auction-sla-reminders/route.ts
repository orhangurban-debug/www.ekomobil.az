import { NextResponse } from "next/server";
import { runAuctionSlaReminderSweep } from "@/server/auction-sla-reminder-store";

function isAuthorizedCronRequest(req: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (configuredSecret) {
    const authHeader = req.headers.get("authorization")?.trim() ?? "";
    return authHeader === `Bearer ${configuredSecret}`;
  }

  // Fallback for environments where only Vercel cron header is available.
  // In production, set CRON_SECRET for stronger protection.
  const vercelCronHeader = req.headers.get("x-vercel-cron");
  if (vercelCronHeader === "1") return true;

  // Local development convenience.
  return process.env.NODE_ENV !== "production";
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  const summary = await runAuctionSlaReminderSweep();
  return NextResponse.json({
    ok: true,
    summary
  });
}
