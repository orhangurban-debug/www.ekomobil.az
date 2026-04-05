import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import {
  bulkUpdateAdminBusinessProfiles,
  listAdminBusinessProfilesPaged,
  updateAdminBusinessProfile
} from "@/server/admin-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 25);
  const q = searchParams.get("q") || undefined;
  const data = await listAdminBusinessProfilesPaged({ page, pageSize, q });
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    dealerId?: string;
    dealerIds?: string[];
    verified?: boolean;
    showWhatsapp?: boolean;
    showWebsite?: boolean;
  };
  if (!body.dealerId && (!Array.isArray(body.dealerIds) || body.dealerIds.length === 0)) {
    return NextResponse.json({ ok: false, error: "dealerId və ya dealerIds tələb olunur." }, { status: 400 });
  }

  if (Array.isArray(body.dealerIds) && body.dealerIds.length > 0) {
    const updatedCount = await bulkUpdateAdminBusinessProfiles({
      dealerIds: body.dealerIds,
      verified: body.verified,
      showWhatsapp: body.showWhatsapp,
      showWebsite: body.showWebsite
    });

    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "business_profile_bulk_updated",
      entityType: "dealer_profile",
      metadata: {
        dealerIds: body.dealerIds,
        updatedCount,
        verified: body.verified,
        showWhatsapp: body.showWhatsapp,
        showWebsite: body.showWebsite
      }
    });

    return NextResponse.json({ ok: true, updatedCount });
  }

  await updateAdminBusinessProfile({
    dealerId: body.dealerId,
    verified: body.verified,
    showWhatsapp: body.showWhatsapp,
    showWebsite: body.showWebsite
  });

  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "business_profile_updated",
    entityType: "dealer_profile",
    entityId: body.dealerId,
    metadata: {
      verified: body.verified,
      showWhatsapp: body.showWhatsapp,
      showWebsite: body.showWebsite
    }
  });

  return NextResponse.json({ ok: true });
}
