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
}

export interface AssignableStaff {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}
