export type ListingPlanPaymentStatus =
  | "pending"
  | "redirect_ready"
  | "succeeded"
  | "failed"
  | "cancelled";

export type ListingPlanPaymentSource = "publish" | "boost";
export type PaymentProvider = "kapital_bank";
export type PaymentProviderMode = "disabled" | "mock" | "live";
export type PaymentCheckoutStrategy = "internal_placeholder" | "hosted_redirect_pending";

export interface PaymentProviderPayload {
  providerPaymentId: string;
  orderId: string;
  mode: PaymentProviderMode;
  amountAzn: number;
  amountMinor: number;
  currency: "AZN";
  description: string;
  callbackUrl: string;
  successUrl: string;
  cancelUrl: string;
  merchantId?: string;
  terminalId?: string;
  remoteOrderId?: string;
  remoteOrderPassword?: string;
  paymentPageUrl?: string;
  providerHost?: string;
  liveReady: boolean;
  requestDigest: string;
  notes: string[];
}

export interface ListingPlanPaymentRecord {
  id: string;
  listingId: string;
  ownerUserId: string;
  planType: "standard" | "vip";
  amountAzn: number;
  source: ListingPlanPaymentSource;
  provider: PaymentProvider;
  status: ListingPlanPaymentStatus;
  checkoutUrl: string;
  providerReference?: string;
  providerMode?: PaymentProviderMode;
  checkoutStrategy?: PaymentCheckoutStrategy;
  providerPayload?: PaymentProviderPayload;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
