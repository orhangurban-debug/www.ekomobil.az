export const REQUEST_TYPE_LABELS: Record<string, string> = {
  question: "Sual",
  problem: "Problem",
  complaint: "Şikayət",
  partnership: "Tərəfdaşlıq (köhnə)",
  dealer_apply: "Salon müraciəti",
  parts_apply: "Mağaza müraciəti",
  inspection_partner: "Ekspertiza/Servis tərəfdaşlığı",
  data_export: "Məlumat ixracı",
  data_rectification: "Məlumat düzəlişi",
  data_deletion: "Məlumat silinməsi",
  data_processing_objection: "Emala etiraz",
  other: "Digər"
};

export const STATUS_LABELS: Record<string, string> = {
  new: "Yeni",
  in_progress: "İcrada",
  waiting_user: "Cavab gözlənilir",
  resolved: "Həll edilib",
  closed: "Bağlanıb",
  archived: "Arxivdə"
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Aşağı",
  normal: "Normal",
  high: "Yüksək",
  urgent: "Təcili"
};

export type ContactIntent =
  | "support"
  | "complaint"
  | "partnership"
  | "dealer"
  | "partsStore"
  | "service"
  | "privacy"
  | "refund"
  | "legal"
  | "general";

export function buildTrustContactHref(input?: {
  type?: string;
  subject?: string;
}): string {
  const params = new URLSearchParams();
  if (input?.type) params.set("type", input.type);
  if (input?.subject) params.set("subject", input.subject);
  const query = params.toString();
  return query ? `/trust?${query}#support-request` : "/trust#support-request";
}

export const CONTACT_INTENTS: Record<
  ContactIntent,
  { label: string; href: string; variant: "primary" | "secondary" | "link" }
> = {
  general: {
    label: "Müraciət göndər",
    href: buildTrustContactHref({ type: "question" }),
    variant: "secondary"
  },
  support: {
    label: "Dəstək sorğusu",
    href: buildTrustContactHref({ type: "problem" }),
    variant: "primary"
  },
  complaint: {
    label: "Şikayət bildir",
    href: buildTrustContactHref({ type: "complaint" }),
    variant: "secondary"
  },
  partnership: {
    label: "Tərəfdaşlıq müraciəti",
    href: buildTrustContactHref({ type: "partnership" }),
    variant: "primary"
  },
  dealer: {
    label: "Salon müraciəti",
    href: "/dealer/apply",
    variant: "primary"
  },
  partsStore: {
    label: "Mağaza müraciəti",
    href: "/parts/apply",
    variant: "primary"
  },
  service: {
    label: "Servis tərəfdaşlığı",
    href: buildTrustContactHref({ type: "partnership", subject: "Servis tərəfdaşlığı" }),
    variant: "primary"
  },
  privacy: {
    label: "Məxfilik sorğusu",
    href: "/me/privacy",
    variant: "secondary"
  },
  refund: {
    label: "Refund sorğusu",
    href: buildTrustContactHref({ type: "complaint", subject: "Refund sorğusu" }),
    variant: "secondary"
  },
  legal: {
    label: "Hüquqi müraciət",
    href: buildTrustContactHref({ type: "question", subject: "Hüquqi müraciət" }),
    variant: "link"
  }
};
