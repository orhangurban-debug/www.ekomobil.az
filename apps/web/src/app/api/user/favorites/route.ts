import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { listUserFavorites, toggleFavorite } from "@/server/user-store";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const items = await listUserFavorites(user.id);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await req.json()) as { listingId?: string };
  if (!body.listingId) {
    return NextResponse.json({ ok: false, error: "listingId is required." }, { status: 400 });
  }

  const result = await toggleFavorite(user.id, body.listingId);
  return NextResponse.json({ ok: true, ...result });
}
