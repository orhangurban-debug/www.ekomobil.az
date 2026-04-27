import { type ListingPlanPaymentRecord } from "@/lib/payments";

export type KapitalBankMode = "disabled" | "mock" | "live";
export type KapitalBankGateway = "birpay" | "legacy";

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

export interface KapitalBankLiveReadinessIssue {
  code:
    | "mode_not_live"
    | "missing_merchant_id"
    | "missing_terminal_id"
    | "missing_username"
    | "missing_password"
    | "missing_secret"
    | "missing_public_base_url"
    | "public_base_url_not_https"
    | "missing_api_base_url";
  message: string;
}

export interface KapitalBankReadinessWarning {
  code: "sandbox_endpoint" | "legacy_gateway";
  message: string;
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
  return getKapitalBankLiveReadinessIssues(config).length === 0;
}

export function getKapitalBankApiBaseUrl(config = getKapitalBankConfig()): string {
  return (config.apiBaseUrl?.replace(/\/$/, "") || "https://txpgtst.kapitalbank.az/api");
}

export function isKapitalBankSandboxEndpoint(config = getKapitalBankConfig()): boolean {
  const base = getKapitalBankApiBaseUrl(config).toLowerCase();
  return base.includes("txpgtst") || base.includes("sandbox") || base.includes("test");
}

export function isBirPayApiBaseUrl(config = getKapitalBankConfig()): boolean {
  const base = getKapitalBankApiBaseUrl(config).toLowerCase();
  return base.includes("birpay.az");
}

export function getKapitalBankGateway(config = getKapitalBankConfig()): KapitalBankGateway {
  return isBirPayApiBaseUrl(config) ? "birpay" : "legacy";
}

export function getKapitalBankLiveReadinessIssues(
  config = getKapitalBankConfig()
): KapitalBankLiveReadinessIssue[] {
  const issues: KapitalBankLiveReadinessIssue[] = [];
  if (config.mode !== "live") {
    issues.push({ code: "mode_not_live", message: "KAPITAL_BANK_MODE live deyil." });
    return issues;
  }
  if (!config.terminalId) {
    issues.push({ code: "missing_terminal_id", message: "KAPITAL_BANK_TERMINAL_ID boşdur." });
  }
  if (!config.username) {
    issues.push({ code: "missing_username", message: "KAPITAL_BANK_USERNAME boşdur." });
  }
  if (!config.password) {
    issues.push({ code: "missing_password", message: "KAPITAL_BANK_PASSWORD boşdur." });
  }
  if (!config.publicBaseUrl) {
    issues.push({ code: "missing_public_base_url", message: "NEXT_PUBLIC_APP_URL boşdur." });
  } else if (!config.publicBaseUrl.startsWith("https://")) {
    issues.push({
      code: "public_base_url_not_https",
      message: "NEXT_PUBLIC_APP_URL yalnız https ilə olmalıdır."
    });
  }
  if (!config.apiBaseUrl) {
    issues.push({
      code: "missing_api_base_url",
      message: "KAPITAL_BANK_API_BASE_URL boşdur və default test endpoint-ə düşür."
    });
  }

  if (getKapitalBankGateway(config) === "birpay") {
    if (!config.merchantId) {
      issues.push({ code: "missing_merchant_id", message: "BirPay üçün KAPITAL_BANK_MERCHANT_ID boşdur." });
    }
    if (!config.secret) {
      issues.push({ code: "missing_secret", message: "BirPay webhook imzası üçün KAPITAL_BANK_SECRET boşdur." });
    }
  }
  return issues;
}

export function getKapitalBankReadinessWarnings(config = getKapitalBankConfig()): KapitalBankReadinessWarning[] {
  const warnings: KapitalBankReadinessWarning[] = [];
  if (config.mode === "live" && isKapitalBankSandboxEndpoint(config)) {
    warnings.push({
      code: "sandbox_endpoint",
      message: "Bank test/UAT endpoint istifadə olunur; bu production canlı ödəniş deyil."
    });
  }
  if (config.mode === "live" && getKapitalBankGateway(config) === "legacy") {
    warnings.push({
      code: "legacy_gateway",
      message: "Kapital legacy gateway aktivdir; terminalRid + LOGIN + password ilə /order checkout yaradılır."
    });
  }
  return warnings;
}

export function isKapitalBankProductionReady(config = getKapitalBankConfig()): boolean {
  return isKapitalBankLiveReady(config) && !isKapitalBankSandboxEndpoint(config);
}

export function getKapitalBankGatewayLabel(config = getKapitalBankConfig()): string {
  if (getKapitalBankGateway(config) === "birpay") {
    return "BirPay / V1.4";
  }
  if (isKapitalBankSandboxEndpoint(config)) {
    return "Kapital legacy test gateway";
  }
  return "Kapital legacy gateway";
}

export function getKapitalBankProductionReadinessIssues(
  config = getKapitalBankConfig()
): KapitalBankLiveReadinessIssue[] {
  const issues = getKapitalBankLiveReadinessIssues(config);
  if (config.mode === "live" && isKapitalBankSandboxEndpoint(config)) {
    issues.push({
      code: "missing_api_base_url",
      message: "Production üçün test/sandbox olmayan KAPITAL_BANK_API_BASE_URL lazımdır."
    });
  }
  return issues;
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
