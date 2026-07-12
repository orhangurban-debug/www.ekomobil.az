import type { UserRole } from "@/lib/auth";

export type AdminCapability =
  | "users.read"
  | "users.write"
  | "users.assign_staff"
  | "users.delete"
  | "listings.moderate"
  | "business.manage"
  | "services.moderate"
  | "support.manage"
  | "finance.view"
  | "finance.manage"
  | "legal.manage"
  | "settings.manage"
  | "audit.view";

export type AdminStaffType =
  | "super_admin"
  | "moderation"
  | "operations"
  | "finance"
  | "support"
  | "custom";

export const ALL_ADMIN_CAPABILITIES: AdminCapability[] = [
  "users.read",
  "users.write",
  "users.assign_staff",
  "users.delete",
  "listings.moderate",
  "business.manage",
  "services.moderate",
  "support.manage",
  "finance.view",
  "finance.manage",
  "legal.manage",
  "settings.manage",
  "audit.view"
];

export const ADMIN_CAPABILITY_LABELS: Record<AdminCapability, string> = {
  "users.read": "İstifadəçiləri görmək",
  "users.write": "İstifadəçi profilini redaktə",
  "users.assign_staff": "Admin/staff təyin etmək",
  "users.delete": "İstifadəçi silmək",
  "listings.moderate": "Elan moderasiyası",
  "business.manage": "Biznes / salon / mağaza idarəsi",
  "services.moderate": "Servis / ekspertiza təsdiqi",
  "support.manage": "Dəstək sorğuları",
  "finance.view": "Maliyyəyə baxış",
  "finance.manage": "Maliyyə əməliyyatları",
  "legal.manage": "Hüquqi sorğular",
  "settings.manage": "Sistem / brend ayarları",
  "audit.view": "Audit jurnalları"
};

export const ADMIN_STAFF_TYPE_LABELS: Record<AdminStaffType, string> = {
  super_admin: "Super Admin",
  moderation: "Moderasiya",
  operations: "Biznes",
  finance: "Maliyyə",
  support: "Dəstək",
  custom: "Xüsusi"
};

export const ADMIN_STAFF_TYPE_DESCRIPTIONS: Record<AdminStaffType, string> = {
  super_admin: "Bütün səlahiyyətlər, digər adminləri təyin edə bilər",
  moderation: "Elan, servis və dəstək moderasiyası",
  operations: "Salon, mağaza və biznes plan idarəsi",
  finance: "Ödənişlər, invoys və vergi hesabatları",
  support: "Dəstək sorğuları və oxuma səlahiyyətləri",
  custom: "Səlahiyyətləri əl ilə seçin"
};

const PRESET_PERMISSIONS: Record<Exclude<AdminStaffType, "custom">, AdminCapability[]> = {
  super_admin: [...ALL_ADMIN_CAPABILITIES],
  moderation: [
    "users.read",
    "listings.moderate",
    "services.moderate",
    "support.manage",
    "audit.view"
  ],
  operations: [
    "users.read",
    "business.manage",
    "services.moderate",
    "listings.moderate",
    "audit.view"
  ],
  finance: [
    "users.read",
    "finance.view",
    "finance.manage",
    "audit.view"
  ],
  support: [
    "users.read",
    "listings.moderate",
    "services.moderate",
    "support.manage",
    "audit.view"
  ]
};

export function permissionsForStaffType(staffType: AdminStaffType): AdminCapability[] {
  if (staffType === "custom") return [];
  return [...PRESET_PERMISSIONS[staffType]];
}

export function roleForStaffType(staffType: AdminStaffType): Extract<UserRole, "admin" | "support"> {
  return staffType === "support" ? "support" : "admin";
}

export function isAdminStaffType(value: string): value is AdminStaffType {
  return value in ADMIN_STAFF_TYPE_LABELS;
}

export function sanitizeCapabilities(raw: unknown): AdminCapability[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(ALL_ADMIN_CAPABILITIES);
  const out: AdminCapability[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !allowed.has(item)) continue;
    if (!out.includes(item as AdminCapability)) out.push(item as AdminCapability);
  }
  return out;
}

export function resolveEffectivePermissions(input: {
  role: UserRole;
  staffType?: AdminStaffType | null;
  permissions?: AdminCapability[] | null;
}): AdminCapability[] {
  if (input.role !== "admin" && input.role !== "support") return [];

  // Legacy admin without grant row → full access
  if (!input.staffType) {
    return input.role === "admin" ? [...ALL_ADMIN_CAPABILITIES] : permissionsForStaffType("support");
  }

  if (input.staffType === "super_admin") return [...ALL_ADMIN_CAPABILITIES];

  const listed = sanitizeCapabilities(input.permissions ?? []);
  if (input.staffType === "custom") return listed;

  // Prefer stored permissions if present; otherwise preset
  return listed.length > 0 ? listed : permissionsForStaffType(input.staffType);
}

export function hasCapability(
  permissions: AdminCapability[],
  capability: AdminCapability
): boolean {
  return permissions.includes(capability);
}

export interface AdminGrantSummary {
  staffType: AdminStaffType;
  permissions: AdminCapability[];
}
