import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authenticateUserFromStore } from "@/server/user-store";

export type UserRole = "admin" | "support" | "dealer" | "viewer";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

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

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const user = await authenticateUserFromStore(email, password);
  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role };
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

  const parsed = JSON.parse(fromBase64Url(encodedPayload)) as {
    user: SessionUser;
    exp: number;
  };

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
