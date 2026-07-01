import type { UserRole } from "@/lib/auth";
import type { BusinessAccountSnapshot } from "@/server/business-plan-store";

export function canAccessSalonPanel(role: UserRole): boolean {
  return role === "dealer" || role === "admin";
}

export function canPublishAsStore(role: UserRole, snapshot: BusinessAccountSnapshot): boolean {
  return role === "admin" || snapshot.magazaSubscriptionActive;
}

export function formatAccountTypeLabel(role: UserRole, snapshot: BusinessAccountSnapshot): string {
  if (role === "admin") return "Admin";
  if (role === "support") return "Dəstək";

  const labels: string[] = [];
  if (snapshot.salonRoleApproved) labels.push("Salon");
  if (snapshot.magazaSubscriptionActive) labels.push("Mağaza");
  if (labels.length > 0) return labels.join(" + ");
  return "Fərdi istifadəçi";
}

export function salonStatusLabel(snapshot: BusinessAccountSnapshot): string {
  if (snapshot.salonRoleApproved && snapshot.salonSubscriptionActive) {
    return snapshot.salonPlanName ? `Aktiv (${snapshot.salonPlanName})` : "Aktiv";
  }
  if (snapshot.salonRoleApproved) return "Təsdiqlənib — plan gözləyir";
  return "Aktiv deyil";
}

export function magazaStatusLabel(snapshot: BusinessAccountSnapshot): string {
  if (snapshot.magazaSubscriptionActive) {
    return snapshot.magazaPlanName ? `Aktiv (${snapshot.magazaPlanName})` : "Aktiv";
  }
  return "Aktiv deyil";
}
