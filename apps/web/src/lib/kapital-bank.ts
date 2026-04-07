import { type ListingPlanPaymentRecord } from "@/lib/payments";

export type KapitalBankMode = "disabled" | "mock" | "live";

export interface KapitalBankConfig {
  mode: KapitalBankMode;
  merchantId?: string;
  terminalId?: string;
  username?: string;
  password?: string;
  secret?: string;
  publicBaseUrl?: string;
  apiBaseUrl?: string;
}

export function getKapitalBankConfig(): KapitalBankConfig {
  return {
    mode: (process.env.KAPITAL_BANK_MODE as KapitalBankMode | undefined) ?? "disabled",
    merchantId: process.env.KAPITAL_BANK_MERCHANT_ID,
    terminalId: process.env.KAPITAL_BANK_TERMINAL_ID,
    username: process.env.KAPITAL_BANK_USERNAME,
    password: process.env.KAPITAL_BANK_PASSWORD,
    secret: process.env.KAPITAL_BANK_SECRET,
    publicBaseUrl: process.env.NEXT_PUBLIC_APP_URL,
    apiBaseUrl: process.env.KAPITAL_BANK_API_BASE_URL
  };
}

export function isKapitalBankLiveReady(config = getKapitalBankConfig()): boolean {
  return Boolean(
    config.mode === "live" &&
      config.username &&
      config.password &&
      config.publicBaseUrl
  );
}

export function getKapitalBankApiBaseUrl(config = getKapitalBankConfig()): string {
  return (config.apiBaseUrl?.replace(/\/$/, "") || "https://txpgtst.kapitalbank.az/api");
}

export function isBirPayApiBaseUrl(config = getKapitalBankConfig()): boolean {
  const base = getKapitalBankApiBaseUrl(config).toLowerCase();
  return base.includes("birpay.az");
}

export function getKapitalBankApiRoot(config = getKapitalBankConfig()): string {
  const base = getKapitalBankApiBaseUrl(config);
  return base.endsWith("/api") ? base : `${base}/api`;
}

export function getKapitalBankAppUrl(pathname: string, config = getKapitalBankConfig()): string {
  const baseUrl = config.publicBaseUrl?.replace(/\/$/, "");
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }
  return normalizedPath;
}

export function getKapitalBankCheckoutUrl(paymentId: string, config = getKapitalBankConfig()): string {
  return getKapitalBankAppUrl(`/payments/listing-plan/${paymentId}`, config);
}

export function getKapitalBankStatusLabel(payment: ListingPlanPaymentRecord): string {
  switch (payment.status) {
    case "succeeded":
      return "Ödəniş təsdiqləndi";
    case "failed":
      return "Ödəniş uğursuz oldu";
    case "cancelled":
      return "Ödəniş ləğv edildi";
    case "redirect_ready":
      return "Ödəniş səhifəsi hazırdır";
    default:
      return "Ödəniş gözlənilir";
  }
}
