import { createHash } from "node:crypto";
import {
  getKapitalBankLiveReadinessIssues,
  getKapitalBankApiBaseUrl,
  getKapitalBankApiRoot,
  getKapitalBankAppUrl,
  getKapitalBankConfig,
  getKapitalBankGateway,
  getKapitalBankGatewayLabel,
  isBirPayApiBaseUrl,
  isKapitalBankLiveReady
} from "@/lib/kapital-bank";
import type { PaymentCheckoutStrategy, PaymentProviderPayload } from "@/lib/payments";
import { createBirPayPayment, getBirPayPayment } from "@/server/payments/birpay-client";

interface BuildKapitalBankSessionInput {
  internalPaymentId: string;
  amountAzn: number;
  description: string;
  checkoutPagePath: string;
  callbackPath: string;
  successPath?: string;
  cancelPath?: string;
  orderTypeRid?: "Order_SMS" | "Order_DMS";
  title?: string;
}

export interface KapitalBankCheckoutSession {
  checkoutUrl: string;
  checkoutStrategy: PaymentCheckoutStrategy;
  providerMode: PaymentProviderPayload["mode"];
  payload: PaymentProviderPayload;
}

interface KapitalBankCreateOrderResponse {
  order?: {
    id?: string | number;
    password?: string;
    secret?: string;
    hppUrl?: string;
  };
}

function toMinorUnits(amountAzn: number): number {
  return Math.round(amountAzn * 100);
}

function buildRequestDigest(payload: Omit<PaymentProviderPayload, "requestDigest">): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildKapitalBankCheckoutSession(input: BuildKapitalBankSessionInput): KapitalBankCheckoutSession {
  const config = getKapitalBankConfig();
  const liveReady = isKapitalBankLiveReady(config);
  const mode = config.mode;
  const gatewayLabel = getKapitalBankGatewayLabel(config);
  const checkoutStrategy: PaymentCheckoutStrategy = mode === "live" && liveReady
    ? "hosted_redirect_pending"
    : "internal_placeholder";

  const orderId = input.internalPaymentId;
  const payloadBase: Omit<PaymentProviderPayload, "requestDigest"> = {
    providerPaymentId: input.internalPaymentId,
    orderId,
    orderTypeRid: input.orderTypeRid ?? "Order_SMS",
    mode,
    amountAzn: input.amountAzn,
    amountMinor: toMinorUnits(input.amountAzn),
    currency: "AZN",
    description: input.description,
    callbackUrl: getKapitalBankAppUrl(input.callbackPath, config),
    successUrl: getKapitalBankAppUrl(input.successPath ?? input.checkoutPagePath, config),
    cancelUrl: getKapitalBankAppUrl(input.cancelPath ?? input.checkoutPagePath, config),
    merchantId: config.merchantId,
    terminalId: config.terminalId,
    liveReady,
    notes: mode === "live" && liveReady
      ? [
          `${gatewayLabel} credential-ları konfiqurasiya olunub.`,
          getKapitalBankGateway(config) === "legacy"
            ? "Bank /order endpoint-i ilə hosted checkout yaradılacaq."
            : "BirPay V1.4 hosted checkout yaradılacaq."
        ]
      : [
          "Internal placeholder checkout is active.",
          "Mock/disabled mode can be used before final merchant onboarding."
        ]
  };

  const payload: PaymentProviderPayload = {
    ...payloadBase,
    requestDigest: buildRequestDigest(payloadBase)
  };

  return {
    checkoutUrl: getKapitalBankAppUrl(input.checkoutPagePath, config),
    checkoutStrategy,
    providerMode: mode,
    payload
  };
}

function getBasicAuthHeader(config = getKapitalBankConfig()): string {
  const login = config.username?.includes("/")
    ? config.username
    : `${config.terminalId}/${config.username}`;
  return `Basic ${Buffer.from(`${login}:${config.password ?? ""}`, "utf8").toString("base64")}`;
}

export async function prepareKapitalBankCheckoutSession(input: BuildKapitalBankSessionInput): Promise<KapitalBankCheckoutSession> {
  const session = buildKapitalBankCheckoutSession(input);
  const config = getKapitalBankConfig();
  if (session.providerMode === "live" && !session.payload.liveReady) {
    const issueText = getKapitalBankLiveReadinessIssues(config)
      .map((issue) => issue.message)
      .join(" ");
    throw new Error(`Kapital Bank live konfiqurasiyası natamamdır. ${issueText}`.trim());
  }
  if (session.providerMode !== "live" || !session.payload.liveReady) {
    return session;
  }

  if (isBirPayApiBaseUrl(config)) {
    const birpay = await createBirPayPayment({
      merchantOrderId: input.internalPaymentId,
      amountAzn: input.amountAzn,
      description: input.description,
      callbackUrl: session.payload.callbackUrl,
      successUrl: session.payload.successUrl,
      cancelUrl: session.payload.cancelUrl
    });
    const payloadWithoutDigest: Omit<PaymentProviderPayload, "requestDigest"> = {
      ...session.payload,
      remoteOrderId: birpay.paymentId,
      paymentPageUrl: birpay.confirmationUrl,
      providerHost: getKapitalBankApiBaseUrl(config),
      notes: [
        "BirPay V1.4 payment yaradıldı.",
        "Hosted redirect URL real BirPay confirmation URL-dir."
      ]
    };
    const payload: PaymentProviderPayload = {
      ...payloadWithoutDigest,
      requestDigest: buildRequestDigest(payloadWithoutDigest)
    };
    return {
      checkoutUrl: birpay.confirmationUrl,
      checkoutStrategy: "hosted_redirect_pending",
      providerMode: "live",
      payload
    };
  }

  const response = await fetch(`${getKapitalBankApiRoot(config)}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getBasicAuthHeader(config)
    },
    body: JSON.stringify({
      order: {
        typeRid: input.orderTypeRid ?? "Order_SMS",
        amount: input.amountAzn.toFixed(2),
        description: input.description,
        currency: "AZN",
        language: "az",
        hppRedirectUrl: session.payload.callbackUrl
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kapital Bank create order failed: ${response.status} ${text}`.slice(0, 500));
  }

  const data = (await response.json()) as KapitalBankCreateOrderResponse;
  const remoteOrderId = data.order?.id?.toString();
  const remoteOrderPassword = data.order?.password;
  const hppUrl = data.order?.hppUrl;
  if (!remoteOrderId || !remoteOrderPassword || !hppUrl) {
    throw new Error("Kapital Bank create order response is missing id/password/hppUrl");
  }

  const paymentPageUrl = `${hppUrl}?${new URLSearchParams({
    id: remoteOrderId,
    password: remoteOrderPassword
  }).toString()}`;

  const payloadWithoutDigest: Omit<PaymentProviderPayload, "requestDigest"> = {
    ...session.payload,
    orderTypeRid: input.orderTypeRid ?? "Order_SMS",
    remoteOrderId,
    remoteOrderPassword,
    paymentPageUrl,
    providerHost: getKapitalBankApiBaseUrl(config),
    notes: [
      "Live order successfully created at Kapital Bank.",
      "Hosted payment page URL is now backed by a real remote order."
    ]
  };

  const payload: PaymentProviderPayload = {
    ...payloadWithoutDigest,
    requestDigest: buildRequestDigest(payloadWithoutDigest)
  };

  return {
    checkoutUrl: paymentPageUrl,
    checkoutStrategy: "hosted_redirect_pending",
    providerMode: "live",
    payload
  };
}

export async function getKapitalBankOrderStatus(input: {
  remoteOrderId: string;
  remoteOrderPassword: string;
}): Promise<{ status: string; raw: unknown }> {
  const config = getKapitalBankConfig();
  if (isBirPayApiBaseUrl(config)) {
    return getBirPayPayment(input.remoteOrderId);
  }
  const url = `${getKapitalBankApiRoot(config)}/order/${encodeURIComponent(input.remoteOrderId)}?${new URLSearchParams({
    password: input.remoteOrderPassword,
    tranDetailLevel: "2",
    tokenDetailLevel: "2",
    orderDetailLevel: "2"
  }).toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: getBasicAuthHeader(config)
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kapital Bank get order status failed: ${response.status} ${text}`.slice(0, 500));
  }
  const raw = await response.json();
  const status = typeof raw === "object" && raw && "order" in raw
    ? String((raw as { order?: { status?: string } }).order?.status ?? "")
    : "";
  return { status, raw };
}

export async function executeKapitalBankOrderTransaction(input: {
  remoteOrderId: string;
  remoteOrderPassword?: string;
  tran: Record<string, unknown>;
}): Promise<{ raw: unknown }> {
  const config = getKapitalBankConfig();
  const response = await fetch(`${getKapitalBankApiRoot(config)}/order/${encodeURIComponent(input.remoteOrderId)}/exec-tran${input.remoteOrderPassword ? `?${new URLSearchParams({ password: input.remoteOrderPassword }).toString()}` : ""}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getBasicAuthHeader(config)
    },
    body: JSON.stringify({ tran: input.tran }),
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kapital Bank exec-tran failed: ${response.status} ${text}`.slice(0, 500));
  }
  return { raw: await response.json() };
}

export async function clearKapitalBankPreauth(input: {
  remoteOrderId: string;
  amountAzn?: number;
}): Promise<{ raw: unknown }> {
  return executeKapitalBankOrderTransaction({
    remoteOrderId: input.remoteOrderId,
    tran: {
      phase: "Clearing",
      ...(typeof input.amountAzn === "number" ? { amount: input.amountAzn.toFixed(2) } : {})
    }
  });
}

export async function refundKapitalBankOrder(input: {
  remoteOrderId: string;
  amountAzn?: number;
}): Promise<{ raw: unknown }> {
  return executeKapitalBankOrderTransaction({
    remoteOrderId: input.remoteOrderId,
    tran: {
      phase: "Single",
      type: "Refund",
      ...(typeof input.amountAzn === "number" ? { amount: input.amountAzn.toFixed(2) } : {})
    }
  });
}

export async function reverseKapitalBankOrder(input: {
  remoteOrderId: string;
  phase?: "Single" | "Auth" | "Clearing";
  voidKind?: "Full" | "Partial";
  amountAzn?: number;
}): Promise<{ raw: unknown }> {
  return executeKapitalBankOrderTransaction({
    remoteOrderId: input.remoteOrderId,
    tran: {
      phase: input.phase ?? "Single",
      voidKind: input.voidKind ?? "Full",
      ...(typeof input.amountAzn === "number" ? { amount: input.amountAzn.toFixed(2) } : {})
    }
  });
}
