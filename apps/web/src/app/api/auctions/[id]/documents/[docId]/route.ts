import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { deleteAuctionListingDocument } from "@/server/auction-document-store";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string; docId: string }> }
) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const { docId } = await context.params;
  const result = await deleteAuctionListingDocument({ docId, actorUserId: user.id });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
