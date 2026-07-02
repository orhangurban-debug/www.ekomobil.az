export type InvoicePaymentType =
  | "listing_plan"
  | "business_plan"
  | "auction_deposit"
  | "listing_boost"
  | "auction_service";

export const INVOICE_PAYMENT_TYPE_LABELS: Record<InvoicePaymentType, string> = {
  listing_plan: "Elan planı",
  business_plan: "Biznes plan abunəsi",
  auction_deposit: "Auksion depoziti",
  listing_boost: "Elan irəlilətmə paketi",
  auction_service: "Auksion xidmət haqqı"
};

export const AUCTION_SERVICE_EVENT_LABELS: Record<string, string> = {
  lot_fee: "Lot yerləşdirmə haqqı",
  seller_success_fee: "Satıcı uğur komissiyası",
  no_show_penalty: "Gəlməmə cəzası",
  seller_breach_penalty: "Satıcı pozuntusu cəzası",
  seller_performance_bond: "Satıcı performans bondu"
};
