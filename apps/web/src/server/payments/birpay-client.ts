import { randomUUID } from "node:crypto";
import { getKapitalBankApiBaseUrl, getKapitalBankConfig } from "@/lib/kapital-bank";

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

const globalBirPay = globalThis as unknown as { birpayToken?: CachedToken };

function readTokenFromCache(): string | null {
  const now = Date.now();
  const cached = globalBirPay.birpayToken;
  if (!cached) return null;
  // Refresh token 30 seconds early.
  if (cached.expiresAtMs <= now + 30000) return null;
  return cached.token;
}

function writeTokenToCache(token: string, expiresInSec: number): void {
  globalBirPay.birpayToken = {
    token,
    expiresAtMs: Date.now() + Math.max(60, expiresInSec) * 1000
  };
}

async function getBirPayAccessToken(): Promise<string> {
  const cached = readTokenFromCache();
  if (cached) return cached;

  const config = getKapitalBankConfig();
  if (!config.username || !config.password) {
    throw new Error("BirPay access token üçün username/password təyin olunmayıb");
  }
  const baseUrl = getKapitalBankApiBaseUrl(config);
  const response = await fetch(`${baseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`, "utf8").toString("base64")}`
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      merchant_id: config.merchantId ?? "",
      terminal_id: config.terminalId ?? ""
    }),
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BirPay token alınmadı: ${response.status} ${text}`.slice(0, 500));
  }
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("BirPay token cavabında access_token tapılmadı");
  }
  writeTokenToCache(data.access_token, data.expires_in ?? 600);
  return data.access_token;
}

async function birPayFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getBirPayAccessToken();
  const baseUrl = getKapitalBankApiBaseUrl();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BirPay API xətası ${response.status}: ${text}`.slice(0, 600));
  }
  return (await response.json()) as T;
}

export async function createBirPayPayment(input: {
  merchantOrderId: string;
  amountAzn: number;
  description: string;
  callbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ paymentId: string; status: string; confirmationUrl: string; raw: unknown }> {
  const config = getKapitalBankConfig();
  const idempotencyKey = randomUUID();
  const payload = {
    type: "purchase",
    amount: input.amountAzn,
    currency: "AZN",
    merchantId: config.merchantId,
    terminalId: config.terminalId,
    orderId: input.merchantOrderId,
    description: input.description,
    callbackUrl: input.callbackUrl,
    confirmation: {
      type: "REDIRECT",
      successUrl: input.successUrl,
      failUrl: input.cancelUrl
    }
  };

  const data = await birPayFetch<{
    id?: string;
    status?: string;
    confirmationUrl?: string;
    confirmation?: { url?: string };
    payment?: { id?: string; status?: string; confirmationUrl?: string; confirmation?: { url?: string } };
  }>("/v1/payments", {
    method: "POST",
    headers: {
      "X-Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(payload)
  });

  const paymentId = data.id ?? data.payment?.id;
  const status = data.status ?? data.payment?.status ?? "pending";
  const confirmationUrl =
    data.confirmationUrl ??
    data.confirmation?.url ??
    data.payment?.confirmationUrl ??
    data.payment?.confirmation?.url;
  if (!paymentId || !confirmationUrl) {
    throw new Error("BirPay create payment cavabında id və ya confirmationUrl tapılmadı");
  }
  return { paymentId, status, confirmationUrl, raw: data };
}

export async function getBirPayPayment(paymentId: string): Promise<{ status: string; raw: unknown }> {
  const data = await birPayFetch<{ status?: string; payment?: { status?: string } }>(
    `/v1/payments/${encodeURIComponent(paymentId)}`,
    { method: "GET" }
  );
  return { status: data.status ?? data.payment?.status ?? "", raw: data };
}

export async function cancelBirPayPayment(paymentId: string): Promise<{ status: string; raw: unknown }> {
  const data = await birPayFetch<{ status?: string; payment?: { status?: string } }>(
    `/v1/payments/${encodeURIComponent(paymentId)}/cancel`,
    { method: "PUT" }
  );
  return { status: data.status ?? data.payment?.status ?? "", raw: data };
}

export async function createBirPayRefund(input: {
  paymentId: string;
  amountAzn: number;
  reason?: string;
}): Promise<{ refundId: string; status: string; raw: unknown }> {
  const data = await birPayFetch<{
    id?: string;
    status?: string;
    refund?: { id?: string; status?: string };
  }>("/v1/refunds", {
    method: "POST",
    headers: { "X-Idempotency-Key": randomUUID() },
    body: JSON.stringify({
      paymentId: input.paymentId,
      amount: input.amountAzn,
      reason: input.reason
    })
  });
  const refundId = data.id ?? data.refund?.id;
  const status = data.status ?? data.refund?.status ?? "";
  if (!refundId) throw new Error("BirPay refund cavabında id tapılmadı");
  return { refundId, status, raw: data };
}

export async function getBirPayRefund(refundId: string): Promise<{ status: string; raw: unknown }> {
  const data = await birPayFetch<{ status?: string; refund?: { status?: string } }>(
    `/v1/refunds/${encodeURIComponent(refundId)}`,
    { method: "GET" }
  );
  return { status: data.status ?? data.refund?.status ?? "", raw: data };
}

export async function getBirPayEvents(paymentId: string): Promise<{ events: Array<{ name: string; time: string }>; raw: unknown }> {
  const data = await birPayFetch<{ events?: Array<{ name: string; time: string }> }>(
    `/v1/events?paymentId=${encodeURIComponent(paymentId)}`,
    { method: "GET" }
  );
  return { events: Array.isArray(data.events) ? data.events : [], raw: data };
}
