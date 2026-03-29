import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { reviewAuctionListingDocument } from "@/server/auction-document-store";

export async function PATCH(req: Request, context: { params: Promise<{ docId: string }> }) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { docId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    status?: "approved" | "rejected";
    note?: string;
  };

  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json({ ok: false, error: "status: approved | rejected tələb olunur" }, { status: 400 });
  }

  const result = await reviewAuctionListingDocument({
    docId,
    reviewerUserId: auth.user.id,
    status: body.status,
    note: body.note
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, document: result.document });
}
