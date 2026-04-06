import { NextResponse } from "next/server";
import type { BrandSettings } from "@/lib/brand-settings";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { getBrandSettings, updateBrandSettings } from "@/server/system-settings-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const settings = await getBrandSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as Partial<BrandSettings>;
  try {
    const updated = await updateBrandSettings({
      logoUrl: String(body.logoUrl ?? ""),
      logoSquareUrl: String(body.logoSquareUrl ?? ""),
      faviconUrl: String(body.faviconUrl ?? ""),
      primaryColor: String(body.primaryColor ?? ""),
      primaryHoverColor: String(body.primaryHoverColor ?? ""),
      deepBaseColor: String(body.deepBaseColor ?? ""),
      softBrownColor: String(body.softBrownColor ?? ""),
      softBrownBorderColor: String(body.softBrownBorderColor ?? ""),
      canvasColor: String(body.canvasColor ?? ""),
      gallery: Array.isArray(body.gallery) ? body.gallery : []
    });
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "brand_settings_updated",
      entityType: "settings",
      entityId: "brand_settings",
      metadata: {
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
        galleryCount: updated.gallery.length
      }
    });
    return NextResponse.json({ ok: true, settings: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Brend ayarlarını saxlamaq mümkün olmadı." }, { status: 500 });
  }
}
