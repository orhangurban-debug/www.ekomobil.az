import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyEdgeSessionToken, getEdgeCookieName } from "@/lib/session-edge";

const PROTECTED_PREFIXES = ["/ops", "/admin", "/dealer", "/me", "/favorites"];

// State-changing API endpoints that require same-origin check
const CSRF_PROTECTED_API_PREFIXES = [
  "/api/auctions",
  "/api/payments",
  "/api/auth",
  "/api/ops",
  "/api/listings",
];

/** Validate that state-changing requests come from our own origin (CSRF protection) */
function checkOrigin(request: NextRequest): boolean {
  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const pathname = request.nextUrl.pathname;
  const isProtected = CSRF_PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host") ?? request.nextUrl.host;

  // Allow requests without Origin (server-to-server, curl in dev)
  if (!origin && !referer) return true;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const checkUrl = origin ?? referer ?? "";
  try {
    const parsed = new URL(checkUrl);
    const requestHost = parsed.host;

    // Allow same host
    if (requestHost === host) return true;

    // Allow configured app URL
    if (appUrl) {
      const appParsed = new URL(appUrl);
      if (requestHost === appParsed.host) return true;
    }

    // Allow localhost in development
    if (process.env.NODE_ENV !== "production") {
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF: reject cross-origin state-changing requests
  if (!checkOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "Cross-origin sorğu rədd edildi." },
      { status: 403 }
    );
  }

  // Auth-gated pages
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
  matcher: [
    "/ops/:path*",
    "/admin/:path*",
    "/dealer/:path*",
    "/me/:path*",
    "/favorites/:path*",
    "/api/:path*",
  ],
};
