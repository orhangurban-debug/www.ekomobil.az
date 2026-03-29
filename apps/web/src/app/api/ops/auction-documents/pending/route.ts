import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { listPendingAuctionDocuments } from "@/server/auction-document-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const limit = Math.min(80, Math.max(1, Number(url.searchParams.get("limit") ?? "40")));

  const documents = await listPendingAuctionDocuments(limit);
  return NextResponse.json({ ok: true, documents });
}
