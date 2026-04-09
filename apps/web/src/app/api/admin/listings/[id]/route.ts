import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import {
  deleteAdminListing,
  getAdminListing,
  updateSingleAdminListing
} from "@/server/admin-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const user = await getServerSessionUser();
  if (!user || !["admin", "support"].includes(user.role)) {
    return NextResponse.json({ ok: false, error: "Giriş yoxdur." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const listing = await getAdminListing(id);
  if (!listing) return NextResponse.json({ ok: false, error: "Elan tapılmadı." }, { status: 404 });
  return NextResponse.json({ ok: true, listing });
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const user = await getServerSessionUser();
  if (!user || !["admin", "support"].includes(user.role)) {
    return NextResponse.json({ ok: false, error: "Giriş yoxdur." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    status?: string;
    priceAzn?: number;
    title?: string;
    city?: string;
  };

  const VALID_STATUSES = ["active", "pending_review", "rejected", "archived", "inactive", "draft"];
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Yanlış status." }, { status: 400 });
  }

  const updated = await updateSingleAdminListing(id, body);
  if (!updated) return NextResponse.json({ ok: false, error: "Elan tapılmadı və ya dəyişiklik yoxdur." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const user = await getServerSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Yalnız admin silə bilər." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const deleted = await deleteAdminListing(id);
  if (!deleted) return NextResponse.json({ ok: false, error: "Elan tapılmadı." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
