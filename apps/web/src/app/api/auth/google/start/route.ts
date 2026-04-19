import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  generateOAuthState,
  generatePkceVerifier,
  isGoogleOAuthConfigured,
  toPkceChallenge
} from "@/lib/google-oauth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const OAUTH_STATE_COOKIE = "ekomobil_oauth_state";
const OAUTH_PKCE_COOKIE = "ekomobil_oauth_pkce";
const OAUTH_NEXT_COOKIE = "ekomobil_oauth_next";

function normalizeNextPath(raw: string | null): string {
  if (!raw) return "/me";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/me";
  return raw;
}

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const ip = getClientIp(req);
  const userAgent = (req.headers.get("user-agent") ?? "unknown")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  const keyBase = `${ip}:${userAgent}`;
  const [burstLimit, windowLimit] = await Promise.all([
    checkRateLimit(`oauth_google_start:1m:${keyBase}`, 10, 1),
    checkRateLimit(`oauth_google_start:10m:${keyBase}`, 60, 10)
  ]);
  if (!burstLimit.ok || !windowLimit.ok) {
    return NextResponse.redirect(new URL("/login?error=rate_limited_google", req.url));
  }

  const url = new URL(req.url);
  const baseUrl = url.origin;
  const nextPath = normalizeNextPath(url.searchParams.get("next"));
  const state = generateOAuthState();
  const verifier = generatePkceVerifier();
  const challenge = toPkceChallenge(verifier);

  const redirect = NextResponse.redirect(buildGoogleAuthUrl({ state, codeChallenge: challenge, baseUrl }));
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 10 * 60
  };
  redirect.cookies.set(OAUTH_STATE_COOKIE, state, common);
  redirect.cookies.set(OAUTH_PKCE_COOKIE, verifier, common);
  redirect.cookies.set(OAUTH_NEXT_COOKIE, nextPath, common);
  return redirect;
}
