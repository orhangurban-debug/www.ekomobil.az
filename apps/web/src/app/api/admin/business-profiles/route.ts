import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { listAdminBusinessProfilesPaged, updateAdminBusinessProfile } from "@/server/admin-store";

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
    verified?: boolean;
    showWhatsapp?: boolean;
    showWebsite?: boolean;
  };
  if (!body.dealerId) {
    return NextResponse.json({ ok: false, error: "dealerId tələb olunur." }, { status: 400 });
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
