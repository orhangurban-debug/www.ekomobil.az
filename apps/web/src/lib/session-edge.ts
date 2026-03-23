/**
 * Edge-compatible session verification (Web Crypto API).
 * Used only in middleware.ts — no Node.js built-ins.
 */

const SESSION_COOKIE_NAME = "ekomobil_session";

export type EdgeUserRole = "admin" | "support" | "dealer" | "viewer";

export interface EdgeSessionUser {
  id: string;
  email: string;
  role: EdgeUserRole;
}

async function getEdgeSecret(): Promise<CryptoKey> {
  const raw = process.env.AUTH_SECRET || "dev-only-secret-change-me";
  const enc = new TextEncoder().encode(raw);
  return crypto.subtle.importKey("raw", enc, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function fromBase64Url(input: string): string {
  return decodeURIComponent(
    atob(input.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function hexToUint8(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function signEdge(payload: string): Promise<string> {
  const key = await getEdgeSecret();
  const data = new TextEncoder().encode(payload);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyEdgeSessionToken(token: string): Promise<EdgeSessionUser | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, receivedSig] = parts;

  const expectedSig = await signEdge(encodedPayload);
  if (receivedSig.length !== expectedSig.length) return null;

  const expectedBytes = hexToUint8(expectedSig);
  const receivedBytes = hexToUint8(receivedSig);
  if (expectedBytes.length !== receivedBytes.length) return null;

  let diff = 0;
  for (let i = 0; i < expectedBytes.length; i++) {
    diff |= expectedBytes[i] ^ receivedBytes[i];
  }
  if (diff !== 0) return null;

  const parsed = JSON.parse(fromBase64Url(encodedPayload)) as {
    user: EdgeSessionUser;
    exp: number;
  };
  if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed.user;
}

export function getEdgeCookieName(): string {
  return SESSION_COOKIE_NAME;
}
