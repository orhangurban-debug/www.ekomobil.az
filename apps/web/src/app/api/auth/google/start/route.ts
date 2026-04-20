import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
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
const OAUTH_BROWSER_COOKIE = "ekomobil_oauth_browser";

function getSharedCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return undefined;
  try {
    const hostname = new URL(appUrl).hostname.replace(/^www\./, "");
    if (!hostname || hostname === "localhost") return undefined;
    return `.${hostname}`;
  } catch {
    return undefined;
  }
}

function normalizeNextPath(raw: string | null): string {
  if (!raw) return "/me";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/me";
  return raw;
}

function readCookieMap(req: Request): Map<string, string> {
  const requestCookies = req.headers.get("cookie") || "";
  return new Map(
    requestCookies
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const idx = item.indexOf("=");
        if (idx === -1) return [item, ""] as const;
        return [item.slice(0, idx), decodeURIComponent(item.slice(idx + 1))] as const;
      })
  );
}

function getBrowserThrottleId(req: Request): string {
  const value = readCookieMap(req).get(OAUTH_BROWSER_COOKIE)?.trim() ?? "";
  if (/^[A-Za-z0-9_-]{20,120}$/.test(value)) return value;
  return randomBytes(24).toString("base64url");
}

export async function GET(req: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const ip = getClientIp(req);
  const browserId = getBrowserThrottleId(req);
  const checks = await Promise.all([
    checkRateLimit(`oauth_google_start:browser:1m:${browserId}`, 12, 1),
    checkRateLimit(`oauth_google_start:browser:10m:${browserId}`, 60, 10),
    ...(ip !== "unknown"
      ? [
          checkRateLimit(`oauth_google_start:ip:1m:${ip}`, 200, 1),
          checkRateLimit(`oauth_google_start:ip:10m:${ip}`, 1000, 10)
        ]
      : [])
  ]);
  const [browserBurstLimit, browserWindowLimit, ...ipLimits] = checks;
  const ipLimited = ipLimits.some((limit) => !limit.ok);
  if (!browserBurstLimit.ok || !browserWindowLimit.ok || ipLimited) {
    return NextResponse.redirect(new URL("/login?error=rate_limited_google", req.url));
  }

  const url = new URL(req.url);
  // Always use the canonical app URL so the redirect_uri sent to Google
  // matches exactly what is registered in Google Console — regardless of
  // whether the request arrived via ekomobil.az or www.ekomobil.az.
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? url.origin).replace(/\/+$/, "");
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
    maxAge: 10 * 60,
    ...(getSharedCookieDomain() ? { domain: getSharedCookieDomain() } : {})
  };
  redirect.cookies.set(OAUTH_STATE_COOKIE, state, common);
  redirect.cookies.set(OAUTH_PKCE_COOKIE, verifier, common);
  redirect.cookies.set(OAUTH_NEXT_COOKIE, nextPath, common);
  redirect.cookies.set(OAUTH_BROWSER_COOKIE, browserId, {
    ...common,
    maxAge: 60 * 60 * 24 * 30
  });
  return redirect;
}
