export interface SupportReporterContext {
  matchedUserId?: string;
  accountEmail?: string;
  accountRole?: string;
  accountStatus?: string;
  accountCreatedAt?: string;
  penaltyBalanceAzn?: number;
  otherRequestCount: number;
  openIncidentCount: number;
}

export interface DealerApplicationMeta {
  businessType?: "dealer" | "parts_store";
  businessName?: string;
  voen?: string | null;
  city?: string;
  phone?: string;
  website?: string | null;
  description?: string | null;
}

export interface ServicePartnerMeta {
  providerType?: string;
  name?: string;
  city?: string;
  address?: string;
  mapUrl?: string;
  about?: string;
  services?: string[];
  certifications?: string[];
  imageUrls?: string[];
  phone?: string;
  whatsapp?: string;
}

export interface SupportRequestMeta {
  dealerApplication?: DealerApplicationMeta;
  servicePartner?: ServicePartnerMeta;
  serviceSlug?: string;
  serviceId?: string;
  serviceStatus?: string;
  [key: string]: unknown;
}

export interface AdminSupportRequestRow {
  id: string;
  requestType: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  source: string;
  reporterUserId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  reporterIp?: string;
  reporterUserAgent?: string;
  listingId?: string;
  assignedToUserId?: string;
  assignedToEmail?: string;
  adminResponse?: string;
  internalNotes?: string;
  riskFlag: string;
  responseAt?: string;
  resolvedAt?: string;
  archivedAt?: string;
  lastActivityAt: string;
  createdAt: string;
  reporterContext?: SupportReporterContext;
  metadata?: SupportRequestMeta;
}

export interface AssignableStaff {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}
