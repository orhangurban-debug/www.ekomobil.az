import { getKapitalBankApiBaseUrl, getKapitalBankAppUrl, getKapitalBankConfig, isKapitalBankLiveReady } from "@/lib/kapital-bank";
import { getPgPool } from "@/lib/postgres";

export interface BankPaymentOrderRow {
  channel: "listing_plan" | "auction_deposit" | "auction_service";
  internalPaymentId: string;
  orderId: string;
  remoteOrderId?: string;
  amountAzn: number;
  status: string;
  paymentReference?: string;
  providerMode?: string;
  createdAt: string;
  checkoutUrl?: string;
}

export interface PaymentIntegrationReadiness {
  mode: "disabled" | "mock" | "live";
  liveReady: boolean;
  merchantId?: string;
  terminalId?: string;
  apiBaseUrl: string;
  callbackUrls: {
    listingPlan: string;
    auctionDeposit: string;
    auctionService: string;
    preauth: string;
  };
  webhookEvents: string[];
}

function parseOrderId(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "orderId" in payload) {
    const value = (payload as Record<string, unknown>).orderId;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function parseRemoteOrderId(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "remoteOrderId" in payload) {
    const value = (payload as Record<string, unknown>).remoteOrderId;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function parseProviderMode(payload: unknown): string | undefined {
  if (payload && typeof payload === "object" && "mode" in payload) {
    const value = (payload as Record<string, unknown>).mode;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function getPaymentIntegrationReadiness(): PaymentIntegrationReadiness {
  const config = getKapitalBankConfig();
  return {
    mode: config.mode,
    liveReady: isKapitalBankLiveReady(config),
    merchantId: config.merchantId,
    terminalId: config.terminalId,
    apiBaseUrl: getKapitalBankApiBaseUrl(config),
    callbackUrls: {
      listingPlan: getKapitalBankAppUrl("/api/payments/kapital-bank/callback", config),
      auctionDeposit: getKapitalBankAppUrl("/api/payments/auction-deposit/callback", config),
      auctionService: getKapitalBankAppUrl("/api/payments/auction-service/callback", config),
      preauth: getKapitalBankAppUrl("/api/payments/auction-preauth/callback", config)
    },
    webhookEvents: ["payment_succeeded", "payment_canceled"]
  };
}

export async function listBankPaymentOrders(limit = 300): Promise<BankPaymentOrderRow[]> {
  try {
    const pool = getPgPool();
    const [listingResult, depositResult, serviceResult] = await Promise.all([
      pool.query<{
        id: string;
        amount_azn: number;
        status: string;
        payment_reference: string | null;
        checkout_url: string | null;
        provider_payload: unknown;
        created_at: Date;
      }>(
        `SELECT id, amount_azn, status, provider_reference AS payment_reference, checkout_url, provider_payload, created_at
         FROM listing_plan_payments
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      ),
      pool.query<{
        id: string;
        amount_azn: number;
        status: string;
        payment_reference: string | null;
        checkout_url: string | null;
        provider_payload: unknown;
        created_at: Date;
      }>(
        `SELECT id, amount_azn, status, payment_reference, checkout_url, provider_payload, created_at
         FROM auction_deposits
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      ),
      pool.query<{
        id: string;
        amount_azn: number;
        status: string;
        payment_reference: string | null;
        checkout_url: string | null;
        provider_payload: unknown;
        created_at: Date;
      }>(
        `SELECT id, amount_azn, status, payment_reference, checkout_url, provider_payload, created_at
         FROM auction_financial_events
         WHERE provider = 'kapital_bank'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      )
    ]);

    const listingRows: BankPaymentOrderRow[] = listingResult.rows.map((row) => ({
      channel: "listing_plan",
      internalPaymentId: row.id,
      orderId: parseOrderId(row.provider_payload, row.id),
      remoteOrderId: parseRemoteOrderId(row.provider_payload),
      amountAzn: row.amount_azn,
      status: row.status,
      paymentReference: row.payment_reference ?? undefined,
      providerMode: parseProviderMode(row.provider_payload),
      createdAt: row.created_at.toISOString(),
      checkoutUrl: row.checkout_url ?? undefined
    }));
    const depositRows: BankPaymentOrderRow[] = depositResult.rows.map((row) => ({
      channel: "auction_deposit",
      internalPaymentId: row.id,
      orderId: parseOrderId(row.provider_payload, row.id),
      remoteOrderId: parseRemoteOrderId(row.provider_payload),
      amountAzn: row.amount_azn,
      status: row.status,
      paymentReference: row.payment_reference ?? undefined,
      providerMode: parseProviderMode(row.provider_payload),
      createdAt: row.created_at.toISOString(),
      checkoutUrl: row.checkout_url ?? undefined
    }));
    const serviceRows: BankPaymentOrderRow[] = serviceResult.rows.map((row) => ({
      channel: "auction_service",
      internalPaymentId: row.id,
      orderId: parseOrderId(row.provider_payload, row.id),
      remoteOrderId: parseRemoteOrderId(row.provider_payload),
      amountAzn: row.amount_azn,
      status: row.status,
      paymentReference: row.payment_reference ?? undefined,
      providerMode: parseProviderMode(row.provider_payload),
      createdAt: row.created_at.toISOString(),
      checkoutUrl: row.checkout_url ?? undefined
    }));

    return [...listingRows, ...depositRows, ...serviceRows]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  } catch {
    return [];
  }
}
