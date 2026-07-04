import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { activateListingAsFree } from "@/server/listing-store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const result = await activateListingAsFree(listingId, user.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
