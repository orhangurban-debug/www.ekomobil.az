import type { PaymentProviderPayload } from "@/lib/payments";
import { getKapitalBankOrderStatus } from "@/server/payments/kapital-bank-provider";

export function toKapitalBankInternalStatus(status: string | null): "succeeded" | "failed" | "cancelled" {
  const normalized = status?.toLowerCase();
  if (normalized === "ok" || normalized === "success" || normalized === "succeeded") {
    return "succeeded";
  }
  if (normalized === "cancel" || normalized === "cancelled") {
    return "cancelled";
  }
  return "failed";
}

export function verifyKapitalBankCallbackPlaceholder(_input: {
  body?: unknown;
  signature?: string | null;
}): { ok: true; mode: "placeholder" } {
  return { ok: true, mode: "placeholder" };
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
  if (remoteOrderId && remoteOrderPassword) {
    const remote = await getKapitalBankOrderStatus({
      remoteOrderId,
      remoteOrderPassword
    });
    return {
      status: mapKapitalBankOrderStatus(remote.status),
      providerReference: remoteOrderId,
      verification: "remote_order_status"
    };
  }

  return {
    status: toKapitalBankInternalStatus(input.fallbackStatus ?? null),
    verification: "fallback"
  };
}
