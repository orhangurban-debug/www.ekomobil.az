import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { listAdminUsersLookup } from "@/server/admin-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const items = await listAdminUsersLookup(q, 20);
  return NextResponse.json({ ok: true, items });
}
