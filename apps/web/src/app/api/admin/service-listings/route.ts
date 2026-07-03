import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { listServiceListingsForAdmin, updateServiceListingStatus, type ServiceListingStatus } from "@/server/service-listing-store";

const VALID_STATUSES: ServiceListingStatus[] = ["pending", "approved", "rejected"];

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const status = statusParam && (VALID_STATUSES as string[]).includes(statusParam) ? (statusParam as ServiceListingStatus) : undefined;
  const items = await listServiceListingsForAdmin({ status });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { id?: string; status?: string };
  if (!body.id || !body.status || !(VALID_STATUSES as string[]).includes(body.status)) {
    return NextResponse.json({ ok: false, error: "id və düzgün status tələb olunur." }, { status: 400 });
  }

  const result = await updateServiceListingStatus(body.id, body.status as ServiceListingStatus);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Status yenilənə bilmədi." }, { status: 500 });
  }

  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "service_listing_status_updated",
    entityType: "service_listing",
    entityId: body.id,
    metadata: { status: body.status }
  });

  return NextResponse.json({ ok: true });
}
