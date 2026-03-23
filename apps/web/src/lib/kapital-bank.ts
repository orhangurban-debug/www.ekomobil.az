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
}

export function getKapitalBankConfig(): KapitalBankConfig {
  return {
    mode: (process.env.KAPITAL_BANK_MODE as KapitalBankMode | undefined) ?? "disabled",
    merchantId: process.env.KAPITAL_BANK_MERCHANT_ID,
    terminalId: process.env.KAPITAL_BANK_TERMINAL_ID,
    username: process.env.KAPITAL_BANK_USERNAME,
    password: process.env.KAPITAL_BANK_PASSWORD,
    secret: process.env.KAPITAL_BANK_SECRET,
    publicBaseUrl: process.env.NEXT_PUBLIC_APP_URL
  };
}

export function isKapitalBankLiveReady(config = getKapitalBankConfig()): boolean {
  return Boolean(
    config.mode === "live" &&
      config.merchantId &&
      config.terminalId &&
      config.username &&
      config.password &&
      config.secret &&
      config.publicBaseUrl
  );
}

export function getKapitalBankCheckoutUrl(paymentId: string, config = getKapitalBankConfig()): string {
  const baseUrl = config.publicBaseUrl?.replace(/\/$/, "");
  if (baseUrl) {
    return `${baseUrl}/payments/listing-plan/${paymentId}`;
  }
  return `/payments/listing-plan/${paymentId}`;
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
