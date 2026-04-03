import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { listAdminAuctionsPaged, setAuctionAdminControls } from "@/server/admin-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const q = url.searchParams.get("q") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const mode = url.searchParams.get("mode") || undefined;
  const freezeBidding = (url.searchParams.get("freezeBidding") as "true" | "false" | null) ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc" | null) ?? undefined;
  const data = await listAdminAuctionsPaged({ page, pageSize, q, status, mode, freezeBidding, sortDir });
  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as {
    auctionId?: string;
    freezeBidding?: boolean;
    forceManualReview?: boolean;
    note?: string;
    reason?: string;
  };
  if (!body.auctionId) {
    return NextResponse.json({ ok: false, error: "auctionId is required." }, { status: 400 });
  }
  await setAuctionAdminControls({
    auctionId: body.auctionId,
    actorUserId: auth.user.id,
    freezeBidding: body.freezeBidding,
    forceManualReview: body.forceManualReview,
    note: body.note
  });
  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "auction_admin_control_updated",
    entityType: "auction",
    entityId: body.auctionId,
    reason: body.reason,
    metadata: {
      freezeBidding: body.freezeBidding,
      forceManualReview: body.forceManualReview,
      note: body.note
    }
  });
  return NextResponse.json({ ok: true });
}
