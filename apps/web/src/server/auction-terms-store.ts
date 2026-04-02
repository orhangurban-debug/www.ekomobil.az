/**
 * Auksion şərt qəbulu server store
 *
 * İstifadəçinin alıcı (bidder) və ya satıcı (seller) kimi auksion
 * şərtlərini qəbul etdiyini `auction_terms_acceptances` cədvəlindən
 * oxuyur və yazır.
 *
 * CURRENT_TERMS_VERSION artımı:
 *   - Şərtlər məzmunca dəyişdikdə bu sabiti yeniləyin.
 *   - Köhnə versiya qəbulu etibarsız sayılır; istifadəçidən yenidən qəbul tələb olunur.
 */

import { getPgPool } from "@/lib/postgres";

export type AuctionTermsRole = "bidder" | "seller";

/** Şərt versiyasını buradan idarə edin */
export const CURRENT_TERMS_VERSION = "v1";

export interface TermsAcceptanceRecord {
  userId: string;
  role: AuctionTermsRole;
  termsVersion: string;
  acceptedAt: string;
}

/**
 * İstifadəçinin bu rol üçün cari şərt versiyasını qəbul edib-etmədiyini yoxlayır.
 */
export async function hasAcceptedAuctionTerms(
  userId: string,
  role: AuctionTermsRole
): Promise<boolean> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM auction_terms_acceptances
       WHERE user_id = $1 AND role = $2 AND terms_version = $3
       LIMIT 1`,
      [userId, role, CURRENT_TERMS_VERSION]
    );
    return result.rows.length > 0;
  } catch {
    // DB əlçatan deyilsə, blok etmirik — log üçün false qaytarırıq
    return false;
  }
}

/**
 * İstifadəçinin şərt qəbulunu qeyd edir (UPSERT — dublikat xəta vermir).
 */
export async function recordAuctionTermsAcceptance(input: {
  userId: string;
  role: AuctionTermsRole;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO auction_terms_acceptances (user_id, role, terms_version, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, role, terms_version) DO NOTHING`,
      [
        input.userId,
        input.role,
        CURRENT_TERMS_VERSION,
        input.ipAddress ?? null,
        input.userAgent ?? null
      ]
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinməyən xəta" };
  }
}
