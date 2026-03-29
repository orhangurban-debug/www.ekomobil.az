import { getPgPool } from "@/lib/postgres";
import { fetchAuctionApi } from "@/server/auction-api-client";
import {
  getAuctionAuditLogsMemory,
  getAuctionBidsMemory,
  getAuctionListingsMemory
} from "@/server/auction-memory";
import { assertAuctionMemoryFallbackAllowed } from "@/server/auction-runtime";

interface AuctionAuditLogRow {
  id: string;
  auction_id: string;
  actor_user_id: string | null;
  action_type: string;
  detail: string;
  created_at: Date;
  title_snapshot?: string;
}

interface AuctionOpsListingRow {
  id: string;
  title_snapshot: string;
  status: string;
  updated_at: Date;
  created_at: Date;
  dispute_reason: string | null;
}

interface SuspiciousBidRow {
  auction_id: string;
  title_snapshot: string;
  device_fingerprint: string;
  bidder_count: string;
  first_seen: Date;
}

export interface AuctionAuditLogEntry {
  id: string;
  auctionId: string;
  titleSnapshot?: string;
  actorUserId?: string;
  actionType: string;
  detail: string;
  createdAt: string;
}

export interface AuctionOpsCase {
  auctionId: string;
  titleSnapshot: string;
  status: string;
  reasonCode: string;
  message: string;
  createdAt: string;
  slaDueAt?: string;
}

export interface AuctionServiceTelemetry {
  connected: boolean;
  healthOk: boolean;
  metrics?: {
    bids?: {
      accepted?: number;
      rejected?: number;
      latency?: { avg?: number; max?: number };
      lockWait?: { avg?: number; max?: number };
    };
    realtime?: {
      viewerCount?: number;
      antiSnipingTriggers?: number;
    };
    payments?: {
      activationLag?: { avg?: number; max?: number };
    };
  };
}

export async function listAuctionAuditLogs(limit = 100): Promise<AuctionAuditLogEntry[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionAuditLogRow>(
      `SELECT aal.id, aal.auction_id, aal.actor_user_id, aal.action_type, aal.detail, aal.created_at, al.title_snapshot
       FROM auction_audit_logs aal
       JOIN auction_listings al ON al.id = aal.auction_id
       ORDER BY aal.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      auctionId: row.auction_id,
      titleSnapshot: row.title_snapshot,
      actorUserId: row.actor_user_id ?? undefined,
      actionType: row.action_type,
      detail: row.detail,
      createdAt: row.created_at.toISOString()
    }));
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getAuctionAuditLogsMemory()
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        auctionId: row.auctionId,
        actorUserId: row.actorUserId,
        actionType: row.actionType,
        detail: row.detail,
        titleSnapshot: getAuctionListingsMemory().find((item) => item.id === row.auctionId)?.titleSnapshot,
        createdAt: row.createdAt
      }));
  }
}

export async function listAuctionOpsCases(): Promise<AuctionOpsCase[]> {
  try {
    const pool = getPgPool();
    const [auctionCases, suspiciousCases] = await Promise.all([
      pool.query<AuctionOpsListingRow>(
        `SELECT id, title_snapshot, status, updated_at, created_at, dispute_reason
         FROM auction_listings
         WHERE status IN ('no_show', 'seller_breach', 'disputed', 'ended_pending_confirmation', 'buyer_confirmed', 'seller_confirmed')
         ORDER BY updated_at DESC
         LIMIT 30`
      ),
      pool.query<SuspiciousBidRow>(
        `SELECT ab.auction_id, al.title_snapshot, ab.device_fingerprint, COUNT(DISTINCT ab.bidder_user_id)::text AS bidder_count, MIN(ab.created_at) AS first_seen
         FROM auction_bids ab
         JOIN auction_listings al ON al.id = ab.auction_id
         WHERE ab.device_fingerprint IS NOT NULL
         GROUP BY ab.auction_id, al.title_snapshot, ab.device_fingerprint
         HAVING COUNT(DISTINCT ab.bidder_user_id) > 1
         ORDER BY MIN(ab.created_at) DESC
         LIMIT 20`
      )
    ]);

    const mappedCases: AuctionOpsCase[] = auctionCases.rows.map((row) => ({
      auctionId: row.id,
      titleSnapshot: row.title_snapshot,
      status: row.status,
      reasonCode:
        row.status === "disputed"
          ? "DISPUTE"
          : row.status === "no_show"
            ? "NO_SHOW"
            : row.status === "seller_breach"
              ? "SELLER_BREACH"
              : "OUTCOME_REVIEW",
      message:
        row.status === "disputed"
          ? row.dispute_reason ?? "Tərəflər arasında mübahisə bildirildi"
          : row.status === "no_show"
            ? "Qalib tərəf SLA daxilində növbəti addımı tamamlamadı"
            : row.status === "seller_breach"
              ? row.dispute_reason ?? "Satıcı öhdəliyinin pozulması qeydə alınıb"
              : "Buyer/seller confirmation hələ tam bağlanmayıb",
      createdAt: row.updated_at.toISOString(),
      slaDueAt: new Date(row.updated_at.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }));

    const suspiciousMapped: AuctionOpsCase[] = suspiciousCases.rows.map((row) => ({
      auctionId: row.auction_id,
      titleSnapshot: row.title_snapshot,
      status: "open",
      reasonCode: "SAME_DEVICE_MULTI_ACCOUNT",
      message: `Eyni cihaz izi ilə ${row.bidder_count} fərqli bidder aşkarlandı`,
      createdAt: row.first_seen.toISOString(),
      slaDueAt: new Date(row.first_seen.getTime() + 6 * 60 * 60 * 1000).toISOString()
    }));

    return [...mappedCases, ...suspiciousMapped].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const auctions = getAuctionListingsMemory();
    const openCases = auctions
      .filter((item) =>
        ["no_show", "seller_breach", "disputed", "ended_pending_confirmation", "buyer_confirmed", "seller_confirmed"].includes(item.status)
      )
      .map((item) => ({
        auctionId: item.id,
        titleSnapshot: item.titleSnapshot,
        status: item.status,
        reasonCode:
          item.status === "disputed"
            ? "DISPUTE"
            : item.status === "no_show"
              ? "NO_SHOW"
              : item.status === "seller_breach"
                ? "SELLER_BREACH"
                : "OUTCOME_REVIEW",
        message:
          item.status === "disputed"
            ? item.disputeReason ?? "Tərəflər arasında mübahisə bildirildi"
            : item.status === "no_show"
              ? "Qalib tərəf SLA daxilində növbəti addımı tamamlamadı"
              : item.status === "seller_breach"
                ? item.disputeReason ?? "Satıcı öhdəliyinin pozulması qeydə alınıb"
                : "Buyer/seller confirmation hələ tam bağlanmayıb",
        createdAt: item.updatedAt,
        slaDueAt: new Date(new Date(item.updatedAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
      }));

    const grouped = new Map<string, { auctionId: string; count: number; createdAt: string }>();
    for (const bid of getAuctionBidsMemory()) {
      if (!bid.deviceFingerprint) continue;
      const key = `${bid.auctionId}:${bid.deviceFingerprint}`;
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, { auctionId: bid.auctionId, count: 1, createdAt: bid.createdAt });
      } else {
        current.count += 1;
      }
    }

    const suspicious = [...grouped.values()]
      .filter((item) => item.count > 1)
      .map((item) => ({
        auctionId: item.auctionId,
        titleSnapshot: auctions.find((entry) => entry.id === item.auctionId)?.titleSnapshot ?? item.auctionId,
        status: "open",
        reasonCode: "SAME_DEVICE_MULTI_ACCOUNT",
        message: `Eyni cihaz izi ilə ${item.count} bid qeydi aşkarlandı`,
        createdAt: item.createdAt,
        slaDueAt: new Date(new Date(item.createdAt).getTime() + 6 * 60 * 60 * 1000).toISOString()
      }));

    return [...openCases, ...suspicious].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

export async function getAuctionServiceTelemetry(): Promise<AuctionServiceTelemetry> {
  const [healthResponse, metricsResponse] = await Promise.all([
    fetchAuctionApi("/health"),
    fetchAuctionApi("/metrics")
  ]);

  if (!healthResponse && !metricsResponse) {
    return { connected: false, healthOk: false };
  }

  return {
    connected: true,
    healthOk: Boolean(healthResponse?.ok),
    metrics: metricsResponse?.ok ? ((await metricsResponse.json()) as AuctionServiceTelemetry["metrics"]) : undefined
  };
}
