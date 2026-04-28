import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { listInvoicesForUser } from "@/server/invoice-store";
import { listListingsForUser } from "@/server/listing-store";
import { getUserProfile, listSavedSearches, listUserFavorites } from "@/server/user-store";

function getSessionUserFromCookie(req: Request): { id: string; email: string; role: string } | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((entry) => entry.trim());
  const sessionCookieName = getSessionCookieName();
  const tokenPair = parts.find((entry) => entry.startsWith(`${sessionCookieName}=`));
  const token = tokenPair ? decodeURIComponent(tokenPair.split("=")[1] || "") : "";
  if (!token) return null;
  const user = verifySessionToken(token);
  if (!user) return null;
  return user;
}

export async function GET(req: Request) {
  const sessionUser = getSessionUserFromCookie(req);
  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Sessiya tapılmadı." }, { status: 401 });
  }

  const [profile, favorites, savedSearches, listings, invoices] = await Promise.all([
    getUserProfile(sessionUser.id),
    listUserFavorites(sessionUser.id),
    listSavedSearches(sessionUser.id),
    listListingsForUser(sessionUser.id),
    listInvoicesForUser(sessionUser.id, 500)
  ]);

  const payload = {
    ok: true,
    exportSchemaVersion: 1,
    generatedAt: new Date().toISOString(),
    user: {
      id: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
      profile: profile
        ? {
            fullName: profile.fullName ?? null,
            city: profile.city ?? null,
            phone: profile.phone ?? null,
            emailVerified: profile.emailVerified
          }
        : null
    },
    favorites,
    savedSearches,
    listings,
    invoices
  };

  const json = JSON.stringify(payload, null, 2);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `ekomobil-data-export-${timestamp}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
