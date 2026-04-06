import { createHash } from "node:crypto";
import {
  getKapitalBankApiBaseUrl,
  getKapitalBankAppUrl,
  getKapitalBankConfig,
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
  const checkoutStrategy: PaymentCheckoutStrategy = mode === "live" && liveReady
    ? "hosted_redirect_pending"
    : "internal_placeholder";

  const orderId = input.internalPaymentId;
  const payloadBase: Omit<PaymentProviderPayload, "requestDigest"> = {
    providerPaymentId: input.internalPaymentId,
    orderId,
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
          "Live merchant credentials are configured.",
          "Final bank-specific field mapping and signing must replace the internal placeholder checkout page."
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
  const login = `${config.terminalId}/${config.username}`;
  return `Basic ${Buffer.from(`${login}:${config.password ?? ""}`, "utf8").toString("base64")}`;
}

export async function prepareKapitalBankCheckoutSession(input: BuildKapitalBankSessionInput): Promise<KapitalBankCheckoutSession> {
  const session = buildKapitalBankCheckoutSession(input);
  const config = getKapitalBankConfig();
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

  const response = await fetch(`${getKapitalBankApiBaseUrl(config)}/api/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getBasicAuthHeader(config)
    },
    body: JSON.stringify({
      order: {
        typeRid: "Order_SMS",
        amount: input.amountAzn.toFixed(2),
        currency: "AZN",
        language: "az",
        description: input.description,
        hppRedirectUrl: session.payload.successUrl
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
  const url = `${getKapitalBankApiBaseUrl(config)}/api/order/${encodeURIComponent(input.remoteOrderId)}?password=${encodeURIComponent(input.remoteOrderPassword)}`;
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
