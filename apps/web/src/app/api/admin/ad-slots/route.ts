import { NextResponse } from "next/server";
import type { AdSlotsConfig } from "@/lib/ad-slots-config";
import { parseAdSlotsConfig } from "@/lib/ad-slots-config";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { getAdSlotsConfig, updateAdSlotsConfig } from "@/server/system-settings-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const config = await getAdSlotsConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as Partial<AdSlotsConfig>;
  try {
    const current = await getAdSlotsConfig();
    const updated = await updateAdSlotsConfig(
      parseAdSlotsConfig({
        ...current,
        slots: Array.isArray(body.slots) ? body.slots : current.slots,
        pricingNotes: body.pricingNotes ?? current.pricingNotes,
        contactEmail: body.contactEmail ?? current.contactEmail
      })
    );
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "ad_slots_config_updated",
      entityType: "settings",
      entityId: "ad_slots_config",
      metadata: {
        enabledCount: updated.slots.filter((s) => s.enabled).length,
        slotCount: updated.slots.length
      }
    });
    return NextResponse.json({ ok: true, config: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Reklam slotlarını saxlamaq mümkün olmadı." }, { status: 500 });
  }
}
