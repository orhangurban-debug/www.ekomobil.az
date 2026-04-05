import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import {
  listBusinessPlanSubscriptions,
  upsertBusinessPlanSubscription,
  type BusinessType
} from "@/server/business-plan-store";
import { createAdminAuditLog } from "@/server/admin-audit-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const items = await listBusinessPlanSubscriptions(300);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    ownerUserId?: string;
    businessType?: BusinessType;
    planId?: string;
    status?: "active" | "expired" | "cancelled";
    startsAt?: string;
    expiresAt?: string;
  };

  if (!body.ownerUserId || !body.businessType || !body.planId || !body.status) {
    return NextResponse.json({ ok: false, error: "Tələb olunan sahələr doldurulmalıdır." }, { status: 400 });
  }

  if (!["dealer", "parts_store"].includes(body.businessType)) {
    return NextResponse.json({ ok: false, error: "Biznes tipi yanlışdır." }, { status: 400 });
  }

  if (!["active", "expired", "cancelled"].includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Abunə statusu yanlışdır." }, { status: 400 });
  }

  try {
    const saved = await upsertBusinessPlanSubscription({
      ownerUserId: body.ownerUserId,
      businessType: body.businessType,
      planId: body.planId,
      status: body.status,
      startsAt: body.startsAt,
      expiresAt: body.expiresAt
    });

    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "business_plan_subscription_upserted",
      entityType: "business_plan_subscription",
      entityId: saved.id,
      metadata: saved
    });

    return NextResponse.json({ ok: true, item: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Abunə yenilənə bilmədi.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
