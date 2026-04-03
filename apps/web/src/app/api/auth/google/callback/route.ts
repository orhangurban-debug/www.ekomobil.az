import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName } from "@/lib/auth";
import { exchangeGoogleCode, isGoogleOAuthConfigured } from "@/lib/google-oauth";
import { upsertUserFromGoogle } from "@/server/user-store";

const OAUTH_STATE_COOKIE = "ekomobil_oauth_state";
const OAUTH_PKCE_COOKIE = "ekomobil_oauth_pkce";
const OAUTH_NEXT_COOKIE = "ekomobil_oauth_next";

function clearOAuthCookies(res: NextResponse) {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0
  };
  res.cookies.set(OAUTH_STATE_COOKIE, "", common);
  res.cookies.set(OAUTH_PKCE_COOKIE, "", common);
  res.cookies.set(OAUTH_NEXT_COOKIE, "", common);
}

function safeNextPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/me";
  return path;
}

export async function GET(req: Request) {
  const incoming = new URL(req.url);
  const baseUrl = incoming.origin;
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", baseUrl));
  }

  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  const error = incoming.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=google_access_denied", baseUrl));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=google_invalid_callback", baseUrl));
  }

  const requestCookies = req.headers.get("cookie") || "";
  const cookies = new Map(
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

  const expectedState = cookies.get(OAUTH_STATE_COOKIE);
  const verifier = cookies.get(OAUTH_PKCE_COOKIE);
  const nextPath = safeNextPath(cookies.get(OAUTH_NEXT_COOKIE));
  if (!expectedState || !verifier || state !== expectedState) {
    const fail = NextResponse.redirect(new URL("/login?error=google_state_mismatch", baseUrl));
    clearOAuthCookies(fail);
    return fail;
  }

  const googleUser = await exchangeGoogleCode({ code, codeVerifier: verifier, baseUrl });
  if (!googleUser) {
    const fail = NextResponse.redirect(new URL("/login?error=google_token_failed", baseUrl));
    clearOAuthCookies(fail);
    return fail;
  }

  try {
    const user = await upsertUserFromGoogle({
      providerUserId: googleUser.sub,
      email: googleUser.email,
      fullName: googleUser.name,
      avatarUrl: googleUser.picture
    });
    const token = createSessionToken({ id: user.id, email: user.email, role: user.role });
    const success = NextResponse.redirect(new URL(nextPath, baseUrl));
    success.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12
    });
    clearOAuthCookies(success);
    return success;
  } catch {
    const fail = NextResponse.redirect(new URL("/login?error=google_signin_failed", baseUrl));
    clearOAuthCookies(fail);
    return fail;
  }
}
