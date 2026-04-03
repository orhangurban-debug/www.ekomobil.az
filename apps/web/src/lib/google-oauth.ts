import { createHash, randomBytes } from "node:crypto";

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleConfig();
  return Boolean(clientId && clientSecret);
}

export function buildGoogleCallbackUrl(baseUrl?: string): string {
  const root = (baseUrl || getAppBaseUrl()).replace(/\/+$/, "");
  return `${root}/api/auth/google/callback`;
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export function generatePkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function toPkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildGoogleAuthUrl(input: { state: string; codeChallenge: string; baseUrl?: string }): string {
  const { clientId } = getGoogleConfig();
  const callbackUrl = buildGoogleCallbackUrl(input.baseUrl);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "online");
  return url.toString();
}

export async function exchangeGoogleCode(input: { code: string; codeVerifier: string; baseUrl?: string }) {
  const { clientId, clientSecret } = getGoogleConfig();
  const callbackUrl = buildGoogleCallbackUrl(input.baseUrl);
  const body = new URLSearchParams({
    code: input.code,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: input.codeVerifier,
    redirect_uri: callbackUrl,
    grant_type: "authorization_code"
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store"
  });
  if (!tokenRes.ok) return null;

  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return null;

  const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store"
  });
  if (!userInfoRes.ok) return null;

  const profile = (await userInfoRes.json()) as GoogleUserInfo;
  if (!profile.sub || !profile.email || !profile.email_verified) return null;
  return profile;
}
