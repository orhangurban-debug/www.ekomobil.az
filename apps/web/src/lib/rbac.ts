import { NextResponse } from "next/server";
import { getServerSessionUser, UserRole, verifySessionToken } from "@/lib/auth";

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
