import { getPgPool } from "@/lib/postgres";
import {
  PLATFORM_CONSENT_TYPES,
  type PlatformConsentType,
  requiredConsentVersions
} from "@/lib/legal-doc-versions";

export async function hasRequiredPlatformConsents(userId: string): Promise<boolean> {
  try {
    const pool = getPgPool();
    const versions = requiredConsentVersions();
    for (const consentType of PLATFORM_CONSENT_TYPES) {
      const result = await pool.query<{ id: string }>(
        `SELECT id FROM user_consent_acceptances
         WHERE user_id = $1 AND consent_type = $2 AND document_version = $3
         LIMIT 1`,
        [userId, consentType, versions[consentType]]
      );
      if (result.rows.length === 0) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function recordPlatformConsentAcceptance(input: {
  userId: string;
  consentType: PlatformConsentType;
  ipAddress?: string;
  userAgent?: string;
  source?: "register" | "oauth" | "reaccept" | "manual";
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const pool = getPgPool();
    const documentVersion = requiredConsentVersions()[input.consentType];
    await pool.query(
      `INSERT INTO user_consent_acceptances (user_id, consent_type, document_version, ip_address, user_agent, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, consent_type, document_version) DO NOTHING`,
      [
        input.userId,
        input.consentType,
        documentVersion,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.source ?? "manual"
      ]
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Razılaşma qeydə alınmadı" };
  }
}

export async function recordAllPlatformConsents(input: {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  source?: "register" | "oauth" | "reaccept" | "manual";
}): Promise<{ ok: boolean; error?: string }> {
  for (const consentType of PLATFORM_CONSENT_TYPES) {
    const result = await recordPlatformConsentAcceptance({
      userId: input.userId,
      consentType,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      source: input.source
    });
    if (!result.ok) return result;
  }
  return { ok: true };
}
