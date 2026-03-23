import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeSessionToken, getEdgeCookieName } from "@/lib/session-edge";

const PROTECTED_PREFIXES = ["/ops", "/dealer", "/me", "/favorites"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(getEdgeCookieName())?.value;
  const user = token ? await verifyEdgeSessionToken(token) : null;
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ops/:path*", "/dealer/:path*", "/me/:path*", "/favorites/:path*"]
};
