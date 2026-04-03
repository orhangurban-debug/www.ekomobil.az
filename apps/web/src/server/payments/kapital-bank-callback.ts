import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProviderPayload } from "@/lib/payments";
import { getKapitalBankOrderStatus } from "@/server/payments/kapital-bank-provider";

export function toKapitalBankInternalStatus(status: string | null): "succeeded" | "failed" | "cancelled" {
  const normalized = status?.toLowerCase();
  if (normalized === "ok" || normalized === "success" || normalized === "succeeded") return "succeeded";
  if (normalized === "cancel" || normalized === "cancelled") return "cancelled";
  return "failed";
}

export function mapKapitalBankOrderStatus(status: string): "succeeded" | "failed" | "cancelled" {
  switch (status) {
    case "FullyPaid":
    case "Closed":
    case "Authorized":
      return "succeeded";
    case "Cancelled":
    case "Refused":
    case "Expired":
      return "cancelled";
    default:
      return "failed";
  }
}

/**
 * Verify HMAC-SHA256 signature for internal payment callbacks (mock, dev, internal events).
 * Uses AUTH_SECRET as the signing key.
 * Expected signature format: HMAC-SHA256(paymentId + ":" + status, AUTH_SECRET) as hex
 */
export function verifyInternalCallbackSignature(input: {
  paymentId: string;
  status: string;
  signature: string | null | undefined;
}): { ok: boolean; reason?: string } {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // No secret configured — only allow in development
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "AUTH_SECRET konfiqurasiya edilməyib" };
    }
    return { ok: true };
  }

  if (!input.signature) {
    return { ok: false, reason: "İmza tələb olunur" };
  }

  const expected = createHmac("sha256", secret)
    .update(`${input.paymentId}:${input.status}`)
    .digest("hex");

  try {
    const signatureBuf = Buffer.from(input.signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (signatureBuf.length !== expectedBuf.length) {
      return { ok: false, reason: "İmza keçərsizdir" };
    }
    if (!timingSafeEqual(signatureBuf, expectedBuf)) {
      return { ok: false, reason: "İmza keçərsizdir" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "İmza keçərsizdir" };
  }
}

/**
 * Generate HMAC-SHA256 signature for internal callbacks.
 * Used by mock endpoints to sign their requests.
 */
export function signInternalCallback(paymentId: string, status: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-only";
  return createHmac("sha256", secret).update(`${paymentId}:${status}`).digest("hex");
}

/**
 * Placeholder: Kapital Bank will provide their own signature verification method.
 * Until merchant onboarding is complete and their SDK/docs are available,
 * we rely on remote order status lookup (more secure than callback-only trust).
 */
export function verifyKapitalBankCallbackPlaceholder(_input: {
  body?: unknown;
  signature?: string | null;
}): { ok: true; mode: "placeholder" } {
  return { ok: true, mode: "placeholder" };
}

export async function resolveKapitalBankPaymentStatus(input: {
  fallbackStatus?: string | null;
  providerPayload?: PaymentProviderPayload;
}): Promise<{
  status: "succeeded" | "failed" | "cancelled";
  providerReference?: string;
  verification: "remote_order_status" | "fallback";
}> {
  const remoteOrderId = input.providerPayload?.remoteOrderId;
  const remoteOrderPassword = input.providerPayload?.remoteOrderPassword;
  const providerMode = input.providerPayload?.mode;

  // In live mode we must resolve from the bank-side order state.
  // Accepting callback-provided fallback statuses in live mode is unsafe.
  if (providerMode === "live" && (!remoteOrderId || !remoteOrderPassword)) {
    throw new Error("Live rejimdə bank sifariş identifikatoru tapılmadı");
  }

  if (remoteOrderId && remoteOrderPassword) {
    const remote = await getKapitalBankOrderStatus({ remoteOrderId, remoteOrderPassword });
    return {
      status: mapKapitalBankOrderStatus(remote.status),
      providerReference: remoteOrderId,
      verification: "remote_order_status",
    };
  }

  return {
    status: toKapitalBankInternalStatus(input.fallbackStatus ?? null),
    verification: "fallback",
  };
}
