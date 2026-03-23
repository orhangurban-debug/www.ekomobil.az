import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { buildSavedSearchName } from "@/server/bootstrap-seed";
import { listSavedSearches, saveSearch } from "@/server/user-store";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const items = await listSavedSearches(user.id);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await req.json()) as { name?: string; queryParams?: Record<string, unknown> };
  const queryParams = body.queryParams || {};
  await saveSearch(user.id, {
    name: body.name?.trim() || buildSavedSearchName(queryParams),
    queryParams
  });
  return NextResponse.json({ ok: true });
}
