import { NextResponse } from "next/server";
import { runAuctionSlaReminderSweep } from "@/server/auction-sla-reminder-store";

function isAuthorizedCronRequest(req: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) return process.env.NODE_ENV !== "production";
  const authHeader = req.headers.get("authorization")?.trim() ?? "";
  return authHeader === `Bearer ${configuredSecret}`;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured for production" },
      { status: 500 }
    );
  }
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron request" }, { status: 401 });
  }

  const summary = await runAuctionSlaReminderSweep();
  return NextResponse.json({
    ok: true,
    summary
  });
}
