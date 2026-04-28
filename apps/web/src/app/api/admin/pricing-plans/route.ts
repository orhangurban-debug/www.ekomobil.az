import { NextResponse } from "next/server";
import type { PricingPlanAdminConfig } from "@/lib/pricing-plan-config";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { getPricingPlanAdminConfig, updatePricingPlanAdminConfig } from "@/server/system-settings-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const config = await getPricingPlanAdminConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { config?: PricingPlanAdminConfig };
  if (!body.config) {
    return NextResponse.json({ ok: false, error: "Plan konfiqurasiyası göndərilməyib." }, { status: 400 });
  }

  try {
    const saved = await updatePricingPlanAdminConfig(body.config);
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "pricing_plan_config_updated",
      entityType: "settings",
      entityId: "pricing_plans",
      metadata: saved
    });
    return NextResponse.json({ ok: true, config: saved });
  } catch {
    return NextResponse.json({ ok: false, error: "Plan ayarları saxlanmadı." }, { status: 500 });
  }
}
