import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProviderPayload } from "@/lib/payments";
import { getKapitalBankOrderStatus } from "@/server/payments/kapital-bank-provider";

export function toKapitalBankInternalStatus(status: string | null): "succeeded" | "failed" | "cancelled" {
  const normalized = status?.toLowerCase().replace(/\s+/g, "");
  if (normalized === "ok" || normalized === "success" || normalized === "succeeded") return "succeeded";
  if (normalized === "cancel" || normalized === "cancelled") return "cancelled";
  return "failed";
}

export function mapKapitalBankOrderStatus(status: string): "succeeded" | "failed" | "cancelled" {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, "");
  switch (normalized) {
    case "succeeded":
    case "success":
    case "paid":
    case "captured":
    case "authorized":
    case "fullypaid":
    case "fullypaid.":
    case "closed":
      return "succeeded";
    case "cancelled":
    case "canceled":
    case "cancel":
    case "rejected":
    case "refused":
    case "declined":
    case "expired":
    case "voided":
    case "refunded":
      return "cancelled";
    case "pending":
    case "processing":
    case "created":
    case "new":
    case "beingprepared":
    case "partiallypaid":
      return "failed";
    default:
      break;
  }
  switch (status) {
    case "FullyPaid":
    case "Closed":
    case "Authorized":
    case "Partially paid":
    case "Fully paid":
      return "succeeded";
    case "Cancelled":
    case "Rejected":
    case "Refused":
    case "Expired":
    case "Voided":
    case "Refunded":
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
export function verifyKapitalBankCallbackPlaceholder(): { ok: true; mode: "placeholder" } {
  return { ok: true, mode: "placeholder" };
}

function toBase64(signature: string): Buffer {
  return Buffer.from(signature.replace(/^sha256=/i, "").trim(), "base64");
}

function toHex(signature: string): Buffer {
  return Buffer.from(signature.trim(), "hex");
}

function isBirPayPayload(payload?: PaymentProviderPayload): boolean {
  return Boolean(payload?.providerHost?.toLowerCase().includes("birpay.az"));
}

export function verifyKapitalBankWebhookSignature(input: {
  rawBody: string;
  signature: string | null | undefined;
  providerPayload?: PaymentProviderPayload;
}): { ok: boolean; reason?: string } {
  if (!isBirPayPayload(input.providerPayload) || input.providerPayload?.mode !== "live") {
    return { ok: true };
  }
  const secret = process.env.KAPITAL_BANK_SECRET;
  if (!secret) return { ok: false, reason: "KAPITAL_BANK_SECRET konfiqurasiya edilməyib" };
  if (!input.signature) return { ok: false, reason: "Webhook imzası yoxdur" };
  const expected = createHmac("sha256", secret).update(input.rawBody, "utf8").digest();
  try {
    const candidate = input.signature.includes("=") || input.signature.includes("/")
      ? toBase64(input.signature)
      : toHex(input.signature);
    if (candidate.length !== expected.length) return { ok: false, reason: "Webhook imzası keçərsizdir" };
    if (!timingSafeEqual(candidate, expected)) return { ok: false, reason: "Webhook imzası keçərsizdir" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "Webhook imzası keçərsizdir" };
  }
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
  if (providerMode === "live" && !remoteOrderId) {
    throw new Error("Live rejimdə bank sifariş identifikatoru tapılmadı");
  }

  if (remoteOrderId) {
    try {
      const remote = await getKapitalBankOrderStatus({
        remoteOrderId,
        remoteOrderPassword: remoteOrderPassword ?? ""
      });
      const normalized = remote.status.trim().toLowerCase().replace(/\s+/g, "");
      if (
        normalized === "pending" ||
        normalized === "processing" ||
        normalized === "created" ||
        normalized === "new" ||
        normalized === "beingprepared" ||
        normalized === "partiallypaid"
      ) {
        throw new Error(`Bank sifarişi yekunlaşmayıb: ${remote.status}`);
      }
      return {
        status: mapKapitalBankOrderStatus(remote.status),
        providerReference: remoteOrderId,
        verification: "remote_order_status",
      };
    } catch {
      if (providerMode === "live") {
        throw new Error("Live rejimdə ödəniş statusu bankdan təsdiqlənmədi");
      }
      if (input.fallbackStatus) {
        return {
          status: mapKapitalBankOrderStatus(input.fallbackStatus),
          providerReference: remoteOrderId,
          verification: "fallback",
        };
      }
      throw new Error("Ödəniş statusu bankdan təsdiqlənmədi");
    }
  }

  return {
    status: toKapitalBankInternalStatus(input.fallbackStatus ?? null),
    verification: "fallback",
  };
}
