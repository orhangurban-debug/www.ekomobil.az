export type ServicePlanGroup = "official" | "inspection" | "mechanic";

export interface ServicePartnerPlanLimits {
  id: string;
  label: string;
  imageLimit: number;
  dailyAiLimit: number;
  tagLimit: number;
}

const PLANS: Record<ServicePlanGroup, ServicePartnerPlanLimits[]> = {
  official: [
    { id: "starter", label: "Filial", imageLimit: 6, dailyAiLimit: 6, tagLimit: 20 },
    { id: "pro", label: "Mərkəz", imageLimit: 12, dailyAiLimit: 12, tagLimit: 40 },
    { id: "premium", label: "Şəbəkə", imageLimit: 20, dailyAiLimit: 20, tagLimit: 80 }
  ],
  inspection: [
    { id: "starter", label: "Solo", imageLimit: 5, dailyAiLimit: 5, tagLimit: 12 },
    { id: "pro", label: "Mərkəz", imageLimit: 10, dailyAiLimit: 10, tagLimit: 24 },
    { id: "premium", label: "Şəbəkə", imageLimit: 16, dailyAiLimit: 16, tagLimit: 48 }
  ],
  mechanic: [
    { id: "free", label: "Pulsuz", imageLimit: 3, dailyAiLimit: 3, tagLimit: 5 },
    { id: "pro", label: "Usta Pro", imageLimit: 8, dailyAiLimit: 8, tagLimit: 15 },
    { id: "team", label: "Emalatxana", imageLimit: 15, dailyAiLimit: 15, tagLimit: 30 }
  ]
};

export function getServicePartnerPlanLimits(
  group: ServicePlanGroup,
  planId?: string
): ServicePartnerPlanLimits {
  const options = PLANS[group];
  return options.find((p) => p.id === planId) ?? options[0];
}

export function getServicePlanGroupForProvider(providerType: string): ServicePlanGroup {
  if (providerType === "official_service") return "official";
  if (providerType === "inspection_company") return "inspection";
  return "mechanic";
}
