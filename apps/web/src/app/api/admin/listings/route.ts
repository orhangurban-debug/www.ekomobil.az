import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { bulkUpdateListingStatus, listAdminListingsPaged } from "@/server/admin-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const q = url.searchParams.get("q") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const listingKind = url.searchParams.get("listingKind") || undefined;
  const sellerType = url.searchParams.get("sellerType") || undefined;
  const city = url.searchParams.get("city") || undefined;
  const sortBy = (url.searchParams.get("sortBy") as "created_at" | "price_azn" | "year" | null) ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc" | null) ?? undefined;
  const data = await listAdminListingsPaged({
    page,
    pageSize,
    q,
    status,
    listingKind,
    sellerType,
    city,
    sortBy,
    sortDir
  });
  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as {
    listingIds?: string[];
    status?: string;
    reason?: string;
  };
  const listingIds = Array.isArray(body.listingIds) ? body.listingIds.filter(Boolean) : [];
  if (listingIds.length === 0 || !body.status) {
    return NextResponse.json({ ok: false, error: "listingIds and status are required." }, { status: 400 });
  }
  const allowed = new Set(["active", "inactive", "archived", "rejected", "pending_review"]);
  if (!allowed.has(body.status)) {
    return NextResponse.json({ ok: false, error: "Invalid listing status." }, { status: 400 });
  }
  const updated = await bulkUpdateListingStatus(listingIds, body.status);
  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "bulk_listing_status_update",
    entityType: "listing",
    reason: body.reason,
    metadata: { listingIds, status: body.status, updated }
  });
  return NextResponse.json({ ok: true, updated });
}
