import {
  SERVICE_PROVIDER_TYPE_LABELS,
  type ServiceProviderType
} from "@/lib/services-marketplace";

export interface ServicePartnerDraftInput {
  providerType: string;
  name: string;
  city: string;
  branchCities?: string[];
  address?: string;
  mapUrl?: string;
  about?: string;
  services?: string[];
  certifications?: string[];
  imageUrls?: string[];
  phone: string;
  whatsapp?: string;
}

const PROVIDER_ALIASES: Record<string, ServiceProviderType> = {
  official_service_center: "official_service",
  expert_company: "inspection_company",
  inspection: "inspection_company"
};

function parseMessageFields(message: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of message.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line
      .slice(0, idx)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    const value = line.slice(idx + 1).trim();
    if (value && value !== "-") fields[key] = value;
  }
  return fields;
}

function resolveProviderType(raw: string | undefined): ServiceProviderType | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, "_");
  if (normalized in SERVICE_PROVIDER_TYPE_LABELS) {
    return normalized as ServiceProviderType;
  }
  if (PROVIDER_ALIASES[normalized]) return PROVIDER_ALIASES[normalized];
  for (const [type, label] of Object.entries(SERVICE_PROVIDER_TYPE_LABELS)) {
    if (label.toLowerCase() === trimmed.toLowerCase()) {
      return type as ServiceProviderType;
    }
  }
  return null;
}

function splitList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSubject(subject: string): {
  name?: string;
  providerLabel?: string;
  city?: string;
} {
  const match = subject.match(/\[Servis Partnyor\]\s*(.+?)\s*•\s*(.+?)\s*•\s*(.+)$/i);
  if (!match) return {};
  return {
    name: match[1]?.trim(),
    providerLabel: match[2]?.trim(),
    city: match[3]?.trim()
  };
}

function draftFromMetadata(metadata: Record<string, unknown> | null | undefined): ServicePartnerDraftInput | null {
  const raw = metadata?.servicePartner;
  if (!raw || typeof raw !== "object") return null;
  const sp = raw as Record<string, unknown>;
  const providerType = typeof sp.providerType === "string" ? sp.providerType : "";
  const name = typeof sp.name === "string" ? sp.name.trim() : "";
  const city = typeof sp.city === "string" ? sp.city.trim() : "";
  const phone = typeof sp.phone === "string" ? sp.phone.trim() : "";
  if (!providerType || !name || !city || !phone) return null;
  return {
    providerType,
    name,
    city,
    branchCities: Array.isArray(sp.branchCities)
      ? sp.branchCities.filter((item): item is string => typeof item === "string")
      : undefined,
    address: typeof sp.address === "string" ? sp.address : undefined,
    mapUrl: typeof sp.mapUrl === "string" ? sp.mapUrl : undefined,
    about: typeof sp.about === "string" ? sp.about : undefined,
    services: Array.isArray(sp.services)
      ? sp.services.filter((item): item is string => typeof item === "string")
      : undefined,
    certifications: Array.isArray(sp.certifications)
      ? sp.certifications.filter((item): item is string => typeof item === "string")
      : undefined,
    imageUrls: Array.isArray(sp.imageUrls)
      ? sp.imageUrls.filter((item): item is string => typeof item === "string")
      : undefined,
    phone,
    whatsapp: typeof sp.whatsapp === "string" ? sp.whatsapp : undefined
  };
}

export function extractServicePartnerDraft(input: {
  message: string;
  subject: string;
  metadata?: Record<string, unknown> | null;
}): ServicePartnerDraftInput | null {
  const fromMeta = draftFromMetadata(input.metadata);
  if (fromMeta) return fromMeta;

  const fields = parseMessageFields(input.message);
  const subjectParts = parseSubject(input.subject);

  const providerRaw =
    fields.provider_type ||
    fields.providertype ||
    subjectParts.providerLabel;
  const providerType = resolveProviderType(providerRaw);
  const name = fields.name || subjectParts.name || "";
  const city = fields.city || subjectParts.city || "";
  const phone = fields.phone || fields.telefon || "";
  const whatsapp = fields.whatsapp || fields.whats_app || phone;
  const services = splitList(fields.services);
  const certifications = splitList(fields.certifications);
  const about = [fields.experience, fields.notes, fields.about].filter(Boolean).join("\n\n");

  if (!providerType || !name || !city || !phone) return null;

  return {
    providerType,
    name,
    city,
    branchCities: splitList(fields.branch_cities),
    address: fields.address,
    mapUrl: fields.map_link || fields.maplink || fields.map_url,
    about: about || undefined,
    services: services.length > 0 ? services : undefined,
    certifications: certifications.length > 0 ? certifications : undefined,
    phone,
    whatsapp
  };
}
