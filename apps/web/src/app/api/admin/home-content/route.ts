import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { HomeContentConfig } from "@/lib/home-content";
import { parseHomeContentConfig } from "@/lib/home-content";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { getHomeContentConfig, updateHomeContentConfig } from "@/server/system-settings-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const config = await getHomeContentConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as Partial<HomeContentConfig>;
  try {
    const current = await getHomeContentConfig();
    const updated = await updateHomeContentConfig(
      parseHomeContentConfig({
        ...current,
        slides: Array.isArray(body.slides) ? body.slides : current.slides,
        categories: Array.isArray(body.categories) ? body.categories : current.categories,
        featuredTitle: body.featuredTitle ?? current.featuredTitle,
        featuredSubtitle: body.featuredSubtitle ?? current.featuredSubtitle,
        sellCtaTitle: body.sellCtaTitle ?? current.sellCtaTitle,
        sellCtaText: body.sellCtaText ?? current.sellCtaText
      })
    );
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "home_content_updated",
      entityType: "settings",
      entityId: "home_content_config",
      metadata: {
        slideCount: updated.slides.length,
        categoryCount: updated.categories.length
      }
    });
    // Ana səhifə statik keşlənir — dəyişiklik dərhal görünsün deyə yenilə.
    revalidatePath("/");
    return NextResponse.json({ ok: true, config: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Ana səhifə məzmununu saxlamaq mümkün olmadı." }, { status: 500 });
  }
}
