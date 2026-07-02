import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authenticateUserFromStore, isActiveAccountStatus } from "@/server/user-store";

export type UserRole = "admin" | "support" | "dealer" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export type AuthOutcome =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "blocked" };

const SESSION_COOKIE_NAME = "ekomobil_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET təyin olunmalıdır. Production üçün .env faylında AUTH_SECRET əlavə edin.");
  }
  return secret || "dev-only-secret-change-me";
}

function sign(raw: string): string {
  return createHmac("sha256", getSecret()).update(raw).digest("hex");
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export async function authenticateUser(email: string, password: string): Promise<AuthOutcome> {
  const user = await authenticateUserFromStore(email, password);
  if (!user) return { ok: false, reason: "invalid" };
  if (!isActiveAccountStatus(user.accountStatus)) {
    return { ok: false, reason: "blocked" };
  }
  return { ok: true, user: { id: user.id, email: user.email, role: user.role } };
}

export function createSessionToken(user: SessionUser): string {
  const payload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const [encodedPayload, receivedSig] = token.split(".");
  if (!encodedPayload || !receivedSig) return null;

  const expectedSig = sign(encodedPayload);
  if (receivedSig.length !== expectedSig.length) return null;
  const validSig = timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));
  if (!validSig) return null;

  let parsed: { user: SessionUser; exp: number };
  try {
    parsed = JSON.parse(fromBase64Url(encodedPayload)) as {
      user: SessionUser;
      exp: number;
    };
  } catch {
    return null;
  }

  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed.user;
}

export async function getServerSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_TTL_SECONDS;
}

/**
 * Production-da sessiya cookie-si üçün ümumi domen (`.ekomobil.az`) qaytarır ki,
 * apex və www subdomenləri arasında sessiya tutarlı olsun. Bütün cookie set/clear
 * əməliyyatları (email login, Google OAuth, logout) eyni domendən istifadə etməlidir —
 * əks halda Google ilə daxil olan istifadəçinin logout-u işləmir.
 */
export function getSessionCookieDomain(): string | undefined {
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

interface SessionCookieMutationOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  domain?: string;
}

/** Sessiya cookie-si üçün standart set/clear parametrləri (domenlə birlikdə). */
export function getSessionCookieOptions(maxAgeSeconds: number): SessionCookieMutationOptions {
  const domain = getSessionCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
    ...(domain ? { domain } : {})
  };
}
