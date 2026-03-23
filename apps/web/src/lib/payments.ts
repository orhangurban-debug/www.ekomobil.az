export type ListingPlanPaymentStatus =
  | "pending"
  | "redirect_ready"
  | "succeeded"
  | "failed"
  | "cancelled";

export type ListingPlanPaymentSource = "publish" | "boost";
export type PaymentProvider = "kapital_bank";

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
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
