import { NextResponse } from "next/server";
import { listManualReviews } from "@/server/review-store";
import { requireApiRoles } from "@/lib/rbac";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    ok: true,
    items: await listManualReviews()
  });
}
