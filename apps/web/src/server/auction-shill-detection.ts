/**
 * Shill bid aşkarlaması
 *
 * 3 əsas ssenari:
 * 1. ip_collision   — eyni auksiona müxtəlif hesablardan eyni IP ilə bid
 * 2. seller_ip_match — alıcının IP-i satıcının əvvəlki IP-i ilə üst-üstə düşür
 * 3. bid_surge      — qısa zaman ərzində eyni IP-dən intensiv bidding (avtomatlaşdırılmış)
 */

import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

interface ShillFlagRow {
  id: string;
  auction_id: string;
  flag_type: string;
  detail: Record<string, unknown>;
  severity: string;
  reviewed: boolean;
  created_at: Date;
}

export interface ShillCheckResult {
  clean: boolean;
  flags: Array<{
    type: string;
    severity: "warning" | "critical";
    detail: Record<string, unknown>;
  }>;
}

/** Bid verilmədən əvvəl çağırılır. Xəbərdarlıq olduqda flag yaradır, critical-da bid bloklanır. */
export async function runShillBidCheck(input: {
  auctionId: string;
  bidderUserId: string;
  sellerUserId: string;
  ipHash: string | null;
  deviceFingerprint: string | null;
}): Promise<ShillCheckResult> {
  const { auctionId, bidderUserId, sellerUserId, ipHash } = input;
  const flags: ShillCheckResult["flags"] = [];

  if (!ipHash) return { clean: true, flags: [] };

  try {
    const pool = getPgPool();

    // Yoxlama 1: Alıcı satıcının özüdür (kritik)
    if (bidderUserId === sellerUserId) {
      flags.push({
        type: "self_bid",
        severity: "critical",
        detail: { bidderUserId, sellerUserId }
      });
    }

    // Yoxlama 2: Eyni IP-dən eyni auksiona başqa hesab bid verib (kritik)
    const ipCollision = await pool.query<{ count: string; other_users: string[] }>(
      `SELECT COUNT(DISTINCT bidder_user_id)::text AS count,
              ARRAY_AGG(DISTINCT bidder_user_id) AS other_users
       FROM auction_bids
       WHERE auction_id = $1 AND ip_hash = $2 AND bidder_user_id != $3`,
      [auctionId, ipHash, bidderUserId]
    );
    const collisionCount = parseInt(ipCollision.rows[0]?.count ?? "0");
    if (collisionCount > 0) {
      flags.push({
        type: "ip_collision",
        severity: "critical",
        detail: {
          ipHash,
          collidingUserCount: collisionCount,
          collidingUsers: ipCollision.rows[0]?.other_users ?? []
        }
      });
    }

    // Yoxlama 3: Bu IP-dən satıcı hesabı ilə bid (warning)
    // Satıcının son 30 gündəki IP-i ilə alıcının IP-i üst-üstə düşürsə şübhəli
    const sellerIpMatch = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM auction_bids ab
       JOIN auction_listings al ON al.id = ab.auction_id
       WHERE al.seller_user_id = $1 AND ab.ip_hash = $2 AND ab.bidder_user_id != $1
         AND ab.created_at > NOW() - INTERVAL '30 days'`,
      [sellerUserId, ipHash]
    );
    if (parseInt(sellerIpMatch.rows[0]?.count ?? "0") > 0) {
      flags.push({
        type: "seller_ip_match",
        severity: "warning",
        detail: { ipHash, sellerUserId }
      });
    }

    // Yoxlama 4: Qısa zaman ərzində intensiv bid (5 dəq içində 5+)
    const rapidBid = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM auction_bids
       WHERE auction_id = $1 AND ip_hash = $2 AND created_at > NOW() - INTERVAL '5 minutes'`,
      [auctionId, ipHash]
    );
    if (parseInt(rapidBid.rows[0]?.count ?? "0") >= 5) {
      flags.push({
        type: "bid_surge",
        severity: "warning",
        detail: { ipHash, bidCountIn5min: rapidBid.rows[0]?.count }
      });
    }

    // Flagları DB-yə yaz (yalnız yeni olanları)
    for (const flag of flags) {
      await pool.query(
        `INSERT INTO auction_shill_flags (id, auction_id, flag_type, detail, severity)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT DO NOTHING`,
        [randomUUID(), auctionId, flag.type, JSON.stringify(flag.detail), flag.severity]
      );
    }

    // Critical flag varsa auksion lotunu dondur və admin bildiriş yaz
    const hasCritical = flags.some((f) => f.severity === "critical");
    if (hasCritical) {
      await pool.query(
        `UPDATE auction_listings SET status = 'disputed', updated_at = NOW()
         WHERE id = $1 AND status IN ('live','extended')`,
        [auctionId]
      );
      await pool.query(
        `INSERT INTO auction_audit_logs (id, auction_id, action_type, detail)
         VALUES ($1, $2, 'shill_bid_freeze', $3)`,
        [
          randomUUID(),
          auctionId,
          `Shill bid aşkarlandı: ${flags.map((f) => f.type).join(", ")} — lot donduruldu`
        ]
      );
    }

    return { clean: flags.length === 0, flags };
  } catch {
    // Detection xətası ödəmə axınını bloklamasın — soft fail
    return { clean: true, flags: [] };
  }
}

export async function getAuctionShillFlags(auctionId: string): Promise<ShillFlagRow[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<ShillFlagRow>(
      `SELECT * FROM auction_shill_flags WHERE auction_id = $1 ORDER BY created_at DESC`,
      [auctionId]
    );
    return result.rows;
  } catch {
    return [];
  }
}

export async function markShillFlagReviewed(
  flagId: string,
  reviewedByUserId: string,
  note: string
): Promise<void> {
  try {
    const pool = getPgPool();
    await pool.query(
      `UPDATE auction_shill_flags
       SET reviewed = TRUE, reviewed_by_user_id = $1, review_note = $2
       WHERE id = $3`,
      [reviewedByUserId, note, flagId]
    );
  } catch {
    // best-effort
  }
}
