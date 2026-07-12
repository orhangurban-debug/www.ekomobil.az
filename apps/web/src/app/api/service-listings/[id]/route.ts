import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import {
  setServiceListingLifecycleForOwner,
  updateServiceListingForOwner,
  type OwnerServiceLifecycleAction
} from "@/server/service-listing-store";

type RouteContext = { params: Promise<{ id: string }> };

const LIFECYCLE_ACTIONS: OwnerServiceLifecycleAction[] = ["hide", "unhide", "delete"];

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
    action?: OwnerServiceLifecycleAction;
    name?: string;
    city?: string;
    address?: string | null;
    mapUrl?: string | null;
    about?: string;
    services?: string[];
    phone?: string;
    whatsapp?: string | null;
  };

  if (payload.action && LIFECYCLE_ACTIONS.includes(payload.action)) {
    const result = await setServiceListingLifecycleForOwner(id, user.id, payload.action);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? "Əməliyyat uğursuz oldu." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, status: result.status });
  }

  const result = await updateServiceListingForOwner(id, user.id, {
    name: typeof payload.name === "string" ? payload.name : undefined,
    city: typeof payload.city === "string" ? payload.city : undefined,
    address: payload.address === null || typeof payload.address === "string" ? payload.address : undefined,
    mapUrl: payload.mapUrl === null || typeof payload.mapUrl === "string" ? payload.mapUrl : undefined,
    about: typeof payload.about === "string" ? payload.about : undefined,
    services: Array.isArray(payload.services)
      ? payload.services.filter((item): item is string => typeof item === "string")
      : undefined,
    phone: typeof payload.phone === "string" ? payload.phone : undefined,
    whatsapp: payload.whatsapp === null || typeof payload.whatsapp === "string" ? payload.whatsapp : undefined
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Yenilənmə uğursuz oldu." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
