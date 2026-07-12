import { NextResponse } from "next/server";
import { getServerSessionUser, UserRole, verifySessionToken } from "@/lib/auth";
import {
  type AdminCapability,
  hasCapability,
  resolveEffectivePermissions
} from "@/lib/admin-permissions";
import { getAdminGrantForUser } from "@/server/admin-store";

export async function requirePageRoles(roles: UserRole[]) {
  const user = await getServerSessionUser();
  if (!user) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }
  if (!roles.includes(user.role)) {
    return { ok: false as const, reason: "forbidden" as const, user };
  }
  return { ok: true as const, user };
}

export function requireApiRoles(req: Request, roles: UserRole[]) {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((entry) => entry.trim());
  const tokenPair = parts.find((entry) => entry.startsWith("ekomobil_session="));
  const token = tokenPair ? decodeURIComponent(tokenPair.split("=")[1] || "") : "";

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 })
    };
  }

  const user = verifySessionToken(token);
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 })
    };
  }

  if (!roles.includes(user.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Insufficient permissions." }, { status: 403 })
    };
  }

  return { ok: true as const, user };
}

/** Coarse role gate + fine-grained capability from user_admin_grants. */
export async function requireAdminCapability(req: Request, capability: AdminCapability) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth;

  const grant = await getAdminGrantForUser(auth.user.id);
  const permissions = resolveEffectivePermissions({
    role: auth.user.role,
    staffType: grant?.staffType ?? null,
    permissions: grant?.permissions ?? null
  });

  if (!hasCapability(permissions, capability)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "Bu əməliyyat üçün səlahiyyətiniz yoxdur." },
        { status: 403 }
      ),
      user: auth.user
    };
  }

  return { ok: true as const, user: auth.user, permissions, grant };
}

export async function requirePageAdminCapability(capability: AdminCapability) {
  const auth = await requirePageRoles(["admin", "support"]);
  if (!auth.ok) return auth;

  const grant = await getAdminGrantForUser(auth.user.id);
  const permissions = resolveEffectivePermissions({
    role: auth.user.role,
    staffType: grant?.staffType ?? null,
    permissions: grant?.permissions ?? null
  });

  if (!hasCapability(permissions, capability)) {
    return { ok: false as const, reason: "forbidden" as const, user: auth.user };
  }

  return { ok: true as const, user: auth.user, permissions, grant };
}
