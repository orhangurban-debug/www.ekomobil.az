import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { updateListingForOwner } from "@/server/listing-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş tələb olunur." }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    title?: string;
    description?: string;
    city?: string;
    priceAzn?: number;
  };

  const result = await updateListingForOwner(id, user.id, {
    title: typeof payload.title === "string" ? payload.title : undefined,
    description: typeof payload.description === "string" ? payload.description : undefined,
    city: typeof payload.city === "string" ? payload.city : undefined,
    priceAzn: typeof payload.priceAzn === "number" ? payload.priceAzn : undefined
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Yenilənmə uğursuz oldu." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
