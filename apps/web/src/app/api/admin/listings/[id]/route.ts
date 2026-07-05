import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import {
  deleteAdminListing,
  extendListingPlanExpiry,
  getAdminListing,
  updateSingleAdminListing
} from "@/server/admin-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: RouteContext) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const listing = await getAdminListing(id);
  if (!listing) return NextResponse.json({ ok: false, error: "Elan tapılmadı." }, { status: 404 });
  return NextResponse.json({ ok: true, listing });
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action?: string;
    status?: string;
    priceAzn?: number;
    title?: string;
    city?: string;
    rejectionNote?: string;
  };

  // Elan müddətinin uzadılması ayrıca əməliyyatdır (status dəyişmədən müddəti plan qədər artırır).
  if (body.action === "extend") {
    const extended = await extendListingPlanExpiry(id);
    if (!extended) return NextResponse.json({ ok: false, error: "Elan tapılmadı." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const VALID_STATUSES = ["active", "pending_review", "rejected", "archived", "inactive", "draft"];
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Yanlış status." }, { status: 400 });
  }

  const updated = await updateSingleAdminListing(id, {
    status: body.status,
    priceAzn: body.priceAzn,
    title: body.title,
    city: body.city,
    rejectionNote: body.rejectionNote
  });
  if (!updated) return NextResponse.json({ ok: false, error: "Elan tapılmadı və ya dəyişiklik yoxdur." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: RouteContext) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const deleted = await deleteAdminListing(id);
  if (!deleted) return NextResponse.json({ ok: false, error: "Elan tapılmadı." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
