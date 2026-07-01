/** Platform sənəd versiyaları — material dəyişiklikdə artırın və yenidən qəbul tələb edin. */
export const CURRENT_TERMS_VERSION = "2026-07-01";
export const CURRENT_PRIVACY_VERSION = "2026-07-01";

export type PlatformConsentType = "terms" | "privacy";

export const PLATFORM_CONSENT_TYPES: PlatformConsentType[] = ["terms", "privacy"];

export function requiredConsentVersions(): Record<PlatformConsentType, string> {
  return {
    terms: CURRENT_TERMS_VERSION,
    privacy: CURRENT_PRIVACY_VERSION
  };
}
